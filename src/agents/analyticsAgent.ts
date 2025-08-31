// src/agents/analyticsAgent.ts
import { BaseAgent, Task, TaskType, AgentRole, ToolName } from './types';
import { azureOpenAIService } from '../services/azureOpenAIFixed';

interface AnalyticsAgentData {
  performanceMetrics: Record<string, any>;
  learningPatterns: Record<string, any>;
  sessionAnalytics: any[];
  difficultyRecommendations: Record<string, any>;
}

interface AgentResponse {
  success: boolean;
  data: any;
  reasoning: string;
  confidence: number;
}

interface PerformanceMetrics {
  accuracy: number;
  averageResponseTime: number;
  totalAttempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  streak: number;
  maxStreak: number;
}

interface LearningPattern {
  concept: string;
  masteryLevel: number;
  progressRate: number;
  difficultyTrend: 'improving' | 'stable' | 'declining';
  recommendedNextStep: string;
}

export class AnalyticsAgent implements BaseAgent {
  role: AgentRole = 'analytics_expert';
  goal = 'Analizar patrones de aprendizaje y rendimiento para optimizar la experiencia educativa';
  backstory = 'Especialista en análisis de datos educativos y machine learning, experto en identificar patrones de aprendizaje infantil';
  capabilities: TaskType[] = [
    'analyze_performance'
  ];
  tools: ToolName[] = [
    'azure_openai',
    'performance_analyzer'
  ];
  verbose = false;

  memory: AnalyticsAgentData = {
    performanceMetrics: {},
    learningPatterns: {},
    sessionAnalytics: [],
    difficultyRecommendations: {}
  };

  async processTask(task: Task): Promise<AgentResponse> {
    try {
      console.log(`[AnalyticsAgent] Processing task: ${task.type}`);
      
      switch (task.type) {
        case 'analyze_performance':
          return await this.analyzePerformance(task);
        default:
          return this.getDefaultResponse(task);
      }
    } catch (error) {
      console.error('[AnalyticsAgent] Error processing task:', error);
      return this.getFallbackResponse(task);
    }
  }

  private async analyzePerformance(task: Task): Promise<AgentResponse> {
    const metadata = task.metadata || {};
    const { 
      sessionData = {},
      gameType = 'colors',
      childId = 'anonymous'
    } = metadata;

    try {
      // Calcular métricas básicas
      const metrics = this.calculatePerformanceMetrics(sessionData);
      
      // Identificar patrones de aprendizaje
      const patterns = this.identifyLearningPatterns(sessionData, metrics);
      
      // Generar recomendaciones con IA
      const aiInsights = await this.generateAIInsights(metrics, patterns, gameType);
      
      // Actualizar memoria del agente
      this.updateMemory(childId, metrics, patterns);

      return {
        success: true,
        data: {
          type: 'performance_analysis',
          metrics,
          patterns,
          insights: aiInsights,
          recommendations: this.generateRecommendations(metrics, patterns),
          nextSteps: this.suggestNextSteps(metrics, patterns)
        },
        reasoning: `Analyzed performance for ${gameType} game with ${metrics.totalAttempts} attempts`,
        confidence: this.calculateConfidenceScore(metrics)
      };
    } catch (error) {
      return this.getFallbackAnalysis(sessionData);
    }
  }

  private calculatePerformanceMetrics(sessionData: any): PerformanceMetrics {
    const interactions = sessionData.interactions || [];
    
    if (interactions.length === 0) {
      return {
        accuracy: 0,
        averageResponseTime: 0,
        totalAttempts: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        streak: 0,
        maxStreak: 0
      };
    }

    const correctAnswers = interactions.filter((i: any) => i.successful).length;
    const totalAttempts = interactions.length;
    const accuracy = totalAttempts > 0 ? correctAnswers / totalAttempts : 0;
    
    const responseTimes = interactions
      .filter((i: any) => i.responseTime)
      .map((i: any) => i.responseTime);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
      : 0;

    const { currentStreak, maxStreak } = this.calculateStreaks(interactions);

    return {
      accuracy,
      averageResponseTime,
      totalAttempts,
      correctAnswers,
      incorrectAnswers: totalAttempts - correctAnswers,
      streak: currentStreak,
      maxStreak
    };
  }

