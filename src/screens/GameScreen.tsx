import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import { useGameEngine } from '../hooks/useGameEngine';
import { useAppStore } from '../store';
import { GameSelector, GameType } from '../games';

type GameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;
type GameRouteProp = RouteProp<RootStackParamList, 'Game'>;

const GameScreen: React.FC = () => {
  const navigation = useNavigation<GameNavigationProp>();
  const route = useRoute<GameRouteProp>();
  const { gameType, childId } = route.params;
  const activeChild = useAppStore((state) => state.activeChild);
  
  // Game Engine Hook
  const { gameState, actions, config } = useGameEngine({
    maxTime: 120,
    maxMistakes: 5,
    scoreMultiplier: 10,
  });

  // Game settings
  const [language] = useState<'es' | 'en' | 'both'>('both'); // Bilingual by default

  // Handle game events
  const handleScore = (points: number) => {
    actions.addScore(points);
  };

  const handleMistake = () => {
    actions.addMistake();
  };

  const handleComplete = () => {
    actions.nextLevel();
  };

  const handleGameOver = () => {
    actions.endGame(false);
    Alert.alert(
      '¡Juego Terminado! / Game Over!',
      `Score: ${gameState.score}\nLevel: ${gameState.level}`,
      [
        { text: 'Play Again / Jugar de Nuevo', onPress: handleRestart },
        { text: 'Menu / Menú', onPress: () => navigation.navigate('Home') },
      ]
    );
  };

  const handleRestart = () => {
    actions.restartGame();
    actions.startGame();
  };

  const handlePause = () => {
    if (gameState.status === 'playing') {
      actions.pauseGame();
    } else {
      actions.resumeGame();
    }
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Game / Salir del Juego',
      'Are you sure? / ¿Estás seguro?',
      [
        { text: 'Cancel / Cancelar', style: 'cancel' },
        { text: 'Exit / Salir', onPress: () => navigation.navigate('Home') },
      ]
    );
  };

  // Initialize game when component mounts
  useEffect(() => {
    actions.startGame();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleExit}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.gameInfo}>
          <Text style={styles.scoreText}>Score: {gameState.score}</Text>
          <Text style={styles.levelText}>Level: {gameState.level}</Text>
          <Text style={styles.mistakesText}>
            Mistakes: {gameState.mistakes}/{config.maxMistakes}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
          <Text style={styles.pauseButtonText}>
            {gameState.status === 'playing' ? '⏸️' : '▶️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Game Content */}
      <View style={styles.gameContent}>
        {gameState.status === 'playing' ? (
          <GameSelector
            gameType={gameType as GameType}
            onScore={handleScore}
            onMistake={handleMistake}
            onComplete={handleComplete}
            level={gameState.level}
            language={language}
          />
        ) : (
          <View style={styles.pausedOverlay}>
            <Text style={styles.pausedText}>Game Paused / Juego Pausado</Text>
            <TouchableOpacity style={styles.resumeButton} onPress={handlePause}>
              <Text style={styles.resumeButtonText}>Resume / Continuar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6c757d',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  gameInfo: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  mistakesText: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '500',
  },
  pauseButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007bff',
  },
  pauseButtonText: {
    fontSize: 20,
  },
  gameContent: {
    flex: 1,
  },
  pausedOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  pausedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  resumeButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: '#28a745',
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GameScreen;
