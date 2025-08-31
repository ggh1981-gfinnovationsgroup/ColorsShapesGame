// src/agents/motivationAgent.ts
import { BaseAgent, Task, TaskType, AgentRole, ToolName } from './types';
import { azureOpenAIService } from '../services/azureOpenAIFixed';

interface MotivationAgentData {
  celebrationHistory: any[];
  encouragementPatterns: Record<string, any>;
  motivationalStrategies: string[];
  childPreferences: Record<string, any>;
}

interface AgentResponse {
  success: boolean;
  data: any;
  reasoning: string;
  confidence: number;
}

export class MotivationAgent implements BaseAgent {
  role: AgentRole = 'motivation_specialist';
  goal = 'Mantener alta motivación y engagement del niño a través de celebraciones y estímulos positivos';
  backstory = 'Especialista en psicología infantil y motivación, experto en crear experiencias de aprendizaje emocionalmente positivas';
  capabilities: TaskType[] = [
    'create_celebration',
    'provide_feedback'
  ];
  tools: ToolName[] = [
    'azure_openai',
    'tts_engine',
    'celebration_generator'
  ];
  verbose = false;

  memory: MotivationAgentData = {
    celebrationHistory: [],
    encouragementPatterns: {},
    motivationalStrategies: ['celebration', 'achievement', 'progress', 'effort-praise'],
    childPreferences: {}
  };

  async processTask(task: Task): Promise<AgentResponse> {
    try {
      console.log(`[MotivationAgent] Processing task: ${task.type}`);
      
      switch (task.type) {
        case 'create_celebration':
          return await this.generateCelebration(task);
        case 'provide_feedback':
          return await this.provideEncouragement(task);
        default:
          return this.getDefaultResponse(task);
      }
    } catch (error) {
      console.error('[MotivationAgent] Error processing task:', error);
      return this.getFallbackResponse(task);
    }
  }

  private async generateCelebration(task: Task): Promise<AgentResponse> {
    const metadata = task.metadata || {};
    const { correctAnswers = 1, gameType = 'colors', language = 'es' } = metadata;

    // Preparar el contexto para Azure OpenAI
    const prompt = this.buildCelebrationPrompt(correctAnswers, gameType, language);
    
    try {
      const aiResponse = await azureOpenAIService.generateChildResponse(
        'amiguito', // childName
        5, // age
        prompt, // context
        language as 'es' | 'en'
      );

      const celebration = this.parseCelebrationResponse(aiResponse);
      
      // Guardar en memoria
      this.memory.celebrationHistory.push({
        type: 'celebration',
        correctAnswers,
        gameType,
        language,
        message: celebration.message,
        timestamp: Date.now()
      });

      return {
        success: true,
        data: {
          type: 'celebration',
          message: celebration.message,
          animation: celebration.animation,
          sound: celebration.sound,
          duration: celebration.duration || 2000
        },
        reasoning: `Generated celebration for ${correctAnswers} correct answers in ${gameType} game`,
        confidence: 0.9
      };
    } catch (error) {
      return this.getFallbackCelebration(correctAnswers, language);
    }
  }

  private async provideEncouragement(task: Task): Promise<AgentResponse> {
    const metadata = task.metadata || {};
    const { incorrectAnswers = 0, gameType = 'colors', language = 'es' } = metadata;

    const prompt = this.buildEncouragementPrompt(incorrectAnswers, gameType, language);
    
    try {
      const aiResponse = await azureOpenAIService.generateChildResponse(
        'amiguito', // childName
        5, // age  
        prompt, // context
        language as 'es' | 'en'
      );

      const encouragement = this.parseEncouragementResponse(aiResponse);
      
      return {
        success: true,
        data: {
          type: 'encouragement',
          message: encouragement.message,
          tone: encouragement.tone,
          supportLevel: this.calculateSupportLevel(incorrectAnswers)
        },
        reasoning: `Provided encouragement after ${incorrectAnswers} incorrect attempts`,
        confidence: 0.85
      };
    } catch (error) {
      return this.getFallbackEncouragement(language);
    }
  }

