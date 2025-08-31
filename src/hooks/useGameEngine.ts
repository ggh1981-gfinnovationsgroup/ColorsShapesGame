import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store';
import { azureOpenAIService } from '../services/azureOpenAIFixed';

export interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'completed' | 'failed';
  score: number;
  level: number;
  timeRemaining: number;
  totalTime: number;
  streak: number;
  mistakes: number;
  isLoading: boolean;
  aiHint: string | null;
  aiCelebration: string | null;
  aiFeedback: string | null;
}

export interface GameConfig {
  maxTime: number;
  maxMistakes: number;
  scoreMultiplier: number;
  levelProgression: number[];
}

export interface GameActions {
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  endGame: (success: boolean) => void;
  addScore: (points: number) => void;
  addMistake: () => void;
  nextLevel: () => void;
  resetStreak: () => void;
  getAIHint: (targetColor: string, targetColorSpanish: string) => Promise<void>;
  generateAICelebration: (achievement: 'correct_answer' | 'level_up' | 'high_score' | 'no_mistakes') => Promise<void>;
  generateAIFeedback: (gameContext: { correctAnswers: number; mistakes: number; timeSpent: number; difficulty: 'easy' | 'medium' | 'hard' }) => Promise<void>;
  clearAIMessages: () => void;
}

const DEFAULT_CONFIG: GameConfig = {
  maxTime: 60, // 60 seconds per level
  maxMistakes: 3,
  scoreMultiplier: 10,
  levelProgression: [100, 250, 500, 1000, 2000], // Score needed for each level
};

