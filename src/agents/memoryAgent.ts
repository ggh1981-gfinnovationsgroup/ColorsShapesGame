// src/agents/memoryAgent.ts
import { BaseAgent, Task, TaskType, AgentRole, ToolName } from './types';
import { azureOpenAIService } from '../services/azureOpenAIFixed';

interface MemoryAgentData {
  longTermMemory: Record<string, any>;
  sessionMemories: any[];
  learningMilestones: Record<string, any>;
  adaptiveProfiles: Record<string, any>;
}

interface AgentResponse {
  success: boolean;
  data: any;
  reasoning: string;
  confidence: number;
}

interface LearningMilestone {
  id: string;
  childId: string;
  concept: string;
  achievedAt: number;
  masteryLevel: number;
  context: string;
  significance: 'minor' | 'major' | 'breakthrough';
}

interface AdaptiveProfile {
  childId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  attentionSpan: number; // en segundos
  motivationTriggers: string[];
  strugglingConcepts: string[];
  masteredConcepts: string[];
  optimalSessionLength: number; // en minutos
  lastUpdated: number;
}

export class MemoryAgent implements BaseAgent {
  role: AgentRole = 'memory_keeper';
  goal = 'Mantener memoria persistente del aprendizaje y adaptar la experiencia basada en el historial del niño';
  backstory = 'Especialista en memoria educativa y adaptación personalizada, experto en retención de información de aprendizaje infantil';
  capabilities: TaskType[] = [
    'update_memory'
  ];
  tools: ToolName[] = [
    'azure_openai',
    'memory_manager'
  ];
  verbose = false;

  memory: MemoryAgentData = {
    longTermMemory: {},
    sessionMemories: [],
    learningMilestones: {},
    adaptiveProfiles: {}
  };

  async processTask(task: Task): Promise<AgentResponse> {
    try {
      console.log(`[MemoryAgent] Processing task: ${task.type}`);
      
      switch (task.type) {
        case 'update_memory':
          return await this.updateMemory(task);
        default:
          return this.getDefaultResponse(task);
      }
    } catch (error) {
      console.error('[MemoryAgent] Error processing task:', error);
      return this.getFallbackResponse(task);
    }
  }

  private async updateMemory(task: Task): Promise<AgentResponse> {
    const metadata = task.metadata || {};
    const { 
      childId = 'anonymous',
      sessionData = {},
      interactionType = 'game',
      performanceData = {},
      newMilestones = []
    } = metadata;

    try {
      // Actualizar memoria de sesión
      const sessionMemory = this.recordSessionMemory(childId, sessionData, interactionType);
      
      // Actualizar perfil adaptativo
      const updatedProfile = await this.updateAdaptiveProfile(childId, performanceData, sessionData);
      
      // Procesar nuevos hitos de aprendizaje
      const milestonesProcessed = this.processMilestones(childId, newMilestones);
      
      // Generar insights de memoria con IA
      const memoryInsights = await this.generateMemoryInsights(childId, sessionMemory, updatedProfile);
      
      // Limpiar memoria antigua si es necesario
      this.cleanupOldMemory();

      return {
        success: true,
        data: {
          type: 'memory_update',
          sessionMemory,
          adaptiveProfile: updatedProfile,
          newMilestones: milestonesProcessed,
          insights: memoryInsights,
          memoryStats: this.getMemoryStats(childId)
        },
        reasoning: `Updated memory for child ${childId} with ${sessionData.interactions?.length || 0} new interactions`,
        confidence: 0.95
      };
    } catch (error) {
      return this.getFallbackMemoryUpdate(childId, sessionData);
    }
  }

  private recordSessionMemory(childId: string, sessionData: any, interactionType: string): any {
    const sessionMemory = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      childId,
      timestamp: Date.now(),
      interactionType,
      duration: sessionData.duration || 0,
      interactions: sessionData.interactions || [],
      performanceSummary: this.summarizePerformance(sessionData),
      emotionalState: sessionData.mood || 'neutral',
      concepts: this.extractConcepts(sessionData),
      significance: this.calculateSessionSignificance(sessionData)
    };

    // Añadir a la memoria de sesiones
    this.memory.sessionMemories.push(sessionMemory);

    // Actualizar memoria de largo plazo del niño
    if (!this.memory.longTermMemory[childId]) {
      this.memory.longTermMemory[childId] = {
        firstSession: Date.now(),
        totalSessions: 0,
        totalPlayTime: 0,
        conceptHistory: {},
        performanceTrends: []
      };
    }

