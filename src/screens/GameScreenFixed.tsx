import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Animated
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import { useGameEngine } from '../hooks/useGameEngine';
import { useAppStore } from '../store';

type GameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;
type GameRouteProp = RouteProp<RootStackParamList, 'Game'>;

interface Color {
  name: string;
  nameEs: string;
  hex: string;
  id: string;
}

const COLORS: Color[] = [
  { name: 'Red', nameEs: 'Rojo', hex: '#e74c3c', id: 'red' },
  { name: 'Blue', nameEs: 'Azul', hex: '#3498db', id: 'blue' },
  { name: 'Green', nameEs: 'Verde', hex: '#2ecc71', id: 'green' },
  { name: 'Yellow', nameEs: 'Amarillo', hex: '#f39c12', id: 'yellow' },
  { name: 'Purple', nameEs: 'Morado', hex: '#9b59b6', id: 'purple' },
  { name: 'Orange', nameEs: 'Naranja', hex: '#e67e22', id: 'orange' },
  { name: 'Pink', nameEs: 'Rosa', hex: '#e91e63', id: 'pink' },
  { name: 'Brown', nameEs: 'Café', hex: '#8d6e63', id: 'brown' },
];

const { width } = Dimensions.get('window');
const GRID_SIZE = 3;
const COLOR_SIZE = (width - 60) / GRID_SIZE;