  private async recognizeAchievement(task: Task): Promise<AgentResponse> {
    const metadata = task.metadata || {};
    const { achievement, streak = 0, language = 'es' } = metadata;

    const achievementMessages = {
      es: {
        first_correct: 'Tu primera respuesta correcta! 🎯',
        streak_5: '5 seguidas! Eres increible! 🌟',
        streak_10: '10 en fila! Eres un campeon! 🏆',
        color_master: 'Eres un maestro de los colores! 🎨',
        speed_demon: 'Que rapido! ⚡',
        persistent: 'Nunca te rindes! 💪'
      },
      en: {
        first_correct: 'Your first correct answer! 🎯',
        streak_5: '5 in a row! You are amazing! 🌟',
        streak_10: '10 in a row! You are a champion! 🏆',
        color_master: 'You are a color master! 🎨',
        speed_demon: 'So fast! ⚡',
        persistent: 'You never give up! 💪'
      }
    };

    const messages = achievementMessages[language as keyof typeof achievementMessages] || achievementMessages.es;
    const message = messages[achievement as keyof typeof messages] || messages.first_correct;

    return {
      success: true,
      data: {
        type: 'achievement',
        achievement,
        message,
        badge: this.selectBadge(achievement),
        celebration: true
      },
      reasoning: `Recognized achievement: ${achievement}`,
      confidence: 1.0
    };
  }

  private buildCelebrationPrompt(correctAnswers: number, gameType: string, language: string): string {
    return `Genera un mensaje corto de celebración para un niño que acertó ${correctAnswers} respuestas en un juego de ${gameType}. 
Idioma: ${language}
Máximo 10 palabras, incluye emoji apropiado, edad 3-7 años, muy positivo.
Ejemplo: ¡Súper bien! ¡3 colores correctos! 🌈`;
  }

  private buildEncouragementPrompt(incorrectAnswers: number, gameType: string, language: string): string {
    return `Genera un mensaje suave de aliento para un niño que cometió ${incorrectAnswers} errores en un juego de ${gameType}.
Idioma: ${language}
Máximo 8 palabras, apoyo sin desánimo, edad 3-7 años, enfoque en esfuerzo.
Ejemplo: ¡Está bien! ¡Sigamos intentando! 💪`;
  }

  private parseCelebrationResponse(response: string): any {
    const animations = ['bounce', 'spin', 'pulse', 'shake'];
    const sounds = ['cheer', 'applause', 'victory', 'happy'];
    
    return {
      message: response.trim(),
      animation: animations[Math.floor(Math.random() * animations.length)],
      sound: sounds[Math.floor(Math.random() * sounds.length)],
      duration: 2000 + (Math.random() * 1000)
    };
  }

  private parseEncouragementResponse(response: string): any {
    return {
      message: response.trim(),
      tone: 'supportive'
    };
  }

  private calculateSupportLevel(incorrectAnswers: number): string {
    if (incorrectAnswers <= 1) return 'gentle';
    if (incorrectAnswers <= 3) return 'moderate';
    return 'strong';
  }

  private selectBadge(achievement: string): string {
    const badges = {
      first_correct: '🎯',
      streak_5: '🌟',
      streak_10: '🏆',
      color_master: '🎨',
      speed_demon: '⚡',
      persistent: '💪'
    };
    
    return badges[achievement as keyof typeof badges] || '⭐';
  }

  private getFallbackCelebration(correctAnswers: number, language: string): AgentResponse {
    const messages = {
      es: [`¡Muy bien! 🎉`, `¡Excelente! ⭐`, `¡Genial! 🌟`],
      en: [`Very good! 🎉`, `Excellent! ⭐`, `Great! 🌟`]
    };
    
    const messageArray = messages[language as keyof typeof messages] || messages.es;
    const message = messageArray[Math.floor(Math.random() * messageArray.length)];

    return {
      success: true,
      data: {
        type: 'celebration',
        message,
        animation: 'bounce',
        sound: 'cheer',
        duration: 2000
      },
      reasoning: 'Fallback celebration message',
      confidence: 0.7
    };
  }

  private getFallbackEncouragement(language: string): AgentResponse {
    const messages = {
      es: '¡Inténtalo otra vez! 💪',
      en: 'Try again! 💪'
    };
    
    return {
      success: true,
      data: {
        type: 'encouragement',
        message: messages[language as keyof typeof messages] || messages.es,
        tone: 'supportive',
        supportLevel: 'moderate'
      },
      reasoning: 'Fallback encouragement message',
      confidence: 0.6
    };
  }

  private getDefaultResponse(task: Task): AgentResponse {
    return {
      success: false,
      data: null,
      reasoning: `MotivationAgent cannot handle task type: ${task.type}`,
      confidence: 0
    };
  }

  private getFallbackResponse(task: Task): AgentResponse {
    return {
      success: true,
      data: {
        type: 'general-motivation',
        message: '¡Sigue adelante! 🌟',
        tone: 'encouraging'
      },
      reasoning: 'Fallback motivational response due to error',
      confidence: 0.5
    };
  }
}

export const motivationAgent = new MotivationAgent();
