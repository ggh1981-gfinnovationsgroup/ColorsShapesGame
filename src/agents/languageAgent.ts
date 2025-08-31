// src/agents/languageAgent.ts
import { BaseAgent, Task, TaskType, AgentRole, ToolName } from './types';
import { azureOpenAIService } from '../services/azureOpenAIFixed';
import * as Speech from 'expo-speech';

interface LanguageAgentData {
  languagePreferences: Record<string, any>;
  ttsHistory: any[];
  translationCache: Record<string, any>;
  pronunciationFeedback: Record<string, any>;
}

interface AgentResponse {
  success: boolean;
  data: any;
  reasoning: string;
  confidence: number;
}

interface TTSOptions {
  language: 'es' | 'en';
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface TranslationResult {
  originalText: string;
  translatedText: string;
  fromLanguage: 'es' | 'en';
  toLanguage: 'es' | 'en';
  confidence: number;
}

export class LanguageAgent implements BaseAgent {
  role: AgentRole = 'language_specialist';
  goal = 'Gestionar comunicación bilingüe, TTS y adaptación lingüística para optimizar el aprendizaje';
  backstory = 'Especialista en adquisición de lenguajes en la infancia y tecnologías de síntesis de voz educativa';
  capabilities: TaskType[] = [
    'provide_feedback'
  ];
  tools: ToolName[] = [
    'azure_openai',
    'tts_engine',
    'language_detector'
  ];
  verbose = false;

  memory: LanguageAgentData = {
    languagePreferences: {},
    ttsHistory: [],
    translationCache: {},
    pronunciationFeedback: {}
  };

  async processTask(task: Task): Promise<AgentResponse> {
    try {
      console.log(`[LanguageAgent] Processing task: ${task.type}`);
      
      switch (task.type) {
        case 'provide_feedback':
          return await this.provideBilingualFeedback(task);
        default:
          return this.getDefaultResponse(task);
      }
    } catch (error) {
      console.error('[LanguageAgent] Error processing task:', error);
      return this.getFallbackResponse(task);
    }
  }

  private async provideBilingualFeedback(task: Task): Promise<AgentResponse> {
    const metadata = task.metadata || {};
    const { 
      text,
      targetLanguage = 'es',
      context = 'general',
      isCorrect = true,
      colorName = '',
      childId = 'anonymous'
    } = metadata;

    try {
      // Determinar el mejor mensaje bilingüe
      const bilingualMessage = await this.createBilingualMessage(
        text, 
        targetLanguage, 
        context, 
        isCorrect,
        colorName
      );

      // Preparar opciones de TTS
      const ttsOptions = this.prepareTTSOptions(targetLanguage, childId);

      // Ejecutar TTS si es necesario
      const ttsResult = await this.speakMessage(bilingualMessage.primaryMessage, ttsOptions);

      // Actualizar memoria del agente
      this.updateLanguageMemory(childId, targetLanguage, bilingualMessage, ttsResult);

      return {
        success: true,
        data: {
          type: 'bilingual_feedback',
          primaryMessage: bilingualMessage.primaryMessage,
          secondaryMessage: bilingualMessage.secondaryMessage,
          translationInfo: bilingualMessage.translationInfo,
          ttsExecuted: ttsResult.success,
          languageUsed: targetLanguage,
          bilingualRatio: this.calculateBilingualRatio(childId)
        },
        reasoning: `Provided bilingual feedback in ${targetLanguage} with TTS support`,
        confidence: 0.9
      };
    } catch (error) {
      return this.getFallbackLanguageResponse(text, targetLanguage);
    }
  }

  private async createBilingualMessage(
    text: string,
    targetLanguage: 'es' | 'en',
    context: string,
    isCorrect: boolean,
    colorName: string
  ): Promise<any> {
    const otherLanguage = targetLanguage === 'es' ? 'en' : 'es';

    // Mensajes específicos para colores
    if (context === 'color_feedback' && colorName) {
      const colorMessages = this.getColorMessages(colorName, isCorrect);
      
      return {
        primaryMessage: colorMessages[targetLanguage],
        secondaryMessage: colorMessages[otherLanguage],
        translationInfo: {
          colorName,
          fromLanguage: targetLanguage,
          toLanguage: otherLanguage,
          confidence: 1.0
        }
      };
    }

    // Para otros contextos, usar traducción con IA
    const translatedText = await this.translateWithAI(text, targetLanguage, otherLanguage);

    return {
      primaryMessage: targetLanguage === 'es' ? text : translatedText,
      secondaryMessage: targetLanguage === 'es' ? translatedText : text,
      translationInfo: {
        originalText: text,
        translatedText,
        fromLanguage: targetLanguage,
        toLanguage: otherLanguage,
        confidence: 0.8
      }
    };
  }

