// src/agents/crew.ts - CrewAI-Inspired Multi-Agent Educational System
import { BaseAgent, Task, AgentRole, TaskType } from './types';
import { LearningCoach } from './learningCoach';
import { MotivationAgent } from './motivationAgent';
import { AnalyticsAgent } from './analyticsAgent';
import { LanguageAgent } from './languageAgent';
import { MemoryAgent } from './memoryAgent';

interface CrewConfig {
  verbose?: boolean;
  maxIterations?: number;
  enableMemory?: boolean;
  fallbackStrategy?: 'graceful' | 'strict';
}

interface TaskExecution {
  taskId: string;
  agentRole: AgentRole;
  startTime: number;
  endTime?: number;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * EducationalCrew - CrewAI-inspired orchestrator for educational AI agents
 * 
 * This class manages a crew of specialized educational agents that work together
 * to provide adaptive, personalized learning experiences for children.
 * 
 * Based on CrewAI principles:
 * - Agent specialization with clear roles and capabilities
 * - Task delegation based on agent expertise
 * - Shared memory and context between agents
 * - Collaborative decision making
 * - Performance tracking and optimization
 */
export class EducationalCrew {
  private agents: Map<AgentRole, BaseAgent>;
  private sharedMemory: Map<string, any>;
  private taskHistory: TaskExecution[];
  private config: CrewConfig;

  constructor(config: CrewConfig = {}) {
    this.config = {
      verbose: false,
      maxIterations: 10,
      enableMemory: true,
      fallbackStrategy: 'graceful',
      ...config
    };

    this.agents = new Map();
    this.sharedMemory = new Map();
    this.taskHistory = [];

    this.initializeCrew();
  }

  private initializeCrew(): void {
    // Registrar todos los agentes especializados
    this.agents.set('learning_coach', new LearningCoach());
    this.agents.set('motivation_specialist', new MotivationAgent());
    this.agents.set('analytics_expert', new AnalyticsAgent());
    this.agents.set('language_specialist', new LanguageAgent());
    this.agents.set('memory_keeper', new MemoryAgent());

    this.log('EducationalCrew initialized with 5 specialized agents');
  }

