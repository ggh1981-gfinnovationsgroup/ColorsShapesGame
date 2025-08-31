/**
 * Learning Coach Agent - CrewAI-inspired
 * Specialized in adapting difficulty and providing educational guidance
 */

import { LearningCoachAgent, Task, AgentContext, TaskType, ToolName } from './types';
import { azureOpenAIService } from '../services/azureOpenAIFixed';

export class LearningCoach implements LearningCoachAgent {
  role: 'learning_coach' = 'learning_coach';
  goal: string = 'Optimize learning experience by adapting difficulty and providing personalized educational guidance for each child';
  backstory: string = 'I am an experienced educational specialist with deep knowledge of child development psychology and adaptive learning techniques. I understand how children ages 3-6 learn best and can adjust teaching methods in real-time based on their responses.';
  capabilities: TaskType[] = ['generate_hint', 'adapt_difficulty', 'provide_feedback', 'suggest_next_activity'];
  tools: ToolName[] = ['azure_openai', 'difficulty_adapter', 'performance_analyzer'];
  specialization: 'difficulty_adaptation' | 'concept_introduction' | 'skill_building' = 'difficulty_adaptation';
  verbose?: boolean = false;

  /**
   * Analyze current difficulty and recommend adjustments
   */
  async analyzeDifficulty(context: AgentContext): Promise<{
    currentDifficulty: number;
    recommendedDifficulty: number;
    reasoning: string;
    adjustmentStrategy: 'gradual' | 'immediate' | 'conditional';
  }> {
    const child = context.childProfile;
    const session = context.currentSession;
    
    // Analyze recent performance
    const recentInteractions = session.interactions.slice(-5);
    const successRate = recentInteractions.length > 0 
      ? recentInteractions.filter(i => i.successful).length / recentInteractions.length 
      : 0.5;
    
    const avgResponseTime = recentInteractions.length > 0
      ? recentInteractions.reduce((sum, i) => sum + (i.responseTime || 0), 0) / recentInteractions.length
      : 0;

    // Age-appropriate baseline
    const baselineDifficulty = this.getBaselineDifficulty(child.age);
    
    // Adjust based on performance
    let recommendedDifficulty = baselineDifficulty;
    let adjustmentStrategy: 'gradual' | 'immediate' | 'conditional' = 'gradual';
    
    if (successRate > 0.9 && avgResponseTime < 3000) {
      // Too easy - increase difficulty
      recommendedDifficulty = Math.min(baselineDifficulty + 1, 10);
      adjustmentStrategy = child.attentionLevel === 'high' ? 'immediate' : 'gradual';
    } else if (successRate < 0.6 || avgResponseTime > 8000) {
      // Too hard - decrease difficulty
      recommendedDifficulty = Math.max(baselineDifficulty - 1, 1);
      adjustmentStrategy = 'immediate';
    } else if (successRate < 0.8) {
      // Slightly challenging - maintain with conditional adjustments
      adjustmentStrategy = 'conditional';
    }

    const reasoning = this.buildDifficultyReasoning(successRate, avgResponseTime, child);

    return {
      currentDifficulty: baselineDifficulty,
      recommendedDifficulty,
      reasoning,
      adjustmentStrategy
    };
  }

  /**
   * Generate contextual hint for struggling child
   */
  async generateHint(context: AgentContext): Promise<string> {
    const child = context.childProfile;
    const recentMistakes = context.currentSession.interactions
      .filter(i => !i.successful)
      .slice(-3);

    // Create context-aware hint prompt
    const hintContext = `Child ${child.name} (age ${child.age}) is struggling with color identification. 
Recent mistakes: ${recentMistakes.length}. 
Learning style: ${child.learningStyle}. 
Current mood: ${child.currentMood}. 
Attention level: ${child.attentionLevel}.`;

    try {
      const hint = await azureOpenAIService.generateChildResponse(
        child.name,
        child.age,
        `Generate an encouraging hint for color learning: ${hintContext}`,
        child.languagePreference === 'english' ? 'en' : 'es'
      );

      return hint;
    } catch (error) {
      // Fallback hints based on learning style
      return this.getFallbackHint(child);
    }
  }

  /**
   * Provide educational feedback based on child's attempt
   */
  async provideFeedback(context: AgentContext, wasSuccessful: boolean): Promise<{
    message: string;
    nextAction: string;
    confidence: number;
  }> {
    const child = context.childProfile;
    
    if (wasSuccessful) {
      return this.generatePositiveFeedback(child);
    } else {
      return this.generateCorrectiveFeedback(child, context);
    }
  }

