/**
 * CrewAI-Inspired Multi-Agent System for Colors & Shapes
 * 
 * This implements the core concepts of CrewAI but in TypeScript
 * for React Native compatibility:
 * - Agents with specific roles and goals
 * - Task delegation and orchestration  
 * - Memory and context sharing
 * - Tool usage coordination
 * 
 * Inspired by: https://github.com/joaomdmoura/crewAI
 */

import { Agent, AgentRole, Task, AgentContext, AgentMemory } from './types';
import { azureOpenAIService } from '../services/azureOpenAIFixed';

export interface CrewConfig {
  agents: Agent[];
  memory: AgentMemory;
  verbose?: boolean;
  maxIterations?: number;
}

export interface TaskResult {
  success: boolean;
  result: any;
  agent: AgentRole;
  reasoning?: string;
  nextTasks?: Task[];
}

/**
 * CrewAI-Inspired Orchestrator
 * Manages multiple AI agents working together
 */
export class EducationalCrew {
  private agents: Map<AgentRole, Agent> = new Map();
  private memory: AgentMemory;
  private azureAI: typeof azureOpenAIService;
  private verbose: boolean;
  private maxIterations: number;

  constructor(config: CrewConfig) {
    this.memory = config.memory;
    this.verbose = config.verbose ?? false;
    this.maxIterations = config.maxIterations ?? 10;
    this.azureAI = azureOpenAIService;

    // Register all agents
    config.agents.forEach(agent => {
      this.agents.set(agent.role, agent);
      if (this.verbose) {
        console.log(`🤖 Agent registered: ${agent.role} - ${agent.goal}`);
      }
    });
  }

  /**
   * Execute a task with the crew
   * Uses CrewAI-style delegation and collaboration
   */
  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    
    if (this.verbose) {
      console.log(`🚀 Crew executing task: ${task.description}`);
    }