const GameScreen: React.FC = () => {
  const navigation = useNavigation<GameNavigationProp>();
  const route = useRoute<GameRouteProp>();
  const { gameType, childId } = route.params;
  const activeChild = useAppStore((state) => state.activeChild);
  
  // Game Engine Hook
  const { gameState, actions, config } = useGameEngine({
    maxTime: 60,
    maxMistakes: 3,
    scoreMultiplier: 10,
  });

  // Game-specific state
  const [targetColor, setTargetColor] = useState<Color>(COLORS[0]);
  const [gameColors, setGameColors] = useState<Color[]>([]);
  const [celebration, setCelebration] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));

  // Get age-appropriate number of colors
  const getColorCount = () => {
    if (!activeChild) return 4;
    if (activeChild.age <= 3) return 4; // 2x2 grid
    if (activeChild.age <= 5) return 6; // 2x3 grid
    return 9; // 3x3 grid
  };

  // Generate new round
  const generateNewRound = () => {
    const colorCount = getColorCount();
    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
    const roundColors = shuffledColors.slice(0, colorCount);
    
    // Ensure target color is in the game
    const randomTarget = roundColors[Math.floor(Math.random() * roundColors.length)];
    
    setTargetColor(randomTarget);
    setGameColors(roundColors.sort(() => Math.random() - 0.5));
  };

  // Handle color tap
  const handleColorTap = (tappedColor: Color) => {
    if (gameState.status !== 'playing') return;

    if (tappedColor.id === targetColor.id) {
      // Correct answer!
      actions.addScore(gameState.level * 10);
      setCelebration(true);
      
      // Generate AI celebration only for special achievements
      if (gameState.mistakes === 0) {
        actions.generateAICelebration('no_mistakes');
      } else if (gameState.streak > 0 && gameState.streak % 5 === 0) {
        actions.generateAICelebration('high_score');
      } else {
        // Use basic celebration for regular correct answers
        actions.generateAICelebration('correct_answer');
      }
      
      // Celebration animation
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCelebration(false);
        generateNewRound();
      });
    } else {
      // Wrong answer
      actions.addMistake();
      
      // Show AI hint only after 2 mistakes to reduce API calls
      if (gameState.mistakes >= 2 && !gameState.aiHint) {
        actions.getAIHint(targetColor.name, targetColor.nameEs);
      }
      
      // Vibration/feedback for wrong answer
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Initialize game
  useEffect(() => {
    if (gameState.status === 'idle') {
      actions.startGame();
      generateNewRound();
    }
  }, [gameState.status]);

  // Handle game end
  useEffect(() => {
    if (gameState.status === 'completed' || gameState.status === 'failed') {
      Alert.alert(
        '¡Juego Terminado!',
        `Puntuación: ${gameState.score}\nNivel alcanzado: ${gameState.level}`,
        [
          { text: 'Jugar de nuevo', onPress: () => actions.restartGame() },
          { text: 'Salir', onPress: () => navigation.goBack() },
        ]
      );
    }
  }, [gameState.status, gameState.score, gameState.level]);

  if (gameState.status === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Preparando juego...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.scoreText}>Puntos: {gameState.score}</Text>
          <Text style={styles.levelText}>Nivel: {gameState.level}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timeText}>Tiempo: {gameState.timeRemaining}s</Text>
          <Text style={styles.mistakesText}>Errores: {gameState.mistakes}/{config.maxMistakes}</Text>
          {gameState.isLoading && (
            <Text style={styles.loadingIndicator}>🤖 Pensando...</Text>
          )}
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Target Color */}
        <View style={styles.targetSection}>
          <Text style={styles.instructionText}>Toca el color:</Text>
          <View style={styles.targetColorContainer}>
            <View style={[styles.targetColor, { backgroundColor: targetColor.hex }]} />
            <Text style={styles.targetColorName}>{targetColor.nameEs}</Text>
          </View>
        </View>

        {/* Color Grid */}
        <Animated.View style={[styles.colorGrid, { transform: [{ scale: animatedValue }] }]}>
          {gameColors.map((color, index) => (
            <TouchableOpacity
              key={`${color.id}-${index}`}
              style={[
                styles.colorButton,
                { backgroundColor: color.hex },
                celebration && color.id === targetColor.id && styles.celebrationColor
              ]}
              onPress={() => handleColorTap(color)}
              disabled={gameState.status !== 'playing'}
            />
          ))}
        </Animated.View>

        {celebration && (
          <View style={styles.celebrationOverlay}>
            <Text style={styles.celebrationText}>¡Excelente! 🎉</Text>
          </View>
        )}

        {/* AI Celebration */}
        {gameState.aiCelebration && (
          <View style={styles.aiCelebrationOverlay}>
            <Text style={styles.aiCelebrationText}>{gameState.aiCelebration}</Text>
          </View>
        )}

        {/* AI Hint */}
        {gameState.aiHint && (
          <View style={styles.aiHintContainer}>
            <Text style={styles.aiHintText}>{gameState.aiHint}</Text>
            <TouchableOpacity 
              style={styles.closeHintButton}
              onPress={actions.clearAIMessages}
            >
              <Text style={styles.closeHintText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      {(gameState.status === 'playing' || gameState.status === 'paused') && (
        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.controlButtonText}>Salir</Text>
          </TouchableOpacity>
          
          {gameState.status === 'playing' && (
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={actions.pauseGame}
            >
              <Text style={styles.controlButtonText}>Pausa</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#34495e',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  levelText: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
  },
  mistakesText: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 4,
  },
  loadingIndicator: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 2,
    fontWeight: '600',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  targetSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  targetColorContainer: {
    alignItems: 'center',
  },
  targetColor: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  targetColorName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 10,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: width - 40,
  },
  colorButton: {
    width: COLOR_SIZE,
    height: COLOR_SIZE,
    margin: 5,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  celebrationColor: {
    borderColor: '#f1c40f',
    borderWidth: 5,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -25 }],
    backgroundColor: 'rgba(241, 196, 15, 0.9)',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  controlButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  aiCelebrationOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -125 }, { translateY: -50 }],
    backgroundColor: 'rgba(46, 204, 113, 0.95)',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: 250,
    alignItems: 'center',
  },
  aiCelebrationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  aiHintContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.95)',
    padding: 16,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  aiHintText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 22,
  },
  closeHintButton: {
    marginLeft: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeHintText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GameScreen;