    const ltm = this.memory.longTermMemory[childId];
    ltm.totalSessions += 1;
    ltm.totalPlayTime += sessionData.duration || 0;
    ltm.lastSession = Date.now();

    // Actualizar historial de conceptos
    sessionMemory.concepts.forEach((concept: string) => {
      if (!ltm.conceptHistory[concept]) {
        ltm.conceptHistory[concept] = {
          firstEncounter: Date.now(),
          sessionCount: 0,
          lastPracticed: Date.now(),
          masteryProgression: []
        };
      }
      ltm.conceptHistory[concept].sessionCount += 1;
      ltm.conceptHistory[concept].lastPracticed = Date.now();
    });

    return sessionMemory;
  }

  private async updateAdaptiveProfile(childId: string, performanceData: any, sessionData: any): Promise<AdaptiveProfile> {
    let profile = this.memory.adaptiveProfiles[childId];

    if (!profile) {
      // Crear nuevo perfil
      profile = {
        childId,
        learningStyle: 'mixed',
        preferredDifficulty: 'medium',
        attentionSpan: 180, // 3 minutos por defecto
        motivationTriggers: ['celebration', 'achievement'],
        strugglingConcepts: [],
        masteredConcepts: [],
        optimalSessionLength: 5, // 5 minutos por defecto
        lastUpdated: Date.now()
      };
    }

    // Actualizar estilo de aprendizaje basado en patrones de rendimiento
    profile.learningStyle = this.inferLearningStyle(performanceData, sessionData);
    
    // Ajustar dificultad preferida
    profile.preferredDifficulty = this.calculatePreferredDifficulty(performanceData);
    
    // Actualizar span de atención basado en duración de sesiones exitosas
    profile.attentionSpan = this.calculateAttentionSpan(sessionData, this.memory.sessionMemories);
    
    // Identificar conceptos con dificultades y dominados
    const conceptAnalysis = this.analyzeConcepts(performanceData, sessionData);
    profile.strugglingConcepts = conceptAnalysis.struggling;
    profile.masteredConcepts = conceptAnalysis.mastered;
    
    // Determinar duración óptima de sesión
    profile.optimalSessionLength = this.calculateOptimalSessionLength(childId);
    
    // Actualizar triggers de motivación
    profile.motivationTriggers = this.identifyMotivationTriggers(sessionData);
    
    profile.lastUpdated = Date.now();
    
    this.memory.adaptiveProfiles[childId] = profile;
    
    return profile;
  }

  private processMilestones(childId: string, milestones: any[]): LearningMilestone[] {
    const processedMilestones: LearningMilestone[] = [];

    milestones.forEach((milestone: any) => {
      const processed: LearningMilestone = {
        id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        childId,
        concept: milestone.concept || 'unknown',
        achievedAt: Date.now(),
        masteryLevel: milestone.masteryLevel || 0.8,
        context: milestone.context || 'game',
        significance: this.determineMilestoneSignificance(milestone)
      };

      processedMilestones.push(processed);

      // Guardar en memoria de hitos
      if (!this.memory.learningMilestones[childId]) {
        this.memory.learningMilestones[childId] = [];
      }
      this.memory.learningMilestones[childId].push(processed);
    });

    return processedMilestones;
  }

  private async generateMemoryInsights(childId: string, sessionMemory: any, profile: AdaptiveProfile): Promise<string> {
    const ltm = this.memory.longTermMemory[childId];
    const milestones = this.memory.learningMilestones[childId] || [];

    const prompt = `Analiza el progreso de aprendizaje de un niño basado en:

Sesión actual:
- Duración: ${sessionMemory.duration / 1000}s
- Conceptos practicados: ${sessionMemory.concepts.join(', ')}
- Rendimiento: ${sessionMemory.performanceSummary.accuracy}% precisión

Historial:
- Total de sesiones: ${ltm?.totalSessions || 0}
- Tiempo total de juego: ${Math.round((ltm?.totalPlayTime || 0) / 60000)}min
- Hitos recientes: ${milestones.slice(-3).map((m: any) => m.concept).join(', ')}

Perfil adaptativo:
- Estilo de aprendizaje: ${profile.learningStyle}
- Conceptos dominados: ${profile.masteredConcepts.join(', ')}
- Conceptos difíciles: ${profile.strugglingConcepts.join(', ')}

Genera un insight breve (máximo 40 palabras) sobre el progreso y una recomendación personalizada.`;

    try {
      const aiResponse = await azureOpenAIService.generateChildResponse(
        'memoria', // childName
        25, // age (adult perspective)
        prompt, // context
        'es' // language
      );

      return aiResponse.trim();
    } catch (error) {
      return this.getFallbackInsight(profile, sessionMemory);
    }
  }

  private summarizePerformance(sessionData: any): any {
    const interactions = sessionData.interactions || [];
    
    if (interactions.length === 0) {
      return { accuracy: 0, totalAttempts: 0, averageTime: 0 };
    }

    const successful = interactions.filter((i: any) => i.successful).length;
    const accuracy = successful / interactions.length;
    
    const times = interactions
      .filter((i: any) => i.responseTime)
      .map((i: any) => i.responseTime);
    const averageTime = times.length > 0 ? times.reduce((a: number, b: number) => a + b, 0) / times.length : 0;

    return {
      accuracy,
      totalAttempts: interactions.length,
      averageTime,
      successful,
      failed: interactions.length - successful
    };
  }

  private extractConcepts(sessionData: any): string[] {
    const concepts = new Set<string>();
    
    const interactions = sessionData.interactions || [];
    interactions.forEach((interaction: any) => {
      if (interaction.description) {
        // Extraer conceptos de las descripciones
        const desc = interaction.description.toLowerCase();
        if (desc.includes('color') || desc.includes('rojo') || desc.includes('azul') || desc.includes('red') || desc.includes('blue')) {
          concepts.add('colors');
        }
        if (desc.includes('shape') || desc.includes('círculo') || desc.includes('cuadrado') || desc.includes('circle') || desc.includes('square')) {
          concepts.add('shapes');
        }
      }
    });

    return Array.from(concepts);
  }

  private calculateSessionSignificance(sessionData: any): 'low' | 'medium' | 'high' {
    const performance = this.summarizePerformance(sessionData);
    const duration = sessionData.duration || 0;

    if (performance.accuracy > 0.8 && duration > 300000) { // >5 min con alta precisión
      return 'high';
    } else if (performance.totalAttempts > 10 || duration > 180000) { // >3 min o >10 intentos
      return 'medium';
    } else {
      return 'low';
    }
  }

  private inferLearningStyle(performanceData: any, sessionData: any): 'visual' | 'auditory' | 'kinesthetic' | 'mixed' {
    // Análisis simplificado basado en patrones de interacción
    const interactions = sessionData.interactions || [];
    
    // Si responde rápido y bien, probablemente es visual
    const avgResponseTime = interactions.length > 0 
      ? interactions.reduce((sum: number, i: any) => sum + (i.responseTime || 0), 0) / interactions.length 
      : 0;

    if (avgResponseTime < 2000 && (performanceData.accuracy || 0) > 0.7) {
      return 'visual';
    } else if (avgResponseTime > 4000) {
      return 'auditory'; // Necesita más tiempo para procesar información auditiva
    } else {
      return 'mixed';
    }
  }

  private calculatePreferredDifficulty(performanceData: any): 'easy' | 'medium' | 'hard' | 'adaptive' {
    const accuracy = performanceData.accuracy || 0;
    
    if (accuracy > 0.9) return 'hard';
    if (accuracy > 0.7) return 'medium';
    if (accuracy > 0.5) return 'easy';
    return 'adaptive';
  }

  private calculateAttentionSpan(sessionData: any, allSessions: any[]): number {
    const currentDuration = sessionData.duration || 0;
    const recentSessions = allSessions.slice(-5); // Últimas 5 sesiones
    
    if (recentSessions.length === 0) return Math.max(120, currentDuration / 1000); // Mínimo 2 minutos
    
    const avgDuration = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / recentSessions.length;
    return Math.max(120, avgDuration / 1000); // Convertir a segundos, mínimo 2 minutos
  }

  private analyzeConcepts(performanceData: any, sessionData: any): { struggling: string[], mastered: string[] } {
    // Análisis simplificado - en una implementación real esto sería más sofisticado
    const accuracy = performanceData.accuracy || 0;
    const concepts = this.extractConcepts(sessionData);
    
    if (accuracy > 0.8) {
      return { struggling: [], mastered: concepts };
    } else if (accuracy < 0.5) {
      return { struggling: concepts, mastered: [] };
    } else {
      return { struggling: [], mastered: [] };
    }
  }

  private calculateOptimalSessionLength(childId: string): number {
    const sessions = this.memory.sessionMemories.filter(s => s.childId === childId);
    
    if (sessions.length === 0) return 5; // 5 minutos por defecto
    
    // Encontrar sesiones exitosas (alta participación y buen rendimiento)
    const successfulSessions = sessions.filter(s => 
      s.performanceSummary.accuracy > 0.6 && s.significance !== 'low'
    );
    
    if (successfulSessions.length === 0) return 5;
    
    const avgDuration = successfulSessions.reduce((sum, s) => sum + s.duration, 0) / successfulSessions.length;
    return Math.round(avgDuration / 60000); // Convertir a minutos
  }

  private identifyMotivationTriggers(sessionData: any): string[] {
    const triggers = ['celebration'];
    
    const performance = this.summarizePerformance(sessionData);
    
    if (performance.accuracy > 0.8) {
      triggers.push('achievement', 'progress');
    }
    
    if (sessionData.duration > 300000) { // >5 minutos
      triggers.push('persistence', 'dedication');
    }
    
    return triggers;
  }

  private determineMilestoneSignificance(milestone: any): 'minor' | 'major' | 'breakthrough' {
    const masteryLevel = milestone.masteryLevel || 0;
    
    if (masteryLevel >= 0.95) return 'breakthrough';
    if (masteryLevel >= 0.8) return 'major';
    return 'minor';
  }

  private cleanupOldMemory(): void {
    // Mantener solo las últimas 100 sesiones
    if (this.memory.sessionMemories.length > 100) {
      this.memory.sessionMemories = this.memory.sessionMemories.slice(-100);
    }

    // Limpiar datos de perfiles no usados recientemente (>30 días)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    Object.keys(this.memory.adaptiveProfiles).forEach(childId => {
      if (this.memory.adaptiveProfiles[childId].lastUpdated < thirtyDaysAgo) {
        delete this.memory.adaptiveProfiles[childId];
      }
    });
  }

  private getMemoryStats(childId: string): any {
    const ltm = this.memory.longTermMemory[childId];
    const profile = this.memory.adaptiveProfiles[childId];
    const milestones = this.memory.learningMilestones[childId] || [];
    
    return {
      totalSessions: ltm?.totalSessions || 0,
      totalPlayTime: Math.round((ltm?.totalPlayTime || 0) / 60000), // en minutos
      conceptsEncountered: Object.keys(ltm?.conceptHistory || {}).length,
      milestonesAchieved: milestones.length,
      learningStyle: profile?.learningStyle || 'unknown',
      lastActive: ltm?.lastSession || 0
    };
  }

  private getFallbackInsight(profile: AdaptiveProfile, sessionMemory: any): string {
    const concepts = profile.masteredConcepts.length;
    const struggling = profile.strugglingConcepts.length;
    
    if (concepts > struggling) {
      return `El niño muestra buen progreso con ${concepts} conceptos dominados. Continuar con el ritmo actual.`;
    } else if (struggling > 0) {
      return `Necesita refuerzo en ${struggling} conceptos. Considerar reducir dificultad temporalmente.`;
    } else {
      return 'Progreso estable. Mantener variedad en actividades para sustener el interés.';
    }
  }

  private getFallbackMemoryUpdate(childId: string, sessionData: any): AgentResponse {
    return {
      success: true,
      data: {
        type: 'basic_memory_update',
        message: 'Memoria actualizada básicamente',
        sessionRecorded: true
      },
      reasoning: 'Fallback memory update due to error',
      confidence: 0.6
    };
  }

  private getDefaultResponse(task: Task): AgentResponse {
    return {
      success: false,
      data: null,
      reasoning: `MemoryAgent cannot handle task type: ${task.type}`,
      confidence: 0
    };
  }

  private getFallbackResponse(task: Task): AgentResponse {
    return {
      success: true,
      data: {
        type: 'basic_memory',
        message: 'Procesamiento de memoria básico completado'
      },
      reasoning: 'Fallback memory response due to error',
      confidence: 0.4
    };
  }

  // Métodos públicos para acceso a memoria
  getChildProfile(childId: string): AdaptiveProfile | null {
    return this.memory.adaptiveProfiles[childId] || null;
  }

  getChildMilestones(childId: string): LearningMilestone[] {
    return this.memory.learningMilestones[childId] || [];
  }

  getLongTermMemory(childId: string): any {
    return this.memory.longTermMemory[childId] || null;
  }

  getRecentSessions(childId: string, limit: number = 10): any[] {
    return this.memory.sessionMemories
      .filter(s => s.childId === childId)
      .slice(-limit);
  }

  exportChildData(childId: string): any {
    return {
      profile: this.getChildProfile(childId),
      longTermMemory: this.getLongTermMemory(childId),
      milestones: this.getChildMilestones(childId),
      recentSessions: this.getRecentSessions(childId, 20),
      exportedAt: Date.now()
    };
  }
}

export const memoryAgent = new MemoryAgent();