  /**
   * Ejecuta una tarea asignándola al agente más apropiado
   */
  async executeTask(task: Task): Promise<any> {
    const taskId = this.generateTaskId();
    this.log(`Executing task: ${task.type} (ID: ${taskId})`);

    try {
      // Seleccionar el mejor agente para la tarea
      const agent = this.selectBestAgent(task);
      
      if (!agent) {
        throw new Error(`No suitable agent found for task type: ${task.type}`);
      }

      // Enriquecer la tarea con contexto compartido
      const enrichedTask = this.enrichTaskWithContext(task);

      // Ejecutar la tarea
      const execution = this.startTaskExecution(taskId, agent.role);
      
      const result = await agent.processTask(enrichedTask);
      
      this.completeTaskExecution(execution, true, result);

      // Actualizar memoria compartida si la tarea fue exitosa
      if (result.success && this.config.enableMemory) {
        await this.updateSharedMemory(taskId, task, result, agent.role);
      }

      this.log(`Task completed successfully by ${agent.role}: ${result.reasoning}`);
      
      return {
        taskId,
        agent: agent.role,
        result,
        executionTime: execution.endTime! - execution.startTime,
        success: true
      };

    } catch (error) {
      this.log(`Task execution failed: ${error}`);
      
      if (this.config.fallbackStrategy === 'graceful') {
        return this.handleTaskFailure(taskId, task, error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Orquestación de múltiples tareas relacionadas
   */
  async orchestrateWorkflow(workflow: Task[]): Promise<any[]> {
    this.log(`Starting workflow orchestration with ${workflow.length} tasks`);
    
    const results = [];
    
    for (const task of workflow) {
      const result = await this.executeTask(task);
      results.push(result);
      
      // Si una tarea crítica falla, detener el workflow
      if (!result.success && task.priority === 'high') {
        this.log(`Workflow stopped due to critical task failure: ${task.type}`);
        break;
      }
    }

    return results;
  }

  /**
   * Ejecuta múltiples tareas en paralelo cuando es posible
   */
  async executeParallelTasks(tasks: Task[]): Promise<any[]> {
    this.log(`Executing ${tasks.length} tasks in parallel`);
    
    const taskPromises = tasks.map(task => this.executeTask(task));
    
    try {
      const results = await Promise.allSettled(taskPromises);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          this.log(`Parallel task ${tasks[index].type} failed: ${result.reason}`);
          return {
            taskId: this.generateTaskId(),
            agent: 'none',
            result: { success: false, error: result.reason },
            success: false
          };
        }
      });
    } catch (error) {
      this.log(`Parallel execution failed: ${error}`);
      throw error;
    }
  }

  private selectBestAgent(task: Task): BaseAgent | null {
    // Lógica de selección basada en capacidades y rendimiento
    for (const [role, agent] of this.agents) {
      if (agent.capabilities.includes(task.type)) {
        // Verificar rendimiento histórico del agente para este tipo de tarea
        const performance = this.getAgentPerformance(role, task.type);
        
        if (performance.successRate > 0.7 || performance.attempts === 0) {
          return agent;
        }
      }
    }

    // Fallback: retornar el primer agente que pueda manejar la tarea
    for (const [, agent] of this.agents) {
      if (agent.capabilities.includes(task.type)) {
        return agent;
      }
    }

    return null;
  }

  private enrichTaskWithContext(task: Task): Task {
    // Añadir contexto de memoria compartida
    const contextFromMemory = this.sharedMemory.get('current_context') || {};
    const recentTaskResults = this.getRecentTaskResults(3);
    
    return {
      ...task,
      metadata: {
        ...task.metadata,
        sharedContext: contextFromMemory,
        recentResults: recentTaskResults,
        timestamp: Date.now()
      }
    };
  }

  private async updateSharedMemory(taskId: string, task: Task, result: any, agentRole: AgentRole): Promise<void> {
    // Actualizar contexto basado en el resultado de la tarea
    if (result.data) {
      // Memoria específica por tipo de tarea
      const memoryKey = `${task.type}_results`;
      const existingResults = this.sharedMemory.get(memoryKey) || [];
      
      existingResults.push({
        taskId,
        timestamp: Date.now(),
        result: result.data,
        agent: agentRole,
        confidence: result.confidence
      });

      // Mantener solo los últimos 10 resultados por tipo
      if (existingResults.length > 10) {
        existingResults.splice(0, existingResults.length - 10);
      }

      this.sharedMemory.set(memoryKey, existingResults);
    }

    // Actualizar contexto general
    this.sharedMemory.set('last_execution', {
      taskId,
      taskType: task.type,
      agent: agentRole,
      timestamp: Date.now(),
      success: result.success
    });

    // Si hay un MemoryAgent, usar su capacidad de memoria especializada
    if (task.type !== 'update_memory') {
      const memoryTask: Task = {
        type: 'update_memory',
        description: 'Update memory with task execution results',
        priority: 'low',
        metadata: {
          taskExecution: { taskId, task, result, agentRole },
          context: 'crew_orchestration'
        }
      };

      try {
        const memoryAgent = this.agents.get('memory_keeper');
        if (memoryAgent) {
          await memoryAgent.processTask(memoryTask);
        }
      } catch (error) {
        this.log(`Failed to update specialized memory: ${error}`);
      }
    }
  }

  private getAgentPerformance(agentRole: AgentRole, taskType: TaskType): { successRate: number, attempts: number } {
    const agentTasks = this.taskHistory.filter(
      execution => execution.agentRole === agentRole && 
      execution.taskId.includes(taskType) // Simplificado para esta implementación
    );

    if (agentTasks.length === 0) {
      return { successRate: 1.0, attempts: 0 }; // Beneficio de la duda para agentes nuevos
    }

    const successful = agentTasks.filter(task => task.success).length;
    return {
      successRate: successful / agentTasks.length,
      attempts: agentTasks.length
    };
  }

  private getRecentTaskResults(limit: number): any[] {
    return this.taskHistory
      .slice(-limit)
      .map(execution => ({
        taskType: execution.taskId.split('_')[0], // Simplificado
        agent: execution.agentRole,
        success: execution.success,
        timestamp: execution.startTime
      }));
  }

  private startTaskExecution(taskId: string, agentRole: AgentRole): TaskExecution {
    const execution: TaskExecution = {
      taskId,
      agentRole,
      startTime: Date.now(),
      success: false
    };

    this.taskHistory.push(execution);
    return execution;
  }

  private completeTaskExecution(execution: TaskExecution, success: boolean, result?: any): void {
    execution.endTime = Date.now();
    execution.success = success;
    execution.result = result;
  }

  private handleTaskFailure(taskId: string, task: Task, error: any): any {
    this.log(`Handling task failure gracefully: ${task.type}`);
    
    return {
      taskId,
      agent: 'none',
      result: {
        success: false,
        data: null,
        reasoning: `Task failed: ${error.message || error}`,
        confidence: 0
      },
      success: false,
      error: error.message || error
    };
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[EducationalCrew] ${message}`);
    }
  }

  // Métodos públicos para interacción con el crew

  /**
   * Obtiene estadísticas del rendimiento del crew
   */
  getCrewStats(): any {
    const totalTasks = this.taskHistory.length;
    const successfulTasks = this.taskHistory.filter(t => t.success).length;
    
    return {
      totalTasks,
      successRate: totalTasks > 0 ? successfulTasks / totalTasks : 0,
      agentStats: this.getAgentStats(),
      memorySize: this.sharedMemory.size,
      averageExecutionTime: this.calculateAverageExecutionTime()
    };
  }

  private getAgentStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [role] of this.agents) {
      const agentTasks = this.taskHistory.filter(t => t.agentRole === role);
      const successful = agentTasks.filter(t => t.success).length;
      
      stats[role] = {
        totalTasks: agentTasks.length,
        successRate: agentTasks.length > 0 ? successful / agentTasks.length : 0,
        averageExecutionTime: this.calculateAgentAverageTime(role)
      };
    }
    
    return stats;
  }

  private calculateAverageExecutionTime(): number {
    const completedTasks = this.taskHistory.filter(t => t.endTime);
    
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => 
      sum + (task.endTime! - task.startTime), 0);
    
    return totalTime / completedTasks.length;
  }

  private calculateAgentAverageTime(agentRole: AgentRole): number {
    const agentTasks = this.taskHistory.filter(t => 
      t.agentRole === agentRole && t.endTime
    );
    
    if (agentTasks.length === 0) return 0;
    
    const totalTime = agentTasks.reduce((sum, task) => 
      sum + (task.endTime! - task.startTime), 0);
    
    return totalTime / agentTasks.length;
  }

  /**
   * Limpia el historial de tareas y memoria compartida
   */
  clearHistory(): void {
    this.taskHistory = [];
    this.sharedMemory.clear();
    this.log('Crew history and shared memory cleared');
  }

  /**
   * Obtiene información sobre los agentes disponibles
   */
  getAvailableAgents(): Array<{ role: AgentRole, capabilities: TaskType[] }> {
    const agentInfo = [];
    
    for (const [role, agent] of this.agents) {
      agentInfo.push({
        role,
        capabilities: agent.capabilities
      });
    }
    
    return agentInfo;
  }

  /**
   * Actualiza la configuración del crew
   */
  updateConfig(newConfig: Partial<CrewConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('Crew configuration updated');
  }
}

// Instancia singleton del crew educativo
export const educationalCrew = new EducationalCrew({
  verbose: __DEV__, // Solo verbose en desarrollo
  enableMemory: true,
  fallbackStrategy: 'graceful'
});
