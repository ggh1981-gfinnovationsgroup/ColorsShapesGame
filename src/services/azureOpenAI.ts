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

      const response = await this.client.chat.completions.create({
        model: this.deploymentName, // En Azure esto se ignora pero es requerido
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
      });

      return response.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
    } catch (error) {
      console.error('Error calling Azure OpenAI:', error);
      return language === 'es' 
        ? '¡Sigue intentando! Estás haciendo un gran trabajo.' 
        : 'Keep trying! You\'re doing great!';
    }
  }

  /**
   * Genera palabras de aliento personalizadas
   */
  async generateEncouragement(
    childName: string,
    achievement: string,
    language: 'es' | 'en' = 'es'
  ): Promise<string> {
    const context = language === 'es' 
      ? `${childName} acaba de lograr: ${achievement}`
      : `${childName} just achieved: ${achievement}`;
    
    return this.generateChildResponse(childName, 4, context, language);
  }

  /**
   * Genera hints adaptativos para juegos
   */
  async generateGameHint(
    gameType: string,
    difficulty: string,
    childAge: number,
    language: 'es' | 'en' = 'es'
  ): Promise<string> {
    const context = language === 'es'
      ? `Juego: ${gameType}, Dificultad: ${difficulty}, Edad: ${childAge}`
      : `Game: ${gameType}, Difficulty: ${difficulty}, Age: ${childAge}`;
    
    return this.generateChildResponse('', childAge, context, language);
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

  private getUserPrompt(childName: string, context: string, language: 'es' | 'en'): string {
    if (language === 'es') {
      return `${childName ? `${childName} necesita` : 'Un niño necesita'} ayuda con: ${context}. 
      Por favor responde de manera alentadora y educativa.`;
    } else {
      return `${childName ? `${childName} needs` : 'A child needs'} help with: ${context}. 
      Please respond in an encouraging and educational way.`;
    }
  }

  /**
   * Test de conectividad básica
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.deploymentName,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });
      return response.choices.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const azureOpenAIService = new AzureOpenAIService();