  private calculateStreaks(interactions: any[]): { currentStreak: number, maxStreak: number } {
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (const interaction of interactions) {
      if (interaction.successful) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // El streak actual es la última secuencia de éxitos
    for (let i = interactions.length - 1; i >= 0; i--) {
      if (interactions[i].successful) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { currentStreak, maxStreak };
  }

  private identifyLearningPatterns(sessionData: any, metrics: PerformanceMetrics): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    const interactions = sessionData.interactions || [];

    // Analizar patrones por concepto/color
    const conceptGroups = this.groupByConceptF(interactions);
    
    for (const [concept, conceptInteractions] of Object.entries(conceptGroups)) {
      const conceptCorrect = (conceptInteractions as any[]).filter(i => i.successful).length;
      const conceptTotal = (conceptInteractions as any[]).length;
      const masteryLevel = conceptTotal > 0 ? conceptCorrect / conceptTotal : 0;
      
      // Analizar tendencia temporal
      const difficultyTrend = this.analyzeTrend(conceptInteractions as any[]);
      
      patterns.push({
        concept,
        masteryLevel,
        progressRate: this.calculateProgressRate(conceptInteractions as any[]),
        difficultyTrend,
        recommendedNextStep: this.getRecommendedStep(masteryLevel, difficultyTrend)
      });
    }

    return patterns;
  }

  private groupByConceptF(interactions: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    for (const interaction of interactions) {
      const concept = interaction.description || interaction.type || 'unknown';
      if (!groups[concept]) {
        groups[concept] = [];
      }
      groups[concept].push(interaction);
    }
    
    return groups;
  }

  private analyzeTrend(interactions: any[]): 'improving' | 'stable' | 'declining' {
    if (interactions.length < 3) return 'stable';
    
    const recentSuccess = interactions.slice(-3).filter(i => i.successful).length;
    const earlierSuccess = interactions.slice(0, -3).filter(i => i.successful).length;
    const earlierTotal = interactions.slice(0, -3).length;
    
    if (earlierTotal === 0) return 'stable';
    
    const recentRate = recentSuccess / 3;
    const earlierRate = earlierSuccess / earlierTotal;
    
    if (recentRate > earlierRate + 0.2) return 'improving';
    if (recentRate < earlierRate - 0.2) return 'declining';
    return 'stable';
  }

  private calculateProgressRate(interactions: any[]): number {
    if (interactions.length < 2) return 0;
    
    const timespan = interactions[interactions.length - 1].timestamp - interactions[0].timestamp;
    const successCount = interactions.filter(i => i.successful).length;
    
    return timespan > 0 ? (successCount / interactions.length) / (timespan / 60000) : 0; // por minuto
  }

  private getRecommendedStep(masteryLevel: number, trend: string): string {
    if (masteryLevel >= 0.8 && trend !== 'declining') {
      return 'advance_difficulty';
    } else if (masteryLevel < 0.4 || trend === 'declining') {
      return 'review_basics';
    } else {
      return 'continue_practice';
    }
  }

  private async generateAIInsights(
    metrics: PerformanceMetrics, 
    patterns: LearningPattern[], 
    gameType: string
  ): Promise<string> {
    const prompt = `Analiza el rendimiento de un niño en un juego educativo de ${gameType}:
    
Métricas:
- Precisión: ${(metrics.accuracy * 100).toFixed(1)}%
- Intentos totales: ${metrics.totalAttempts}
- Tiempo promedio de respuesta: ${metrics.averageResponseTime.toFixed(0)}ms
- Racha máxima: ${metrics.maxStreak}

Patrones identificados: ${patterns.length} conceptos analizados

Genera un breve insight educativo (máximo 50 palabras) sobre el progreso del niño y una recomendación específica.`;

    try {
      const aiResponse = await azureOpenAIService.generateChildResponse(
        'educador', // childName
        25, // age (adult perspective)
        prompt, // context
        'es' // language
      );

      return aiResponse.trim();
    } catch (error) {
      return this.getFallbackInsight(metrics);
    }
  }

  private generateRecommendations(metrics: PerformanceMetrics, patterns: LearningPattern[]): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en precisión
    if (metrics.accuracy < 0.5) {
      recommendations.push('Reducir dificultad y proporcionar más pistas visuales');
    } else if (metrics.accuracy > 0.8) {
      recommendations.push('Aumentar dificultad para mantener el desafío');
    }

    // Recomendaciones basadas en tiempo de respuesta
    if (metrics.averageResponseTime > 5000) {
      recommendations.push('El niño necesita más tiempo - reducir presión temporal');
    } else if (metrics.averageResponseTime < 1000) {
      recommendations.push('Respuestas muy rápidas - considerar aumentar complejidad');
    }

    // Recomendaciones basadas en patrones
    const strugglingConcepts = patterns.filter(p => p.masteryLevel < 0.6);
    if (strugglingConcepts.length > 0) {
      recommendations.push(`Reforzar conceptos: ${strugglingConcepts.map(c => c.concept).join(', ')}`);
    }

    return recommendations.length > 0 ? recommendations : ['Continuar con el ritmo actual de aprendizaje'];
  }