  /**
   * Suggest next activity based on child's progress
   */
  async suggestNextActivity(context: AgentContext): Promise<{
    activity: string;
    reason: string;
    estimatedDuration: number;
  }> {
    const child = context.childProfile;
    const session = context.currentSession;
    
    // Analyze current session length
    const sessionDuration = Date.now() - session.startTime;
    const optimalSessionLength = this.getOptimalSessionLength(child);
    
    // Check attention and fatigue
    if (sessionDuration > optimalSessionLength || child.attentionLevel === 'low') {
      return {
        activity: 'break_time',
        reason: 'Child needs a break to maintain optimal learning',
        estimatedDuration: 300000 // 5 minutes
      };
    }

    // Suggest activity based on current mastery
    const recentSuccessRate = this.calculateRecentSuccessRate(session);
    
    if (recentSuccessRate > 0.8) {
      return {
        activity: 'new_concept',
        reason: 'Child is ready for a new challenge',
        estimatedDuration: 600000 // 10 minutes
      };
    } else if (recentSuccessRate < 0.6) {
      return {
        activity: 'review_practice',
        reason: 'Child needs more practice with current concepts',
        estimatedDuration: 300000 // 5 minutes
      };
    } else {
      return {
        activity: 'continue_current',
        reason: 'Child is making good progress at current level',
        estimatedDuration: 420000 // 7 minutes
      };
    }
  }

  // Helper methods

  private getBaselineDifficulty(age: number): number {
    if (age <= 3) return 2; // 2-3 colors
    if (age <= 4) return 4; // 4 colors  
    if (age <= 5) return 6; // 6 colors
    return 8; // 8+ colors for 6+
  }

  private buildDifficultyReasoning(successRate: number, avgResponseTime: number, child: any): string {
    const factors = [];
    
    if (successRate > 0.9) factors.push('very high success rate');
    else if (successRate < 0.6) factors.push('low success rate');
    
    if (avgResponseTime > 8000) factors.push('slow response times');
    else if (avgResponseTime < 3000) factors.push('fast response times');
    
    if (child.attentionLevel === 'low') factors.push('low attention level');
    if (child.currentMood === 'frustrated') factors.push('frustrated mood');
    
    return `Recommendation based on: ${factors.join(', ')}. Child's learning style (${child.learningStyle}) considered.`;
  }

  private getFallbackHint(child: any): string {
    const hints: Record<string, string> = {
      visual: `¡Mira bien los colores, ${child.name}! Busca el que más se parezca.`,
      auditory: `Escucha el color que digo, ${child.name}. ¿Puedes encontrarlo?`,
      kinesthetic: `Toca cada color despacio, ${child.name}. Siente cuál es el correcto.`,
      mixed: `¡Puedes hacerlo, ${child.name}! Mira y escucha con cuidado.`
    };
    
    return hints[child.learningStyle] || hints.mixed;
  }

  private async generatePositiveFeedback(child: any): Promise<{
    message: string;
    nextAction: string;
    confidence: number;
  }> {
    return {
      message: `¡Excelente trabajo, ${child.name}! Encontraste el color correcto.`,
      nextAction: 'continue_learning',
      confidence: 0.9
    };
  }

  private async generateCorrectiveFeedback(child: any, context: AgentContext): Promise<{
    message: string;
    nextAction: string;
    confidence: number;
  }> {
    const mistakeCount = context.currentSession.interactions.filter(i => !i.successful).length;
    
    if (mistakeCount > 3) {
      return {
        message: `No te preocupes, ${child.name}. Vamos a intentar algo más fácil.`,
        nextAction: 'reduce_difficulty',
        confidence: 0.8
      };
    } else {
      return {
        message: `Casi lo tienes, ${child.name}. ¡Inténtalo otra vez!`,
        nextAction: 'retry_current',
        confidence: 0.7
      };
    }
  }

  private getOptimalSessionLength(child: any): number {
    // Base on age and attention level
    const baseTime = child.age * 120000; // 2 minutes per year of age
    const attentionMultiplier: Record<string, number> = {
      high: 1.5,
      medium: 1.0,
      low: 0.7
    };
    
    return baseTime * (attentionMultiplier[child.attentionLevel] || 1.0);
  }

  private calculateRecentSuccessRate(session: any): number {
    const recentInteractions = session.interactions.slice(-5);
    if (recentInteractions.length === 0) return 0.5;
    
    return recentInteractions.filter((i: any) => i.successful).length / recentInteractions.length;
  }
}
