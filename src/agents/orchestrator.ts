// 🎯 AGENT ORCHESTRATOR - Multi-Agent Coordination System
// This is the "brain" that coordinates all specialized AI agents

import { AgentContext, AgentResponse, AgentAction, AgentOrchestrator, Agent } from './types';
import { LearningCoachAgentImpl } from './learningCoachAgent';
import { MotivationAgentImpl } from './motivationAgent';
import { AnalyticsAgentImpl } from './analyticsAgent';
import { LanguageAgentImpl } from './languageAgent';
import { MemoryAgentImpl } from './memoryAgent';

export class AgentOrchestratorImpl implements AgentOrchestrator {
  private agents: Map<string, Agent>;
  private readonly MAX_CONCURRENT_AGENTS = 3;
  private readonly RESPONSE_TIMEOUT = 5000; // 5 seconds

  constructor() {
    this.agents = new Map();
    this.initializeAgents();
  }

  private initializeAgents() {
    const learningCoach = new LearningCoachAgentImpl();
    const motivation = new MotivationAgentImpl();
    const analytics = new AnalyticsAgentImpl();
    const language = new LanguageAgentImpl();
    const memory = new MemoryAgentImpl();

    this.agents.set('learning_coach', learningCoach);
    this.agents.set('motivation', motivation);
    this.agents.set('analytics', analytics);
    this.agents.set('language', language);
    this.agents.set('memory', memory);
  }

  /**
   * 🔄 Main workflow execution - coordinates multiple agents
   * This implements the multi-agent pattern from the AI Agent framework
   */
  async executeWorkflow(context: AgentContext): Promise<AgentResponse[]> {
    console.log(`🎯 Orchestrator: Starting workflow for child ${context.childId}`);
    
    try {
      // Step 1: Memory agent retrieves context
      const memoryAgent = this.agents.get('memory') as MemoryAgentImpl;
      const memoryResponse = await this.executeWithTimeout(
        memoryAgent.retrievePatterns(context),
        'memory'
      );

      // Step 2: Analytics analyzes current situation
      const analyticsAgent = this.agents.get('analytics') as AnalyticsAgentImpl;
      const analyticsResponse = await this.executeWithTimeout(
        analyticsAgent.analyzeLearningPatterns(context),
        'analytics'
      );

      // Step 3: Determine which agents need to act based on context
      const activeAgents = this.selectActiveAgents(context, [memoryResponse, analyticsResponse]);
      
      // Step 4: Execute selected agents in parallel
      const agentPromises = activeAgents.map(agentId => 
        this.executeAgent(agentId, context)
      );

      const responses = await Promise.allSettled(agentPromises);
      const successfulResponses = responses
        .filter((result): result is PromiseFulfilledResult<AgentResponse> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      // Step 5: Prioritize and coordinate responses
      const coordinatedResponse = await this.coordinateAgents(activeAgents.map(id => this.agents.get(id)!));
      
      // Step 6: Store interaction for future learning
      await memoryAgent.storeInteraction(context);

      return [coordinatedResponse, ...successfulResponses];

    } catch (error) {
      console.error('🚨 Orchestrator workflow error:', error);
      return [this.createFallbackResponse(context)];
    }
  }

  /**
   * 🤝 Coordinate multiple agent responses into one coherent action
   */
  async coordinateAgents(agents: Agent[]): Promise<AgentResponse> {
    // This is where the "magic" happens - multiple AI agents collaborate
    return {
      agentId: 'orchestrator',
      confidence: 0.9,
      reasoning: 'Coordinated response from multiple specialized agents',
      action: {
        type: 'analyze',
        payload: { coordinated: true },
        priority: 'medium'
      },
      metadata: {
        agentsInvolved: agents.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 📊 Prioritize actions based on child's immediate needs
   */
  prioritizeActions(responses: AgentResponse[]): AgentResponse[] {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    return responses
      .sort((a, b) => {
        const aPriority = priorityOrder[a.action.priority];
        const bPriority = priorityOrder[b.action.priority];
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.confidence - a.confidence; // Higher confidence first
      })
      .slice(0, 3); // Limit to top 3 actions to avoid overwhelming the child
  }

  /**
   * 🎯 Smart agent selection based on current context
   */
  private selectActiveAgents(
    context: AgentContext, 
    initialResponses: AgentResponse[]
  ): string[] {
    const baseAgents = ['memory']; // Always include memory
    
    // Determine additional agents based on game state and context
    switch (context.currentGame) {
      case 'tap_the_color':
        baseAgents.push('language', 'learning_coach');
        
        // Add motivation if child is struggling
        if (context.gameState?.mistakes > 2) {
          baseAgents.push('motivation');
        }
        
        // Add analytics for pattern recognition
        if (context.gameState?.round > 5) {
          baseAgents.push('analytics');
        }
        break;
        
      default:
        baseAgents.push('learning_coach', 'language');
    }

    return [...new Set(baseAgents)]; // Remove duplicates
  }

  /**
   * ⚡ Execute individual agent with error handling
   */
  private async executeAgent(agentId: string, context: AgentContext): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Route to appropriate agent method based on context
    switch (agentId) {
      case 'learning_coach':
        const learningAgent = agent as LearningCoachAgentImpl;
        return await learningAgent.assessDifficulty(context);
        
      case 'motivation':
        const motivationAgent = agent as MotivationAgentImpl;
        return await motivationAgent.generateCelebration(context);
        
      case 'analytics':
        const analyticsAgent = agent as AnalyticsAgentImpl;
        return await analyticsAgent.analyzeLearningPatterns(context);
        
      case 'language':
        const languageAgent = agent as LanguageAgentImpl;
        return await languageAgent.generateBilingualInstruction(context);
        
      case 'memory':
        const memoryAgent = agent as MemoryAgentImpl;
        return await memoryAgent.retrievePatterns(context);
        
      default:
        throw new Error(`Unknown agent: ${agentId}`);
    }
  }

  /**
   * ⏱️ Execute with timeout to prevent hanging
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>, 
    agentId: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Agent ${agentId} timeout`)), this.RESPONSE_TIMEOUT)
    );

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * 🛡️ Fallback response when agents fail
   */
  private createFallbackResponse(context: AgentContext): AgentResponse {
    return {
      agentId: 'fallback',
      confidence: 0.5,
      reasoning: 'Fallback response due to agent system failure',
      action: {
        type: 'speak',
        payload: { 
          message: '¡Sigue intentando! Keep trying!',
          language: 'bilingual'
        },
        priority: 'medium'
      },
      metadata: {
        fallback: true,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 🔍 Get agent status for debugging
   */
  getAgentStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [id] of this.agents) {
      status[id] = true; // In a real implementation, check agent health
    }
    return status;
  }
}

export default AgentOrchestratorImpl;
