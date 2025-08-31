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
import { Shape, getRandomShapes } from './gameData';

interface ShapeMatchGameProps {
  onScore: (points: number) => void;
  onMistake: () => void;
  onComplete: () => void;
  level: number;
  language: 'es' | 'en' | 'both';
}

const { width } = Dimensions.get('window');

const ShapeMatchGame: React.FC<ShapeMatchGameProps> = ({
  onScore,
  onMistake,
  onComplete,
  level,
  language
}) => {
  const [targetShape, setTargetShape] = useState<Shape | null>(null);
  const [gameShapes, setGameShapes] = useState<Shape[]>([]);
  const [celebration, setCelebration] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));
  const [isReadingInstruction, setIsReadingInstruction] = useState(false);

  // Calculate game difficulty based on level
  const getGameDifficulty = () => {
    if (level <= 3) return 'easy';
    if (level <= 7) return 'medium';
    return 'hard';
  };

  // Calculate number of shapes based on level
  const getShapeCount = () => {
    if (level <= 2) return 4;  // 4 shapes
    if (level <= 5) return 6;  // 6 shapes
    if (level <= 8) return 9;  // 9 shapes
    return 12; // 12 shapes
  };

  const shapeCount = getShapeCount();
  const difficulty = getGameDifficulty();
  const shapesPerRow = Math.ceil(Math.sqrt(shapeCount));
  const shapeSize = (width - 80) / shapesPerRow;

  // Initialize round
  const initializeRound = () => {
    const roundShapes = getRandomShapes(shapeCount, difficulty);
    
    // Ensure we have a target
    const randomTarget = roundShapes[Math.floor(Math.random() * roundShapes.length)];
    
    setTargetShape(randomTarget);
    setGameShapes(roundShapes.sort(() => Math.random() - 0.5));
    
    // Speak instruction after a short delay
    setTimeout(() => {
      speakShapeInstruction(randomTarget);
    }, 800);
  };

  // TTS function for shapes
  const speakShapeInstruction = async (shape: Shape) => {
    if (isReadingInstruction) return;
    setIsReadingInstruction(true);
    
    try {
      if (language === 'es' || language === 'both') {
        const spanishText = `Encuentra el ${shape.nameEs}`;
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
        const englishText = `Find the ${shape.name}`;
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

  // Handle shape tap
  const handleShapeTap = (shape: Shape) => {
    if (!targetShape || celebration) return;
    
    if (shape.id === targetShape.id) {
      // Correct answer
      setCelebration(true);
      onScore(15 + (level * 3)); // More points for shapes game
      
      // Celebration animation
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Positive feedback
      speakPositiveFeedback();
      
      setTimeout(() => {
        setCelebration(false);
        initializeRound();
      }, 1800);
      
    } else {
      // Wrong answer
      onMistake();
      speakNegativeFeedback();
      
      // Shake animation
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.85,
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
      es: ['¡Muy bien!', '¡Excelente!', '¡Perfecto!', '¡Genial!', '¡Fantástico!'],
      en: ['Great job!', 'Excellent!', 'Perfect!', 'Amazing!', 'Fantastic!']
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
      es: ['Inténtalo de nuevo', 'Casi lo logras', 'Sigue intentando', 'Puedes hacerlo'],
      en: ['Try again', 'Almost there', 'Keep trying', 'You can do it']
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
          {targetShape ? (
            language === 'en' 
              ? `Find the ${targetShape.name}` 
              : `Encuentra el ${targetShape.nameEs}`
          ) : 'Loading...'}
        </Text>
        {targetShape && (
          <View style={styles.targetShapePreview}>
            <Text style={styles.targetShapeEmoji}>{targetShape.emoji}</Text>
            <Text style={styles.targetShapeName}>
              {language === 'en' ? targetShape.name : targetShape.nameEs}
            </Text>
          </View>
        )}
      </View>

      {/* Shape Grid */}
      <Animated.View 
        style={[
          styles.gameGrid, 
          { 
            transform: [{ scale: animatedValue }],
            width: shapesPerRow * shapeSize + 40,
          }
        ]}
      >
        {gameShapes.map((shape, index) => (
          <TouchableOpacity
            key={`${shape.id}-${index}`}
            style={[
              styles.shapeBlock,
              {
                width: shapeSize - 10,
                height: shapeSize - 10,
              }
            ]}
            onPress={() => handleShapeTap(shape)}
            disabled={celebration}
          >
            <Text style={styles.shapeEmoji}>{shape.emoji}</Text>
            {celebration && targetShape?.id === shape.id && (
              <View style={styles.celebrationOverlay}>
                <Text style={styles.celebrationEmoji}>🎉</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Level Info */}
      <Text style={styles.levelInfo}>
        Level {level} • {difficulty.toUpperCase()} • {shapeCount} Shapes
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
    marginBottom: 15,
    color: '#2c3e50',
  },
  targetShapePreview: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  targetShapeEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  targetShapeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  shapeBlock: {
    margin: 5,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#f1f3f4',
  },
  shapeEmoji: {
    fontSize: 35,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  celebrationEmoji: {
    fontSize: 25,
  },
  levelInfo: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
});

export default ShapeMatchGame;