export const useGameEngine = (customConfig?: Partial<GameConfig>) => {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const activeChild = useAppStore((state) => state.activeChild);
  const updateChildProfile = useAppStore((state) => state.updateChildProfile);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    score: 0,
    level: 1,
    timeRemaining: config.maxTime,
    totalTime: config.maxTime,
    streak: 0,
    mistakes: 0,
    isLoading: false,
    aiHint: null,
    aiCelebration: null,
    aiFeedback: null,
  });

  // Timer effect
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }));
      }, 1000);
    } else if (gameState.timeRemaining <= 0 && gameState.status === 'playing') {
      endGame(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameState.status, gameState.timeRemaining]);

  // Check level progression
  useEffect(() => {
    const currentLevelThreshold = config.levelProgression[gameState.level - 1];
    if (currentLevelThreshold && gameState.score >= currentLevelThreshold) {
      nextLevel();
    }
  }, [gameState.score, gameState.level]);

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      timeRemaining: config.maxTime,
      totalTime: config.maxTime,
    }));
  }, [config.maxTime]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'paused',
    }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
    }));
  }, []);

  const restartGame = useCallback(() => {
    setGameState({
      status: 'idle',
      score: 0,
      level: 1,
      timeRemaining: config.maxTime,
      totalTime: config.maxTime,
      streak: 0,
      mistakes: 0,
      isLoading: false,
      aiHint: null,
      aiCelebration: null,
      aiFeedback: null,
    });
  }, [config.maxTime]);

  const endGame = useCallback((success: boolean) => {
    setGameState(prev => ({
      ...prev,
      status: success ? 'completed' : 'failed',
    }));

    // Update child progress in store
    if (activeChild) {
      // Update learning profile progress
      updateChildProfile(activeChild.id, {
        progress: {
          colorsLearned: [], // Will be filled by specific games
          shapesLearned: [], // Will be filled by specific games
          currentLevel: gameState.level,
          attentionSpanMinutes: Math.ceil((config.maxTime - gameState.timeRemaining) / 60),
        },
      });
    }
  }, [activeChild, updateChildProfile, gameState.level, gameState.timeRemaining, config.maxTime]);

  const addScore = useCallback((points: number) => {
    const ageMultiplier = activeChild ? getAgeMultiplier(activeChild.age) : 1;
    const finalPoints = Math.round(points * config.scoreMultiplier * ageMultiplier);
    
    setGameState(prev => ({
      ...prev,
      score: prev.score + finalPoints,
      streak: prev.streak + 1,
    }));
  }, [activeChild, config.scoreMultiplier]);

  const addMistake = useCallback(() => {
    setGameState(prev => {
      const newMistakes = prev.mistakes + 1;
      const shouldEndGame = newMistakes >= config.maxMistakes;
      
      return {
        ...prev,
        mistakes: newMistakes,
        streak: 0,
        status: shouldEndGame ? 'failed' : prev.status,
      };
    });
  }, [config.maxMistakes]);

  const nextLevel = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      timeRemaining: config.maxTime,
      totalTime: config.maxTime,
      mistakes: 0, // Reset mistakes for new level
    }));
  }, [config.maxTime]);

  const resetStreak = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      streak: 0,
    }));
  }, []);

  // Helper function for age-based scoring
  const getAgeMultiplier = (age: number): number => {
    if (age <= 3) return 1.5; // Younger kids get more points
    if (age <= 5) return 1.2;
    if (age <= 7) return 1.0;
    return 0.8; // Older kids need higher scores
  };

  // AI-powered functions
  const getAIHint = useCallback(async (targetColor: string, targetColorSpanish: string) => {
    if (!activeChild) return;
    
    // No solicitar hint si ya hay uno activo
    if (gameState.aiHint) return;
    
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      
      const hint = await azureOpenAIService.generateColorHint(
        activeChild.name,
        activeChild.age,
        targetColor,
        targetColorSpanish,
        gameState.mistakes,
        'es'
      );
      
      setGameState(prev => ({ 
        ...prev, 
        aiHint: hint,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error getting AI hint:', error);
      setGameState(prev => ({ 
        ...prev, 
        aiHint: '¡Puedes hacerlo! 🌈',
        isLoading: false 
      }));
    }
  }, [activeChild, gameState.mistakes, gameState.aiHint]);

  const generateAICelebration = useCallback(async (achievement: 'correct_answer' | 'level_up' | 'high_score' | 'no_mistakes') => {
    if (!activeChild) return;
    
    // No generar celebración si ya hay una activa
    if (gameState.aiCelebration) return;
    
    try {
      const celebration = await azureOpenAIService.generateCelebration(
        activeChild.name,
        activeChild.age,
        achievement,
        gameState.score,
        gameState.level,
        'es'
      );
      
      setGameState(prev => ({ 
        ...prev, 
        aiCelebration: celebration 
      }));
      
      // Auto-clear celebration after 4 seconds
      setTimeout(() => {
        setGameState(prev => ({ 
          ...prev, 
          aiCelebration: null 
        }));
      }, 4000);
    } catch (error) {
      console.error('Error generating AI celebration:', error);
      setGameState(prev => ({ 
        ...prev, 
        aiCelebration: '¡Excelente! 🎉' 
      }));
      
      // Auto-clear fallback after 3 seconds
      setTimeout(() => {
        setGameState(prev => ({ 
          ...prev, 
          aiCelebration: null 
        }));
      }, 3000);
    }
  }, [activeChild, gameState.score, gameState.level, gameState.aiCelebration]);

  const generateAIFeedback = useCallback(async (gameContext: { correctAnswers: number; mistakes: number; timeSpent: number; difficulty: 'easy' | 'medium' | 'hard' }) => {
    if (!activeChild) return;
    
    try {
      const feedback = await azureOpenAIService.generateMotivationalFeedback(
        activeChild.name,
        activeChild.age,
        gameContext,
        'es'
      );
      
      setGameState(prev => ({ 
        ...prev, 
        aiFeedback: feedback 
      }));
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      setGameState(prev => ({ 
        ...prev, 
        aiFeedback: '¡Buen trabajo! 👏' 
      }));
    }
  }, [activeChild]);

  const clearAIMessages = useCallback(() => {
    setGameState(prev => ({ 
      ...prev, 
      aiHint: null,
      aiCelebration: null,
      aiFeedback: null 
    }));
  }, []);

  const actions: GameActions = {
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    endGame,
    addScore,
    addMistake,
    nextLevel,
    resetStreak,
    getAIHint,
    generateAICelebration,
    generateAIFeedback,
    clearAIMessages,
  };

  return {
    gameState,
    actions,
    config,
  };
};
