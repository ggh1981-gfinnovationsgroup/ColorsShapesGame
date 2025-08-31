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
import { Color, getRandomColors } from './gameData';

interface TapTheColorGameProps {
  onScore: (points: number) => void;
  onMistake: () => void;
  onComplete: () => void;
  level: number;
  language: 'es' | 'en' | 'both';
}

const { width } = Dimensions.get('window');

const TapTheColorGame: React.FC<TapTheColorGameProps> = ({
  onScore,
  onMistake,
  onComplete,
  level,
  language
}) => {
  const [targetColor, setTargetColor] = useState<Color | null>(null);
  const [gameColors, setGameColors] = useState<Color[]>([]);
  const [celebration, setCelebration] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));
  const [isReadingInstruction, setIsReadingInstruction] = useState(false);

  // Calculate game difficulty based on level
  const getGameDifficulty = () => {
    if (level <= 3) return 'easy';
    if (level <= 7) return 'medium';
    return 'hard';
  };

  // Calculate grid size based on level
  const getGridSize = () => {
    if (level <= 2) return 2; // 2x2 = 4 colors
    if (level <= 5) return 3; // 3x3 = 9 colors
    if (level <= 8) return 4; // 4x4 = 16 colors
    return 5; // 5x5 = 25 colors
  };

  const gridSize = getGridSize();
  const colorSize = (width - 60) / gridSize;
  const difficulty = getGameDifficulty();

  // Initialize round
  const initializeRound = () => {
    const colorsNeeded = gridSize * gridSize;
    const roundColors = getRandomColors(colorsNeeded, difficulty);
    
    // Ensure we have a target
    const randomTarget = roundColors[Math.floor(Math.random() * roundColors.length)];
    
    setTargetColor(randomTarget);
    setGameColors(roundColors.sort(() => Math.random() - 0.5));
    
    // Speak instruction after a short delay
    setTimeout(() => {
      speakColorInstruction(randomTarget);
    }, 800);
  };

  // TTS function
  const speakColorInstruction = async (color: Color) => {
    if (isReadingInstruction) return;
    setIsReadingInstruction(true);
    
    try {
      if (language === 'es' || language === 'both') {
        const spanishText = `Toca el color ${color.nameEs}`;
        await Speech.speak(spanishText, {
          language: 'es-ES',
          rate: 0.8,
          pitch: 1.1,
        });
        
        if (language === 'both') {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      if (language === 'en' || language === 'both') {
        const englishText = `Tap the ${color.name} color`;
        await Speech.speak(englishText, {
          language: 'en-US',
          rate: 0.8,
          pitch: 1.1,
        });
      }
    } catch (error) {
      console.warn('TTS Error:', error);
    } finally {
      setIsReadingInstruction(false);
    }
  };

  // Handle color tap
  const handleColorTap = (color: Color) => {
    if (!targetColor || celebration) return;
    
    if (color.id === targetColor.id) {
      // Correct answer
      setCelebration(true);
      onScore(10 + (level * 2)); // More points for higher levels
      
      // Celebration animation
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
      
      // Positive feedback
      speakPositiveFeedback();
      
      setTimeout(() => {
        setCelebration(false);
        initializeRound();
      }, 1500);
      
    } else {
      // Wrong answer
      onMistake();
      speakNegativeFeedback();
      
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

  const speakPositiveFeedback = async () => {
    const positivePhrases = {
      es: ['¡Muy bien!', '¡Excelente!', '¡Perfecto!', '¡Genial!'],
      en: ['Great job!', 'Excellent!', 'Perfect!', 'Amazing!']
    };
    
    const phrase = language === 'en' 
      ? positivePhrases.en[Math.floor(Math.random() * positivePhrases.en.length)]
      : positivePhrases.es[Math.floor(Math.random() * positivePhrases.es.length)];
    
    await Speech.speak(phrase, {
      language: language === 'en' ? 'en-US' : 'es-ES',
      rate: 0.9,
      pitch: 1.2,
    });
  };

  const speakNegativeFeedback = async () => {
    const encouragingPhrases = {
      es: ['Inténtalo de nuevo', 'Casi lo logras', 'Sigue intentando'],
      en: ['Try again', 'Almost there', 'Keep trying']
    };
    
    const phrase = language === 'en' 
      ? encouragingPhrases.en[Math.floor(Math.random() * encouragingPhrases.en.length)]
      : encouragingPhrases.es[Math.floor(Math.random() * encouragingPhrases.es.length)];
    
    await Speech.speak(phrase, {
      language: language === 'en' ? 'en-US' : 'es-ES',
      rate: 0.8,
      pitch: 1.0,
    });
  };

  // Initialize first round
  useEffect(() => {
    initializeRound();
  }, [level]);

  return (
    <View style={styles.container}>
      {/* Instruction */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          {targetColor ? (
            language === 'en' 
              ? `Tap the ${targetColor.name}` 
              : `Toca el ${targetColor.nameEs}`
          ) : 'Loading...'}
        </Text>
        {targetColor && (
          <View 
            style={[
              styles.targetColorPreview, 
              { backgroundColor: targetColor.hex }
            ]} 
          />
        )}
      </View>

      {/* Color Grid */}
      <Animated.View 
        style={[
          styles.gameGrid, 
          { 
            transform: [{ scale: animatedValue }],
            width: gridSize * colorSize + 20,
            height: gridSize * colorSize + 20,
          }
        ]}
      >
        {gameColors.map((color, index) => (
          <TouchableOpacity
            key={`${color.id}-${index}`}
            style={[
              styles.colorBlock,
              {
                backgroundColor: color.hex,
                width: colorSize - 5,
                height: colorSize - 5,
              }
            ]}
            onPress={() => handleColorTap(color)}
            disabled={celebration}
          >
            {celebration && targetColor?.id === color.id && (
              <Text style={styles.celebrationEmoji}>🎉</Text>
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Level Info */}
      <Text style={styles.levelInfo}>
        Level {level} • {difficulty.toUpperCase()} • {gridSize}x{gridSize}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  targetColorPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  colorBlock: {
    margin: 2.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  celebrationEmoji: {
    fontSize: 30,
  },
  levelInfo: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
});

export default TapTheColorGame;