    try {
      // 1. Select best agent for the task
      const selectedAgent = this.selectAgentForTask(task);
      
      if (!selectedAgent) {
        throw new Error(`No suitable agent found for task: ${task.type}`);
      }

      // 2. Prepare context with crew memory
      const context = this.prepareContext(task, selectedAgent);
      
      // 3. Execute task with selected agent
      const result = await this.executeWithAgent(selectedAgent, task, context);
      
      // 4. Update crew memory
      await this.updateCrewMemory(task, result, selectedAgent);
      
      // 5. Determine if collaboration is needed
      const nextTasks = await this.planNextTasks(result, task);

      const executionTime = Date.now() - startTime;
      
      if (this.verbose) {
        console.log(`✅ Task completed by ${selectedAgent.role} in ${executionTime}ms`);
      }

      return {
        success: true,
        result: result.content,
        agent: selectedAgent.role,
        reasoning: result.reasoning,
        nextTasks
      };

    } catch (error) {
      if (this.verbose) {
        console.error(`❌ Crew task failed:`, error);
      }
      
      return {
        success: false,
        result: null,
        agent: 'unknown' as AgentRole,
        reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * CrewAI-style agent selection based on task requirements
   */
  private selectAgentForTask(task: Task): Agent | null {
    // Primary agent selection based on task type
    const primaryCandidates = Array.from(this.agents.values())
      .filter(agent => agent.capabilities.includes(task.type));

    if (primaryCandidates.length === 0) {
      // Fallback: select agent with most relevant tools
      const fallbackCandidates = Array.from(this.agents.values())
        .filter(agent => 
          agent.tools.some(tool => task.requiredTools?.includes(tool))
        );
      
      return fallbackCandidates[0] || null;
    }

    // Select best candidate based on success rate and experience
    return primaryCandidates.reduce((best, current) => {
      const bestScore = this.calculateAgentScore(best, task);
      const currentScore = this.calculateAgentScore(current, task);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateAgentScore(agent: Agent, task: Task): number {
    let score = 0;
    
    // Experience with this task type
    const taskHistory = this.memory.taskHistory.filter(
      h => h.agentRole === agent.role && h.taskType === task.type
    );
    const successRate = taskHistory.length > 0 
      ? taskHistory.filter(h => h.successful).length / taskHistory.length 
      : 0.5;
    
    score += successRate * 50;
    
    // Tool compatibility
    const toolMatch = task.requiredTools?.every(tool => 
      agent.tools.includes(tool)
    ) ?? true;
    score += toolMatch ? 30 : 0;
    
    // Recent performance
    const recentTasks = taskHistory.slice(-5);
    const recentSuccessRate = recentTasks.length > 0
      ? recentTasks.filter(h => h.successful).length / recentTasks.length
      : 0.5;
    score += recentSuccessRate * 20;
    
    return score;
  }

  /**
   * Prepare context with crew memory and collaboration history
   */
  private prepareContext(task: Task, agent: Agent): AgentContext {
    return {
      task,
      childProfile: this.memory.childProfile,
      sessionHistory: this.memory.sessionHistory.slice(-10), // Last 10 interactions
      agentMemory: this.memory.agentMemories.get(agent.role) || {},
      collaborationHistory: this.memory.taskHistory
        .filter(h => h.taskType === task.type)
        .slice(-5), // Last 5 similar tasks
      currentSession: {
        startTime: Date.now(),
        interactions: [],
        mood: this.memory.childProfile.currentMood,
        attentionLevel: this.memory.childProfile.attentionLevel
      }
    };
  }

  /**
   * Execute task with selected agent using Azure OpenAI
   */
  private async executeWithAgent(
    agent: Agent, 
    task: Task, 
    context: AgentContext
  ): Promise<{ content: any; reasoning: string }> {
    const contextString = `${task.description} for ${context.childProfile.name} (age ${context.childProfile.age})`;
    
    const response = await this.azureAI.generateChildResponse(
      context.childProfile.name,
      context.childProfile.age,
      contextString,
      context.childProfile.languagePreference === 'english' ? 'en' : 'es'
    );

    return {
      content: response,
      reasoning: `Agent ${agent.role} used ${agent.backstory} to complete ${task.type}`
    };
  }

  /**
   * Build CrewAI-style prompt with role, goal, and backstory
   */
  private buildCrewPrompt(agent: Agent, task: Task, context: AgentContext): string {
    return `
# AGENT PROFILE
Role: ${agent.role}
Goal: ${agent.goal}
Backstory: ${agent.backstory}

# TASK
Type: ${task.type}
Description: ${task.description}
Priority: ${task.priority}

# CHILD CONTEXT
Age: ${context.childProfile.age}
Name: ${context.childProfile.name}
Current Mood: ${context.currentSession.mood}
Attention Level: ${context.currentSession.attentionLevel}
Learning Style: ${context.childProfile.learningStyle}

# RECENT INTERACTIONS
${context.sessionHistory.slice(-3).map(h => 
  `- ${h.type}: ${h.description} (Success: ${h.successful})`
).join('\n')}

# CREW MEMORY
${context.collaborationHistory.slice(-2).map(h =>
  `- Previous ${h.taskType} by ${h.agentRole}: ${h.successful ? 'Success' : 'Failed'}`
).join('\n')}

# INSTRUCTIONS
As the ${agent.role}, use your expertise to complete this task effectively.
Consider the child's current state and previous interactions.
Collaborate with the crew's shared knowledge.
Provide a response that aligns with your role and goal.

# RESPONSE FORMAT
Provide your response as JSON with appropriate structure for task type "${task.type}".
`;
  }

  /**
   * Update crew memory with task results
   */
  private async updateCrewMemory(
    task: Task, 
    result: any, 
    agent: Agent
  ): Promise<void> {
    // Update task history
    this.memory.taskHistory.push({
      timestamp: Date.now(),
      taskType: task.type,
      agentRole: agent.role,
      successful: result !== null,
      result,
      childResponse: null // Will be updated later
    });

    // Update agent-specific memory
    const agentMemory = this.memory.agentMemories.get(agent.role) || {};
    agentMemory[`last_${task.type}`] = {
      result,
      timestamp: Date.now(),
      successful: result !== null
    };
    this.memory.agentMemories.set(agent.role, agentMemory);

    // Maintain memory size limits
    if (this.memory.taskHistory.length > 100) {
      this.memory.taskHistory = this.memory.taskHistory.slice(-50);
    }
  }

  /**
   * Plan next tasks based on results (CrewAI-style task chains)
   */
  private async planNextTasks(result: any, originalTask: Task): Promise<Task[]> {
    const nextTasks: Task[] = [];

    // Example: If learning coach creates hint, motivation agent should prepare celebration
    if (originalTask.type === 'generate_hint' && result) {
      nextTasks.push({
        type: 'prepare_celebration',
        description: 'Prepare celebration for when child uses the hint successfully',
        priority: 'medium',
        requiredTools: ['celebration_generator', 'tts_engine']
      });
    }

    // Example: If analytics agent detects struggle, learning coach should adapt
    if (originalTask.type === 'analyze_performance' && result?.needsAdaptation) {
      nextTasks.push({
        type: 'adapt_difficulty',
        description: 'Adjust game difficulty based on performance analysis',
        priority: 'high',
        requiredTools: ['difficulty_adapter', 'azure_openai']
      });
    }

    return nextTasks;
  }

  /**
   * Get crew status and performance metrics
   */
  getCrewStatus() {
    const agentStats = Array.from(this.agents.entries()).map(([role, agent]) => {
      const agentTasks = this.memory.taskHistory.filter(h => h.agentRole === role);
      const successRate = agentTasks.length > 0 
        ? agentTasks.filter(h => h.successful).length / agentTasks.length 
        : 0;

      return {
        role,
        goal: agent.goal,
        tasksCompleted: agentTasks.length,
        successRate: Math.round(successRate * 100),
        lastActive: agentTasks.length > 0 
          ? new Date(agentTasks[agentTasks.length - 1].timestamp).toISOString()
          : 'Never'
      };
    });

    return {
      crewSize: this.agents.size,
      totalTasks: this.memory.taskHistory.length,
      agentStats,
      memorySize: this.memory.sessionHistory.length,
      lastActivity: this.memory.taskHistory.length > 0
        ? new Date(this.memory.taskHistory[this.memory.taskHistory.length - 1].timestamp).toISOString()
        : 'Never'
    };
  }
}
