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
import { NUMBERS, getNumbersForAge, Number } from './data/numbers';

interface NumberRecognitionProps {
  onScore: (points: number) => void;
  onMistake: () => void;
  onComplete: () => void;
  language: 'es' | 'en' | 'both';
  childAge?: number;
  level: number;
}

const { width } = Dimensions.get('window');
const GRID_SIZE = 3;
const NUMBER_SIZE = (width - 60) / GRID_SIZE;

const NumberRecognition: React.FC<NumberRecognitionProps> = ({
  onScore,
  onMistake,
  onComplete,
  language = 'both',
  childAge = 4,
  level
}) => {
  const [targetNumber, setTargetNumber] = useState<Number>(NUMBERS[0]);
  const [gameNumbers, setGameNumbers] = useState<Number[]>([]);
  const [celebration, setCelebration] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));
  const [isReadingInstruction, setIsReadingInstruction] = useState(false);

  const availableNumbers = getNumbersForAge(childAge);

  // TTS for number instructions
  const speakNumberInstruction = async (number: Number) => {
    setIsReadingInstruction(true);
    
    try {
      if (language === 'both' || language === 'es') {
        await Speech.speak(`Encuentra el número ${number.nameEs}`, {
          language: 'es-ES',
          pitch: 1.1,
          rate: 0.8,
        });
        
        if (language === 'both') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (language === 'both' || language === 'en') {
        await Speech.speak(`Find the number ${number.name}`, {
          language: 'en-US',
          pitch: 1.1,
          rate: 0.8,
        });
      }
    } catch (error) {
      console.warn('TTS Error:', error);
    } finally {
      setIsReadingInstruction(false);
    }
  };

  // Speak positive feedback
  const speakFeedback = async (correct: boolean) => {
    try {
      if (correct) {
        const messages = language === 'es' ? ['¡Muy bien!', '¡Excelente!', '¡Correcto!'] 
                        : language === 'en' ? ['Great job!', 'Perfect!', 'Excellent!']
                        : ['¡Muy bien!', 'Great job!', '¡Perfecto!', 'Amazing!'];
        
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

  // Initialize round
  const initializeRound = () => {
    const difficulty = Math.min(Math.floor(level / 2) + 2, 6); // 2-6 numbers
    const maxRange = Math.min(availableNumbers.length, difficulty + level);
    
    // Select numbers for this round
    const roundNumbers = availableNumbers.slice(0, maxRange)
      .sort(() => Math.random() - 0.5)
      .slice(0, difficulty);
    
    // Ensure target number is in the game
    const randomTarget = roundNumbers[Math.floor(Math.random() * roundNumbers.length)];
    
    setTargetNumber(randomTarget);
    setGameNumbers(roundNumbers.sort(() => Math.random() - 0.5));
    
    // Give instruction after a delay
    setTimeout(() => {
      speakNumberInstruction(randomTarget);
    }, 800);
  };

  // Handle number press
  const handleNumberPress = async (number: Number) => {
    if (isReadingInstruction) return;

    if (number.id === targetNumber.id) {
      // Correct answer
      setCelebration(true);
      onScore(10 + level * 2);
      
      await speakFeedback(true);
      
      // Celebrate animation
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setCelebration(false);
        onComplete();
      }, 1500);
    } else {
      // Wrong answer
      onMistake();
      
      // Shake animation
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.9,
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

  // Initialize on mount and level change
  useEffect(() => {
    initializeRound();
  }, [level]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.instruction}>
          {language === 'es' ? `Encuentra el número: ${targetNumber.nameEs}` 
          : language === 'en' ? `Find the number: ${targetNumber.name}`
          : `Encuentra: ${targetNumber.nameEs} / Find: ${targetNumber.name}`}
        </Text>
        <Text style={styles.targetNumber}>{targetNumber.symbol}</Text>
      </View>

      <Animated.View 
        style={[styles.gameArea, { transform: [{ scale: animatedValue }] }]}
      >
        <View style={styles.numbersGrid}>
          {gameNumbers.map((number) => (
            <TouchableOpacity
              key={number.id}
              style={[
                styles.numberButton,
                targetNumber.id === number.id && celebration && styles.correctNumber
              ]}
              onPress={() => handleNumberPress(number)}
              disabled={isReadingInstruction}
            >
              <Text style={styles.numberSymbol}>{number.symbol}</Text>
              <Text style={styles.numberName}>
                {language === 'es' ? number.nameEs 
                : language === 'en' ? number.name
                : `${number.nameEs}\n${number.name}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {celebration && (
        <View style={styles.celebrationOverlay}>
          <Text style={styles.celebrationText}>
            🎉 ¡Perfecto! Perfect! 🎉
          </Text>
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
    marginBottom: 30,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instruction: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  targetNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3498db',
    textAlign: 'center',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  numberButton: {
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#ecf0f1',
    padding: 10,
  },
  correctNumber: {
    backgroundColor: '#2ecc71',
    borderColor: '#27ae60',
  },
  numberSymbol: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  numberName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 5,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default NumberRecognition;
