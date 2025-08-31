/**
 * CrewAI-Inspired Types for Educational Multi-Agent System
 * Based on CrewAI architecture but adapted for React Native + TypeScript
 */

// Base Agent Types (CrewAI-inspired)
export type AgentRole = 
  | 'learning_coach' 
  | 'motivation_specialist'
  | 'analytics_expert'
  | 'language_specialist'
  | 'memory_keeper';

export type TaskType = 
  | 'generate_hint'
  | 'create_celebration' 
  | 'analyze_performance'
  | 'adapt_difficulty'
  | 'prepare_celebration'
  | 'provide_feedback'
  | 'update_memory'
  | 'suggest_next_activity';

export type ToolName = 
  | 'azure_openai'
  | 'tts_engine'
  | 'difficulty_adapter'
  | 'celebration_generator'
  | 'performance_analyzer'
  | 'memory_manager'
  | 'language_detector';

export interface Task {
  type: TaskType;
  description: string;
  priority: 'low' | 'medium' | 'high';
  requiredTools?: ToolName[];
  metadata?: Record<string, any>;
}

export interface TaskHistory {
  timestamp: number;
  taskType: TaskType;
  agentRole: AgentRole;
  successful: boolean;
  result: any;
  childResponse: any;
}

// CrewAI-style Agent Interface
export interface BaseAgent {
  role: AgentRole;
  goal: string;
  backstory: string;
  capabilities: TaskType[];
  tools: ToolName[];
  verbose?: boolean;
}

// Child Profile & Learning Data
export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  languagePreference: 'spanish' | 'english' | 'bilingual';
  currentMood: 'excited' | 'focused' | 'tired' | 'frustrated' | 'happy';
  attentionLevel: 'high' | 'medium' | 'low';
  progressLevel: number;
  lastActive: number;
}

export interface SessionInteraction {
  timestamp: number;
  type: string;
  description: string;
  successful: boolean;
  responseTime?: number;
  accuracy?: number;
}

export interface CurrentSession {
  startTime: number;
  interactions: SessionInteraction[];
  mood: ChildProfile['currentMood'];
  attentionLevel: ChildProfile['attentionLevel'];
}

// Memory System (Long-term & Short-term)
export interface AgentMemory {
  childProfile: ChildProfile;
  sessionHistory: SessionInteraction[];
  taskHistory: TaskHistory[];
  agentMemories: Map<AgentRole, Record<string, any>>;
  learningPatterns: LearningPattern[];
  preferences: UserPreferences;
}

export interface LearningPattern {
  concept: string; // e.g., 'red_color', 'circle_shape'
  masteryLevel: number; // 0-1
  lastPracticed: number;
  attemptsCount: number;
  successRate: number;
  averageResponseTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserPreferences {
  celebrationStyle: 'visual' | 'audio' | 'haptic' | 'mixed';
  difficultyProgression: 'slow' | 'normal' | 'fast';
  sessionLength: 'short' | 'medium' | 'long';
  hintFrequency: 'rare' | 'normal' | 'frequent';
  languageMix: number; // 0-1, 0=spanish only, 1=english only, 0.5=balanced
}

// Agent Context for Decision Making
export interface AgentContext {
  task: Task;
  childProfile: ChildProfile;
  sessionHistory: SessionInteraction[];
  agentMemory: Record<string, any>;
  collaborationHistory: TaskHistory[];
  currentSession: CurrentSession;
}

// Specific Agent Implementations

export interface LearningCoachAgent extends BaseAgent {
  role: 'learning_coach';
  specialization: 'difficulty_adaptation' | 'concept_introduction' | 'skill_building';
}

export interface MotivationAgent extends BaseAgent {
  role: 'motivation_specialist';
  celebrationTypes: string[];
  encouragementStyles: string[];
}

export interface AnalyticsAgent extends BaseAgent {
  role: 'analytics_expert';
  metricsTracked: string[];
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}

export interface LanguageAgent extends BaseAgent {
  role: 'language_specialist';
  supportedLanguages: string[];
  bilingualStrategies: string[];
}

export interface MemoryAgent extends BaseAgent {
  role: 'memory_keeper';
  memoryTypes: string[];
  retentionStrategies: string[];
}

// Union type for all agents
export type Agent = 
  | LearningCoachAgent 
  | MotivationAgent 
  | AnalyticsAgent 
  | LanguageAgent 
  | MemoryAgent;

// Game-specific Types
export interface GameState {
  currentLevel: number;
  score: number;
  streak: number;
  mistakes: number;
  timeRemaining: number;
  status: 'idle' | 'playing' | 'paused' | 'completed' | 'failed';
  isLoading: boolean;
}

export interface Color {
  name: string;
  nameEs: string;
  hex: string;
  id: string;
}

export interface Shape {
  name: string;
  nameEs: string;
  id: string;
  sides: number;
}

// AI Response Types
export interface AIHintResponse {
  message: string;
  type: 'encouragement' | 'specific_hint' | 'technique_suggestion';
  confidence: number;
  reasoning?: string;
}

export interface AICelebrationResponse {
  message: string;
  type: 'achievement' | 'progress' | 'effort' | 'milestone';
  intensity: 'low' | 'medium' | 'high';
  includeEffect?: boolean;
}

export interface AIFeedbackResponse {
  message: string;
  type: 'corrective' | 'encouraging' | 'instructional';
  nextSteps?: string[];
  difficultyAdjustment?: 'easier' | 'same' | 'harder';
}

// Agent Communication
export interface AgentMessage {
  from: AgentRole;
  to: AgentRole;
  type: 'request' | 'response' | 'notification';
  content: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

export interface CrewCommunication {
  messages: AgentMessage[];
  collaborationLog: string[];
  sharedContext: Record<string, any>;
}

// Reasoning Chain (Step 4 from framework)
export interface AIReasoning {
  observation: string;
  analysis: string;
  hypothesis: string;
  recommendation: string;
  confidence: number;
  evidence: string[];
}
