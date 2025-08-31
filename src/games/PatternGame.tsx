import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions,
  Animated
} from 'react-native';
import * as Speech from 'expo-speech';

interface PatternGameProps {
  onScore: (points: number) => void;
  onMistake: () => void;
  onComplete: () => void;
  language: 'es' | 'en' | 'both';
  level: number;
}

const { width } = Dimensions.get('window');
const BUTTON_SIZE = (width - 100) / 3;

const PATTERN_COLORS = [
  { id: 'red', hex: '#e74c3c', name: 'Red', nameEs: 'Rojo' },
  { id: 'blue', hex: '#3498db', name: 'Blue', nameEs: 'Azul' },
  { id: 'green', hex: '#2ecc71', name: 'Green', nameEs: 'Verde' },
  { id: 'yellow', hex: '#f1c40f', name: 'Yellow', nameEs: 'Amarillo' },
];

const PatternGame: React.FC<PatternGameProps> = ({
  onScore,
  onMistake,
  onComplete,
  language = 'both',
  level
}) => {
  const [pattern, setPattern] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [gamePhase, setGamePhase] = useState<'showing' | 'waiting' | 'input'>('showing');
  const [animatedValue] = useState(new Animated.Value(1));

  // TTS for instructions
  const speakInstruction = async () => {
    try {
      if (language === 'both' || language === 'es') {
        await Speech.speak('Memoriza la secuencia de colores', {
          language: 'es-ES',
          pitch: 1.1,
          rate: 0.8,
        });
        
        if (language === 'both') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (language === 'both' || language === 'en') {
        await Speech.speak('Memorize the color sequence', {
          language: 'en-US',
          pitch: 1.1,
          rate: 0.8,
        });
      }
    } catch (error) {
      console.warn('TTS Error:', error);
    }
  };

  // Speak feedback
  const speakFeedback = async (correct: boolean) => {
    try {
      if (correct) {
        const messages = language === 'es' ? ['¡Perfecto!', '¡Excelente!'] 
                        : language === 'en' ? ['Perfect!', 'Excellent!']
                        : ['¡Perfecto!', 'Perfect!'];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        const speechLanguage = message.includes('¡') ? 'es-ES' : 'en-US';
        
        await Speech.speak(message, {
          language: speechLanguage,
          pitch: 1.2,
          rate: 0.9,
        });
      }
    } catch (error) {
      console.warn('Feedback TTS Error:', error);
    }
  };

  // Generate new pattern
  const generatePattern = () => {
    const patternLength = Math.min(2 + level, 6); // 2-6 steps
    const newPattern: string[] = [];
    
    for (let i = 0; i < patternLength; i++) {
      const randomColor = PATTERN_COLORS[Math.floor(Math.random() * PATTERN_COLORS.length)];
      newPattern.push(randomColor.id);
    }
    
    setPattern(newPattern);
    setUserInput([]);
    setCurrentStep(0);
    setGamePhase('showing');
  };

  // Show pattern to user
  const showPattern = async () => {
    setIsShowing(true);
    
    // Give instruction first
    await speakInstruction();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show each step of the pattern
    for (let i = 0; i < pattern.length; i++) {
      setCurrentStep(i);
      
      // Flash animation
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setCurrentStep(-1);
    setIsShowing(false);
    setGamePhase('input');
  };

  // Handle user input
  const handleColorPress = (colorId: string) => {
    if (gamePhase !== 'input') return;
    
    const newUserInput = [...userInput, colorId];
    setUserInput(newUserInput);
    
    // Check if the input matches the pattern so far
    const isCorrect = pattern[newUserInput.length - 1] === colorId;
    
    if (!isCorrect) {
      // Wrong color
      onMistake();
      
      // Shake animation
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
      
      // Reset after delay
      setTimeout(() => {
        generatePattern();
      }, 1500);
      
      return;
    }
    
    // Check if pattern is complete
    if (newUserInput.length === pattern.length) {
      // Pattern completed successfully
      onScore(15 + level * 3);
      speakFeedback(true);
      
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  };

  // Initialize game
  useEffect(() => {
    generatePattern();
  }, [level]);

  // Start showing pattern when it's generated
  useEffect(() => {
    if (pattern.length > 0 && gamePhase === 'showing') {
      showPattern();
    }
  }, [pattern, gamePhase]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.instruction}>
          {gamePhase === 'showing' 
            ? (language === 'es' ? 'Observa la secuencia...' 
              : language === 'en' ? 'Watch the sequence...'
              : 'Observa... / Watch...')
            : (language === 'es' ? 'Repite la secuencia' 
              : language === 'en' ? 'Repeat the sequence'
              : 'Repite / Repeat')
          }
        </Text>
        <Text style={styles.progress}>
          {userInput.length} / {pattern.length}
        </Text>
      </View>

      <Animated.View 
        style={[styles.gameArea, { transform: [{ scale: animatedValue }] }]}
      >
        <View style={styles.colorsGrid}>
          {PATTERN_COLORS.map((color, index) => (
            <TouchableOpacity
              key={color.id}
              style={[
                styles.colorButton,
                { backgroundColor: color.hex },
                isShowing && currentStep !== -1 && pattern[currentStep] === color.id && styles.highlightedButton,
                gamePhase === 'showing' && styles.disabledButton
              ]}
              onPress={() => handleColorPress(color.id)}
              disabled={gamePhase === 'showing'}
            >
              <Text style={styles.colorName}>
                {language === 'es' ? color.nameEs 
                : language === 'en' ? color.name
                : `${color.nameEs}\n${color.name}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {userInput.length > 0 && (
        <View style={styles.userPattern}>
          <Text style={styles.userPatternTitle}>Tu secuencia:</Text>
          <View style={styles.userPatternDots}>
            {userInput.map((colorId, index) => {
              const color = PATTERN_COLORS.find(c => c.id === colorId);
              return (
                <View 
                  key={index}
                  style={[styles.patternDot, { backgroundColor: color?.hex }]}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5,
  },
  progress: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  colorButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  highlightedButton: {
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowOpacity: 0.4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  colorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userPattern: {
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userPatternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  userPatternDots: {
    flexDirection: 'row',
    gap: 8,
  },
  patternDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
});

export default PatternGame;
