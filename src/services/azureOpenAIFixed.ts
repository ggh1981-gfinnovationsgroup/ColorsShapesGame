import OpenAI from 'openai';
import {
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_DEPLOYMENT_NAME,
  AZURE_OPENAI_API_VERSION,
} from '@env';

class AzureOpenAIService {
  private client: OpenAI;
  private deploymentName: string;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000; // 2 segundos entre requests para evitar rate limits

  constructor() {
    this.deploymentName = AZURE_OPENAI_DEPLOYMENT_NAME;
    
    this.client = new OpenAI({
      apiKey: AZURE_OPENAI_API_KEY,
      baseURL: `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}`,
      defaultQuery: { 'api-version': AZURE_OPENAI_API_VERSION },
      defaultHeaders: {
        'api-key': AZURE_OPENAI_API_KEY,
      },
    });
  }

  /**
   * Rate limiting wrapper para las llamadas a OpenAI
   */
  private async rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    return await this.retryWithBackoff(requestFn, 3);
  }

  /**
   * Implementa retry con exponential backoff
   */
  private async retryWithBackoff<T>(
    requestFn: () => Promise<T>, 
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        console.log(`Azure OpenAI attempt ${attempt} failed:`, error.message);
        
        // Si es un error 429 (rate limit), esperamos más tiempo
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('rate limit')) {
          const waitTime = Math.min(10000 * Math.pow(2, attempt), 60000); // Max 60 segundos
          console.log(`Rate limit detected, waiting ${waitTime}ms before retry...`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        // Si es el último intento, lanza el error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Para otros errores, espera menos tiempo
        const waitTime = 1000 * attempt;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Fallback responses para cuando Azure OpenAI no esté disponible
   */
  private getFallbackResponse(language: 'es' | 'en', type: 'hint' | 'celebration' | 'feedback' | 'general'): string {
    const fallbacks = {
      es: {
        hint: [
          '¡Mira los colores con atención! 🌈',
          '¿Puedes encontrar el color que buscamos? 🔍',
          '¡Tómate tu tiempo! Lo estás haciendo genial. 👍',
          '¡Casi lo tienes! Sigue intentando. ⭐'
        ],
        celebration: [
          '¡Excelente trabajo! 🎉',
          '¡Eres increíble! 🌟',
          '¡Lo lograste! 🎈',
          '¡Fantástico! 🎊'
        ],
        feedback: [
          '¡Buen trabajo! Sigue practicando. 👏',
          '¡Lo estás haciendo muy bien! 🎯',
          '¡Cada vez mejor! 📈',
          '¡Sigue así! 💪'
        ],
        general: [
          '¡Sigues mejorando! 🚀',
          '¡Eres genial! ✨',
          '¡No te rindas! 💫'
        ]
      },
      en: {
        hint: [
          'Look at the colors carefully! 🌈',
          'Can you find the color we\'re looking for? 🔍',
          'Take your time! You\'re doing great. 👍',
          'Almost there! Keep trying. ⭐'
        ],
        celebration: [
          'Excellent work! 🎉',
          'You\'re amazing! 🌟',
          'You did it! 🎈',
          'Fantastic! 🎊'
        ],
        feedback: [
          'Good job! Keep practicing. 👏',
          'You\'re doing very well! 🎯',
          'Getting better! 📈',
          'Keep it up! 💪'
        ],
        general: [
          'Keep improving! 🚀',
          'You\'re awesome! ✨',
          'Don\'t give up! 💫'
        ]
      }
    };

    const messages = fallbacks[language][type];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Genera respuesta personalizada para niño basada en su perfil
   */
  async generateChildResponse(
    childName: string,
    age: number,
    context: string,
    language: 'es' | 'en' = 'es'
  ): Promise<string> {
    try {
      const systemPrompt = this.getSystemPrompt(age, language);
      const userPrompt = this.getUserPrompt(childName, context, language);

      return await this.rateLimitedRequest(async () => {
        const response = await this.client.chat.completions.create({
          model: this.deploymentName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 100,
          temperature: 0.7,
          top_p: 0.9,
        });

        return response.choices[0]?.message?.content || this.getFallbackResponse(language, 'general');
      });
    } catch (error) {
      console.error('Error generating child response:', error);
      return this.getFallbackResponse(language, 'general');
    }
  }

  /**
   * Genera hint personalizado para juego de colores
   */
  async generateColorHint(
    childName: string,
    age: number,
    targetColor: string,
    targetColorSpanish: string,
    mistakes: number,
    language: 'es' | 'en' = 'es'
  ): Promise<string> {
    try {
      // Si hay muchos errores o problemas de rate limit, usa fallback inmediatamente
      if (mistakes > 2) {
        return this.getFallbackResponse(language, 'hint');
      }

      const systemPrompt = this.getGameSystemPrompt(age, language);
      const context = language === 'es' 
        ? `${childName} está jugando y necesita encontrar el color ${targetColorSpanish}. Ha cometido ${mistakes} errores y necesita una pista motivadora.`
        : `${childName} is playing and needs to find the color ${targetColor}. They have made ${mistakes} mistakes and need a motivating hint.`;

      return await this.rateLimitedRequest(async () => {
        const response = await this.client.chat.completions.create({
          model: this.deploymentName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: context },
          ],
          max_tokens: 80,
          temperature: 0.8,
          top_p: 0.9,
        });

        return response.choices[0]?.message?.content || this.getFallbackResponse(language, 'hint');
      });
    } catch (error) {
      console.error('Error generating color hint:', error);
      return this.getFallbackResponse(language, 'hint');
    }
  }

  /**
   * Genera celebración personalizada por logro
   */
  async generateCelebration(
    childName: string,
    age: number,
    achievement: 'correct_answer' | 'level_up' | 'high_score' | 'no_mistakes',
    score: number,
    level: number,
    language: 'es' | 'en' = 'es'
  ): Promise<string> {
    try {
      const systemPrompt = this.getGameSystemPrompt(age, language);
      const context = language === 'es'
        ? `${childName} acaba de lograr: ${this.getAchievementText(achievement, language)}. Su puntuación es ${score} y está en el nivel ${level}. Genera una celebración emocionante y personalizada.`
        : `${childName} just achieved: ${this.getAchievementText(achievement, language)}. Their score is ${score} and they are at level ${level}. Generate an exciting and personalized celebration.`;

      return await this.rateLimitedRequest(async () => {
        const response = await this.client.chat.completions.create({
          model: this.deploymentName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: context },
          ],
          max_tokens: 80,
          temperature: 0.9,
          top_p: 0.95,
        });

        return response.choices[0]?.message?.content || this.getFallbackResponse(language, 'celebration');
      });
    } catch (error) {
      console.error('Error generating celebration:', error);
      return this.getFallbackResponse(language, 'celebration');
    }
  }

  /**
   * Genera feedback motivacional personalizado
   */
  async generateMotivationalFeedback(
    childName: string,
    age: number,
    gameContext: {
      correctAnswers: number;
      mistakes: number;
      timeSpent: number;
      difficulty: 'easy' | 'medium' | 'hard';
    },
    language: 'es' | 'en' = 'es'
  ): Promise<string> {
    try {
      const systemPrompt = this.getGameSystemPrompt(age, language);
      const context = language === 'es'
        ? `${childName} (${age} años) terminó una sesión de juego. Respuestas correctas: ${gameContext.correctAnswers}, errores: ${gameContext.mistakes}, tiempo: ${gameContext.timeSpent} segundos, dificultad: ${gameContext.difficulty}. Proporciona feedback motivacional y constructivo.`
        : `${childName} (${age} years old) finished a game session. Correct answers: ${gameContext.correctAnswers}, mistakes: ${gameContext.mistakes}, time: ${gameContext.timeSpent} seconds, difficulty: ${gameContext.difficulty}. Provide motivational and constructive feedback.`;

      return await this.rateLimitedRequest(async () => {
        const response = await this.client.chat.completions.create({
          model: this.deploymentName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: context },
          ],
          max_tokens: 100,
          temperature: 0.7,
          top_p: 0.9,
        });

        return response.choices[0]?.message?.content || this.getFallbackResponse(language, 'feedback');
      });
    } catch (error) {
      console.error('Error generating feedback:', error);
      return this.getFallbackResponse(language, 'feedback');
    }
  }

  private getSystemPrompt(age: number, language: 'es' | 'en'): string {
    if (language === 'es') {
      return `Eres un asistente educativo especializado en niños de ${age} años. 
      Tu tarea es:
      - Usar un lenguaje simple y apropiado para la edad
      - Ser siempre positivo y alentador
      - Hacer que el aprendizaje sea divertido
      - Usar emojis ocasionalmente
      - Mantener respuestas cortas (máximo 2 oraciones)
      - Enfocarte en colores y formas geométricas
      - Celebrar cada pequeño logro`;
    } else {
      return `You are an educational assistant specialized in ${age}-year-old children.
      Your task is:
      - Use simple, age-appropriate language
      - Always be positive and encouraging
      - Make learning fun
      - Use emojis occasionally
      - Keep responses short (maximum 2 sentences)
      - Focus on colors and geometric shapes
      - Celebrate every small achievement`;
    }
  }

  private getGameSystemPrompt(age: number, language: 'es' | 'en'): string {
    if (language === 'es') {
      return `Eres un asistente de juegos educativos especializado en niños de ${age} años.
      
      DIRECTRICES ESPECÍFICAS:
      - Usa un lenguaje muy simple y alegre apropiado para ${age} años
      - Sé extremadamente positivo y entusiasta
      - Incluye emojis relacionados con colores y celebración
      - Mantén las respuestas MUY cortas (1-2 oraciones máximo)
      - Enfócate en el esfuerzo, no solo en el resultado
      - Usa palabras que un niño de ${age} años pueda entender
      - Haz referencias a cosas que les gustan a los niños (animales, juguetes, etc.)
      - Siempre termina con algo motivador`;
    } else {
      return `You are an educational games assistant specialized in ${age}-year-old children.
      
      SPECIFIC GUIDELINES:
      - Use very simple and cheerful language appropriate for ${age} years old
      - Be extremely positive and enthusiastic
      - Include emojis related to colors and celebration
      - Keep responses VERY short (1-2 sentences maximum)
      - Focus on effort, not just results
      - Use words that a ${age}-year-old can understand
      - Make references to things children like (animals, toys, etc.)
      - Always end with something motivating`;
    }
  }

  private getUserPrompt(childName: string, context: string, language: 'es' | 'en'): string {
    if (language === 'es') {
      return `${childName ? `${childName} necesita` : 'Un niño necesita'} ayuda con: ${context}. 
      Por favor responde de manera alentadora y educativa.`;
    } else {
      return `${childName ? `${childName} needs` : 'A child needs'} help with: ${context}. 
      Please respond in an encouraging and educational way.`;
    }
  }

  private getAchievementText(achievement: string, language: 'es' | 'en'): string {
    const achievements = {
      es: {
        correct_answer: 'respuesta correcta',
        level_up: 'subir de nivel',
        high_score: 'puntuación alta',
        no_mistakes: 'jugar sin errores'
      },
      en: {
        correct_answer: 'correct answer',
        level_up: 'level up',
        high_score: 'high score',
        no_mistakes: 'playing without mistakes'
      }
    };
    
    return achievements[language][achievement as keyof typeof achievements.es] || achievement;
  }

  /**
   * Test de conectividad básica
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.rateLimitedRequest(async () => {
        return await this.client.chat.completions.create({
          model: this.deploymentName,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        });
      });
      return response.choices.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const azureOpenAIService = new AzureOpenAIService();
