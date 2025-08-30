// Tipos básicos para la aplicación
export interface Child {
  id: string;
  name: string;
  age: number;
  avatar?: string;
  createdAt: Date;
}

export interface ChildLearningProfile {
  childId: string;
  age: number;
  preferences: {
    visualLearner: boolean;
    auditoryLearner: boolean;
    kinestheticLearner: boolean;
    preferredLanguage: 'es' | 'en' | 'both';
  };
  progress: {
    colorsLearned: string[];
    shapesLearned: string[];
    currentLevel: number;
    attentionSpanMinutes: number;
  };
  behaviorPatterns: {
    playTimePreferences: string[];
    difficultyPreference: 'easy' | 'medium' | 'challenging';
    motivationTriggers: string[];
  };
}

export interface GameSession {
  id: string;
  childId: string;
  gameType: string;
  startTime: Date;
  endTime?: Date;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  hintsUsed: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  children: Child[];
  subscriptionType: 'free' | 'premium';
}

// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Home: undefined;
  Game: { gameType: string; childId: string };
  Progress: { childId: string };
  Settings: undefined;
};