  private getColorMessages(colorName: string, isCorrect: boolean): Record<string, string> {
    const colorTranslations: Record<string, { es: string, en: string }> = {
      red: { es: 'rojo', en: 'red' },
      blue: { es: 'azul', en: 'blue' },
      green: { es: 'verde', en: 'green' },
      yellow: { es: 'amarillo', en: 'yellow' },
      orange: { es: 'naranja', en: 'orange' },
      purple: { es: 'morado', en: 'purple' },
      pink: { es: 'rosa', en: 'pink' },
      brown: { es: 'marrón', en: 'brown' },
      black: { es: 'negro', en: 'black' },
      white: { es: 'blanco', en: 'white' }
    };

    const colorInfo = colorTranslations[colorName.toLowerCase()] || 
                     Object.values(colorTranslations).find(c => 
                       c.es === colorName.toLowerCase() || c.en === colorName.toLowerCase()
                     ) || 
                     { es: colorName, en: colorName };

    if (isCorrect) {
      return {
        es: `¡Muy bien! Es ${colorInfo.es} 🎉`,
        en: `Great! It's ${colorInfo.en} 🎉`
      };
    } else {
      return {
        es: `Es ${colorInfo.es}. ¡Inténtalo otra vez! 💪`,
        en: `It's ${colorInfo.en}. Try again! 💪`
      };
    }
  }

