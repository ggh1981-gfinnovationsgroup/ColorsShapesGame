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
import { Color, Shape, getRandomColors, getRandomShapes } from './gameData';

interface ColorShapeItem {
  color: Color;
  shape: Shape;
  id: string;
}

interface ColorShapesMixGameProps {
  onScore: (points: number) => void;
  onMistake: () => void;
  onComplete: () => void;
  level: number;
  language: 'es' | 'en' | 'both';
}

const { width } = Dimensions.get('window');

const ColorShapesMixGame: React.FC<ColorShapesMixGameProps> = ({
  onScore,
  onMistake,
  onComplete,
  level,
  language
}) => {
  const [targetItem, setTargetItem] = useState<ColorShapeItem | null>(null);
  const [gameItems, setGameItems] = useState<ColorShapeItem[]>([]);
  const [celebration, setCelebration] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));
  const [isReadingInstruction, setIsReadingInstruction] = useState(false);

  // Calculate game difficulty based on level
  const getGameDifficulty = () => {
    if (level <= 3) return 'easy';
    if (level <= 7) return 'medium';
    return 'hard';
  };

  // Calculate number of items based on level
  const getItemCount = () => {
    if (level <= 2) return 4;  // 4 items
    if (level <= 5) return 6;  // 6 items
    if (level <= 8) return 9;  // 9 items
    return 12; // 12 items
  };

  const itemCount = getItemCount();
  const difficulty = getGameDifficulty();
  const itemsPerRow = Math.ceil(Math.sqrt(itemCount));
  const itemSize = (width - 80) / itemsPerRow;

  // Create color-shape combinations
  const createColorShapeItems = (count: number): ColorShapeItem[] => {
    const colors = getRandomColors(count, difficulty);
    const shapes = getRandomShapes(count, difficulty);
    
    return colors.map((color, index) => ({
      color,
      shape: shapes[index % shapes.length],
      id: `${color.id}-${shapes[index % shapes.length].id}-${index}`
    }));
  };

  // Initialize round
  const initializeRound = () => {
    const items = createColorShapeItems(itemCount);
    
    // Select random target
    const randomTarget = items[Math.floor(Math.random() * items.length)];
    
    setTargetItem(randomTarget);
    setGameItems(items.sort(() => Math.random() - 0.5));
    
    // Speak instruction after a short delay
    setTimeout(() => {
      speakCombinedInstruction(randomTarget);
    }, 800);
  };

  // TTS function for combined color-shape
  const speakCombinedInstruction = async (item: ColorShapeItem) => {
    if (isReadingInstruction) return;
    setIsReadingInstruction(true);
    
    try {
      if (language === 'es' || language === 'both') {
        const spanishText = `Encuentra el ${item.shape.nameEs} ${item.color.nameEs}`;
        await Speech.speak(spanishText, {
          language: 'es-ES',
          rate: 0.75,
          pitch: 1.1,
        });
        
        if (language === 'both') {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
      
      if (language === 'en' || language === 'both') {
        const englishText = `Find the ${item.color.name} ${item.shape.name}`;
        await Speech.speak(englishText, {
          language: 'en-US',
          rate: 0.75,
          pitch: 1.1,
        });
      }
    } catch (error) {
      console.warn('TTS Error:', error);
    } finally {
      setIsReadingInstruction(false);
    }
  };

  // Handle item tap
  const handleItemTap = (item: ColorShapeItem) => {
    if (!targetItem || celebration) return;
    
    if (item.id === targetItem.id) {
      // Correct answer
      setCelebration(true);
      onScore(20 + (level * 4)); // Highest points for mixed game
      
      // Celebration animation
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.4,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Positive feedback
      speakPositiveFeedback();
      
      setTimeout(() => {
        setCelebration(false);
        initializeRound();
      }, 2000);
      
    } else {
      // Wrong answer
      onMistake();
      speakNegativeFeedback();
      
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
    }
  };

  const speakPositiveFeedback = async () => {
    const positivePhrases = {
      es: ['¡Increíble!', '¡Fantástico!', '¡Perfecto!', '¡Excelente!', '¡Genial!'],
      en: ['Incredible!', 'Fantastic!', 'Perfect!', 'Excellent!', 'Amazing!']
    };
    
    const phrase = language === 'en' 
      ? positivePhrases.en[Math.floor(Math.random() * positivePhrases.en.length)]
      : positivePhrases.es[Math.floor(Math.random() * positivePhrases.es.length)];
    
    await Speech.speak(phrase, {
      language: language === 'en' ? 'en-US' : 'es-ES',
      rate: 0.9,
      pitch: 1.3,
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
          {targetItem ? (
            language === 'en' 
              ? `Find the ${targetItem.color.name} ${targetItem.shape.name}` 
              : `Encuentra el ${targetItem.shape.nameEs} ${targetItem.color.nameEs}`
          ) : 'Loading...'}
        </Text>
        {targetItem && (
          <View style={styles.targetItemPreview}>
            <View 
              style={[
                styles.targetColorShape,
                { backgroundColor: targetItem.color.hex }
              ]}
            >
              <Text style={styles.targetShapeEmoji}>{targetItem.shape.emoji}</Text>
            </View>
            <Text style={styles.targetItemName}>
              {language === 'en' 
                ? `${targetItem.color.name} ${targetItem.shape.name}`
                : `${targetItem.shape.nameEs} ${targetItem.color.nameEs}`
              }
            </Text>
          </View>
        )}
      </View>

      {/* Item Grid */}
      <Animated.View 
        style={[
          styles.gameGrid, 
          { 
            transform: [{ scale: animatedValue }],
            width: itemsPerRow * itemSize + 40,
          }
        ]}
      >
        {gameItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemBlock,
              {
                width: itemSize - 10,
                height: itemSize - 10,
                backgroundColor: item.color.hex,
              }
            ]}
            onPress={() => handleItemTap(item)}
            disabled={celebration}
          >
            <Text style={styles.itemShapeEmoji}>{item.shape.emoji}</Text>
            {celebration && targetItem?.id === item.id && (
              <View style={styles.celebrationOverlay}>
                <Text style={styles.celebrationEmoji}>🌟</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Level Info */}
      <Text style={styles.levelInfo}>
        Level {level} • {difficulty.toUpperCase()} • Mixed Challenge
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
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#2c3e50',
  },
  targetItemPreview: {
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
  targetColorShape: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  targetShapeEmoji: {
    fontSize: 30,
  },
  targetItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  itemBlock: {
    margin: 5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  itemShapeEmoji: {
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    fontSize: 30,
  },
  levelInfo: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
});

export default ColorShapesMixGame;
