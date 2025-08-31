import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store';

export interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'completed' | 'failed';
  score: number;
  level: number;
  timeRemaining: number;
  totalTime: number;
  streak: number;
  mistakes: number;
  isLoading: boolean;
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
  };

  return {
    gameState,
    actions,
    config,
  };
};