  private async translateWithAI(
    text: string, 
    fromLanguage: 'es' | 'en', 
    toLanguage: 'es' | 'en'
  ): Promise<string> {
    // Verificar caché primero
    const cacheKey = `${text}_${fromLanguage}_${toLanguage}`;
    if (this.memory.translationCache[cacheKey]) {
      return this.memory.translationCache[cacheKey];
    }

    const prompt = `Traduce este texto de ${fromLanguage === 'es' ? 'español' : 'inglés'} a ${toLanguage === 'es' ? 'español' : 'inglés'}:
    
"${text}"

Requisitos:
- Apropiado para niños de 3-7 años
- Mantener el tono emocional original
- Máximo simplicidad en vocabulario
- Solo devolver la traducción, sin explicaciones`;

    try {
      const aiResponse = await azureOpenAIService.generateChildResponse(
        'traductor', // childName
        25, // age (adult perspective)
        prompt, // context
        toLanguage // language
      );

      const translation = aiResponse.trim().replace(/["""]/g, '');
      
      // Guardar en caché
      this.memory.translationCache[cacheKey] = translation;
      
      return translation;
    } catch (error) {
      // Fallback a traducciones básicas
      return this.getFallbackTranslation(text, fromLanguage, toLanguage);
    }
  }

  private prepareTTSOptions(language: 'es' | 'en', childId: string): TTSOptions {
    // Obtener preferencias del niño si existen
    const userPrefs = this.memory.languagePreferences[childId] || {};
    
    return {
      language,
      voice: this.selectVoice(language, userPrefs),
      rate: userPrefs.speechRate || 0.6, // Más lento para niños
      pitch: userPrefs.pitch || 1.2, // Más agudo para ser más amigable
      volume: userPrefs.volume || 1.0
    };
  }

  private selectVoice(language: 'es' | 'en', preferences: any): string | undefined {
    const voiceOptions = {
      es: ['es-ES', 'es-MX', 'es-US'],
      en: ['en-US', 'en-GB', 'en-AU']
    };

    const availableVoices = voiceOptions[language];
    
    // Si hay preferencia guardada, usarla
    if (preferences.preferredVoice && availableVoices.includes(preferences.preferredVoice)) {
      return preferences.preferredVoice;
    }

    // Por defecto, usar las mejores opciones para niños
    return language === 'es' ? 'es-MX' : 'en-US';
  }

  private async speakMessage(message: string, options: TTSOptions): Promise<{ success: boolean, duration?: number }> {
    try {
      const startTime = Date.now();

      // Configurar opciones de Speech
      const speechOptions: any = {
        language: options.language === 'es' ? 'es-ES' : 'en-US',
        rate: options.rate || 0.6,
        pitch: options.pitch || 1.2,
        volume: options.volume || 1.0
      };

      // Ejecutar TTS
      await Speech.speak(message, speechOptions);

      const duration = Date.now() - startTime;

      // Guardar en historial
      this.memory.ttsHistory.push({
        message,
        language: options.language,
        duration,
        timestamp: Date.now(),
        success: true
      });

      return { success: true, duration };
    } catch (error) {
      console.error('[LanguageAgent] TTS Error:', error);
      
      this.memory.ttsHistory.push({
        message,
        language: options.language,
        timestamp: Date.now(),
        success: false,
        error: error
      });

      return { success: false };
    }
  }

  private calculateBilingualRatio(childId: string): { spanish: number, english: number } {
    const history = this.memory.ttsHistory.filter((entry: any) => 
      entry.timestamp > Date.now() - 24 * 60 * 60 * 1000 // Últimas 24 horas
    );

    if (history.length === 0) {
      return { spanish: 0.5, english: 0.5 };
    }

    const spanishCount = history.filter((entry: any) => entry.language === 'es').length;
    const englishCount = history.filter((entry: any) => entry.language === 'en').length;
    const total = spanishCount + englishCount;

    return {
      spanish: total > 0 ? spanishCount / total : 0.5,
      english: total > 0 ? englishCount / total : 0.5
    };
  }

  private updateLanguageMemory(
    childId: string, 
    language: 'es' | 'en', 
    message: any, 
    ttsResult: any
  ): void {
    // Actualizar preferencias del niño
    if (!this.memory.languagePreferences[childId]) {
      this.memory.languagePreferences[childId] = {
        primaryLanguage: language,
        bilingualBalance: 0.5,
        ttsPreferences: {},
        lastActive: Date.now()
      };
    }

    const prefs = this.memory.languagePreferences[childId];
    prefs.lastActive = Date.now();
    
    // Ajustar balance bilingüe basado en uso
    if (language === 'es') {
      prefs.bilingualBalance = Math.max(0.1, prefs.bilingualBalance - 0.05);
    } else {
      prefs.bilingualBalance = Math.min(0.9, prefs.bilingualBalance + 0.05);
    }

    // Guardar feedback sobre TTS si fue exitoso
    if (ttsResult.success) {
      if (!prefs.ttsPreferences[language]) {
        prefs.ttsPreferences[language] = { successCount: 0, totalAttempts: 0 };
      }
      prefs.ttsPreferences[language].successCount++;
      prefs.ttsPreferences[language].totalAttempts++;
    }
  }

  private getFallbackTranslation(text: string, fromLanguage: 'es' | 'en', toLanguage: 'es' | 'en'): string {
    // Traducciones básicas hardcodeadas para casos críticos
    const basicTranslations: Record<string, { es: string, en: string }> = {
      'good job': { es: '¡Bien hecho!', en: 'Good job!' },
      'try again': { es: '¡Inténtalo otra vez!', en: 'Try again!' },
      'correct': { es: '¡Correcto!', en: 'Correct!' },
      'wrong': { es: 'Incorrecto', en: 'Wrong' },
      'great': { es: '¡Genial!', en: 'Great!' },
      'excellent': { es: '¡Excelente!', en: 'Excellent!' }
    };

    const textLower = text.toLowerCase();
    const translation = basicTranslations[textLower];
    
    if (translation) {
      return translation[toLanguage];
    }

    // Si no hay traducción disponible, devolver el texto original
    return text;
  }

  private getFallbackLanguageResponse(text: string, language: 'es' | 'en'): AgentResponse {
    const fallbackMessages = {
      es: '¡Muy bien! 🌟',
      en: 'Great job! 🌟'
    };

    return {
      success: true,
      data: {
        type: 'simple_feedback',
        primaryMessage: fallbackMessages[language],
        secondaryMessage: fallbackMessages[language === 'es' ? 'en' : 'es'],
        ttsExecuted: false
      },
      reasoning: 'Fallback language response due to error',
      confidence: 0.6
    };
  }

  private getDefaultResponse(task: Task): AgentResponse {
    return {
      success: false,
      data: null,
      reasoning: `LanguageAgent cannot handle task type: ${task.type}`,
      confidence: 0
    };
  }

  private getFallbackResponse(task: Task): AgentResponse {
    return {
      success: true,
      data: {
        type: 'basic_language',
        message: 'Procesamiento de lenguaje básico completado'
      },
      reasoning: 'Fallback language response due to error',
      confidence: 0.4
    };
  }

  // Métodos públicos para gestión de idiomas
  async detectLanguage(text: string): Promise<'es' | 'en'> {
    // Detección simple basada en palabras comunes
    const spanishWords = ['el', 'la', 'es', 'un', 'una', 'que', 'de', 'y', 'en', 'muy', 'bien'];
    const englishWords = ['the', 'is', 'a', 'an', 'that', 'of', 'and', 'in', 'very', 'good'];

    const words = text.toLowerCase().split(/\s+/);
    let spanishScore = 0;
    let englishScore = 0;

    words.forEach(word => {
      if (spanishWords.includes(word)) spanishScore++;
      if (englishWords.includes(word)) englishScore++;
    });

    return spanishScore > englishScore ? 'es' : 'en';
  }

  getLanguagePreferences(childId: string): any {
    return this.memory.languagePreferences[childId] || null;
  }

  updateLanguagePreference(childId: string, preferences: any): void {
    this.memory.languagePreferences[childId] = {
      ...this.memory.languagePreferences[childId],
      ...preferences,
      lastUpdated: Date.now()
    };
  }

  getTTSHistory(): any[] {
    return this.memory.ttsHistory.slice(-20); // Últimas 20 interacciones TTS
  }
}

export const languageAgent = new LanguageAgent();