  private suggestNextSteps(metrics: PerformanceMetrics, patterns: LearningPattern[]): string[] {
    const nextSteps: string[] = [];

    // Determinar próximos pasos basados en análisis general
    if (metrics.accuracy >= 0.8 && metrics.maxStreak >= 5) {
      nextSteps.push('Introducir nuevos conceptos o aumentar dificultad');
    } else if (metrics.accuracy < 0.5) {
      nextSteps.push('Revisión de conceptos básicos con apoyo adicional');
    } else {
      nextSteps.push('Continuar práctica con variaciones del mismo nivel');
    }

    // Pasos específicos por patrón
    patterns.forEach(pattern => {
      if (pattern.difficultyTrend === 'improving' && pattern.masteryLevel > 0.7) {
        nextSteps.push(`Avanzar en ${pattern.concept} - tendencia positiva`);
      } else if (pattern.difficultyTrend === 'declining') {
        nextSteps.push(`Reforzar ${pattern.concept} - necesita atención`);
      }
    });

    return nextSteps;
  }

  private calculateConfidenceScore(metrics: PerformanceMetrics): number {
    // La confianza se basa en la cantidad de datos disponibles
    let confidence = Math.min(metrics.totalAttempts / 10, 1.0); // Máximo con 10+ intentos
    
    // Ajustar por consistencia
    if (metrics.accuracy > 0.2 && metrics.accuracy < 0.8) {
      confidence *= 0.9; // Reducir ligeramente para resultados ambiguos
    }
    
    return Math.max(confidence, 0.1); // Mínimo 10% de confianza
  }

  private updateMemory(childId: string, metrics: PerformanceMetrics, patterns: LearningPattern[]): void {
    this.memory.performanceMetrics[childId] = {
      ...metrics,
      timestamp: Date.now()
    };

    this.memory.learningPatterns[childId] = patterns;
    
    this.memory.sessionAnalytics.push({
      childId,
      timestamp: Date.now(),
      metrics,
      patterns
    });

    // Mantener solo las últimas 50 sesiones
    if (this.memory.sessionAnalytics.length > 50) {
      this.memory.sessionAnalytics = this.memory.sessionAnalytics.slice(-50);
    }
  }

  private getFallbackInsight(metrics: PerformanceMetrics): string {
    if (metrics.accuracy > 0.7) {
      return 'El niño muestra un buen progreso y comprensión de los conceptos.';
    } else if (metrics.accuracy > 0.4) {
      return 'El niño está aprendiendo gradualmente, continuar con apoyo.';
    } else {
      return 'El niño necesita más práctica y apoyo para dominar estos conceptos.';
    }
  }

  private getFallbackAnalysis(sessionData: any): AgentResponse {
    return {
      success: true,
      data: {
        type: 'basic_analysis',
        metrics: {
          accuracy: 0.5,
          totalAttempts: 0,
          averageResponseTime: 0
        },
        insights: 'Análisis básico: Se necesitan más datos para un análisis completo.',
        recommendations: ['Continuar con la práctica regular']
      },
      reasoning: 'Fallback analysis due to insufficient data',
      confidence: 0.3
    };
  }

  private getDefaultResponse(task: Task): AgentResponse {
    return {
      success: false,
      data: null,
      reasoning: `AnalyticsAgent cannot handle task type: ${task.type}`,
      confidence: 0
    };
  }

  private getFallbackResponse(task: Task): AgentResponse {
    return {
      success: true,
      data: {
        type: 'basic_analytics',
        message: 'Análisis básico completado'
      },
      reasoning: 'Fallback analytics response due to error',
      confidence: 0.4
    };
  }

  // Métodos públicos para obtener datos analíticos
  getPerformanceHistory(childId: string): any {
    return this.memory.performanceMetrics[childId] || null;
  }

  getLearningPatterns(childId: string): LearningPattern[] {
    return this.memory.learningPatterns[childId] || [];
  }

  getSessionAnalytics(): any[] {
    return this.memory.sessionAnalytics.slice(-10); // Últimas 10 sesiones
  }
}

export const analyticsAgent = new AnalyticsAgent();
