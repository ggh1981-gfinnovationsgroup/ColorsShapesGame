// 🤖 AGENTIC AI TYPES - Multi-Agent System for Educational App
// Based on "How to Build AI Agents from Scratch" framework

export interface AgentContext {
  childId: string;
  sessionId: string;
  currentGame: string;
  gameState: any;
  timestamp: Date;
}

export interface AgentResponse {
  agentId: string;
  confidence: number;
  reasoning: string;
  action: AgentAction;
  metadata?: Record<string, any>;
}

export interface AgentAction {
  type: 'speak' | 'adjust_difficulty' | 'celebrate' | 'hint' | 'analyze' | 'remember';
  payload: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// 👨‍🏫 Learning Coach Agent
export interface LearningCoachAgent {
  id: 'learning_coach';
  assessDifficulty(context: AgentContext): Promise<AgentResponse>;
  suggestNextStep(context: AgentContext): Promise<AgentResponse>;
  adaptToMistakes(context: AgentContext): Promise<AgentResponse>;
}

// 🎉 Motivation Agent  
export interface MotivationAgent {
  id: 'motivation';
  generateCelebration(context: AgentContext): Promise<AgentResponse>;
  encourageOnMistake(context: AgentContext): Promise<AgentResponse>;
  maintainEngagement(context: AgentContext): Promise<AgentResponse>;
}

// 📊 Analytics Agent
export interface AnalyticsAgent {
  id: 'analytics';
  analyzeLearningPatterns(context: AgentContext): Promise<AgentResponse>;
  predictNextDifficulty(context: AgentContext): Promise<AgentResponse>;
  generateProgressReport(context: AgentContext): Promise<AgentResponse>;
}

// 🗣️ Language Agent
export interface LanguageAgent {
  id: 'language';
  generateBilingualInstruction(context: AgentContext): Promise<AgentResponse>;
  adaptLanguageLevel(context: AgentContext): Promise<AgentResponse>;
  handleSpeechRecognition(context: AgentContext): Promise<AgentResponse>;
}

// 🧠 Memory Agent
export interface MemoryAgent {
  id: 'memory';
  storeInteraction(context: AgentContext): Promise<AgentResponse>;
  retrievePatterns(context: AgentContext): Promise<AgentResponse>;
  updateChildProfile(context: AgentContext): Promise<AgentResponse>;
}

// 🎯 Agent Orchestrator
export interface AgentOrchestrator {
  executeWorkflow(context: AgentContext): Promise<AgentResponse[]>;
  coordinateAgents(agents: Agent[]): Promise<AgentResponse>;
  prioritizeActions(responses: AgentResponse[]): AgentResponse[];
}

export type Agent = LearningCoachAgent | MotivationAgent | AnalyticsAgent | LanguageAgent | MemoryAgent;

// 🧠 Long-term Memory Structures (Step 6 from framework)
export interface ChildLongTermMemory {
  childId: string;
  learningPatterns: LearningPattern[];
  preferredCelebrations: CelebrationType[];
  difficultyProgression: DifficultyLevel[];
  attentionSpanData: AttentionData[];
  languagePreference: 'spanish' | 'english' | 'bilingual';
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningPattern {
  concept: string; // 'colors', 'shapes', 'numbers'
  accuracy: number;
  responseTime: number;
  optimalDifficulty: number;
  bestTimeOfDay?: string;
  mistakePatterns: string[];
}

export interface CelebrationType {
  type: 'visual' | 'audio' | 'haptic' | 'combined';
  effectiveness: number; // 0-1
  lastUsed: Date;
}

export interface DifficultyLevel {
  game: string;
  level: number;
  timestamp: Date;
  performance: number;
}

export interface AttentionData {
  sessionDuration: number;
  focusLapses: number;
  optimalSessionLength: number;
  timestamp: Date;
}

// 🤔 Reasoning Chain (Step 4 from framework)
export interface AIReasoning {
  observation: string;
  analysis: string;
  hypothesis: string;
  recommendation: string;
  confidence: number;
  evidence: string[];
}
