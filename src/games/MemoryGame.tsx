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
import { COLORS } from './gameData';

interface MemoryGameProps {
  onScore: (points: number) => void;
  onMistake: () => void;
  onComplete: () => void;
  language: 'es' | 'en' | 'both';
  level: number;
}

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 80) / 4;

interface MemoryCard {
  id: string;
  color: typeof COLORS[0];
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryGame: React.FC<MemoryGameProps> = ({
  onScore,
  onMistake,
  onComplete,
  language = 'both',
  level
}) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));

  // TTS for instructions
  const speakInstruction = async () => {
    try {
      if (language === 'both' || language === 'es') {
        await Speech.speak('Encuentra los pares de colores iguales', {
          language: 'es-ES',
          pitch: 1.1,
          rate: 0.8,
        });
        
        if (language === 'both') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (language === 'both' || language === 'en') {
        await Speech.speak('Find the matching color pairs', {
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
  const speakFeedback = async (match: boolean) => {
    try {
      if (match) {
        const messages = language === 'es' ? ['¡Muy bien!', '¡Excelente!'] 
                        : language === 'en' ? ['Great job!', 'Perfect!']
                        : ['¡Muy bien!', 'Great job!'];
        
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

  // Initialize game
  const initializeGame = () => {
    const pairsCount = Math.min(2 + level, 6); // 2-6 pairs
    const selectedColors = COLORS.slice(0, pairsCount);
    
    // Create pairs
    const gameCards: MemoryCard[] = [];
    selectedColors.forEach((color, index) => {
      gameCards.push({
        id: `${color.id}-1`,
        color,
        isFlipped: false,
        isMatched: false,
      });
      gameCards.push({
        id: `${color.id}-2`,
        color,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setSelectedCards([]);
    setMatchedPairs(0);
    setMoves(0);

    // Give instruction
    setTimeout(() => {
      speakInstruction();
    }, 1000);
  };

  // Handle card press
  const handleCardPress = (cardId: string) => {
    if (isChecking || selectedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newSelectedCards = [...selectedCards, cardId];
    setSelectedCards(newSelectedCards);

    // Flip the card
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    if (newSelectedCards.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);
      
      setTimeout(() => {
        checkForMatch(newSelectedCards);
      }, 1000);
    }
  };

  // Check for match
  const checkForMatch = async (selectedCardIds: string[]) => {
    const [firstCard, secondCard] = selectedCardIds.map(id => 
      cards.find(c => c.id === id)!
    );

    if (firstCard.color.id === secondCard.color.id) {
      // Match found
      setCards(prev => prev.map(c => 
        selectedCardIds.includes(c.id) ? { ...c, isMatched: true } : c
      ));
      
      const newMatchedPairs = matchedPairs + 1;
      setMatchedPairs(newMatchedPairs);
      
      onScore(20 + level * 5);
      await speakFeedback(true);

      // Check if game is complete
      if (newMatchedPairs === Math.min(2 + level, 6)) {
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } else {
      // No match
      onMistake();
      
      // Flip cards back
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          selectedCardIds.includes(c.id) ? { ...c, isFlipped: false } : c
        ));
      }, 500);
    }

    setSelectedCards([]);
    setIsChecking(false);
  };

  // Initialize on mount and level change
  useEffect(() => {
    initializeGame();
  }, [level]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.instruction}>
          {language === 'es' ? 'Encuentra los pares iguales' 
          : language === 'en' ? 'Find matching pairs'
          : 'Encuentra los pares / Find pairs'}
        </Text>
        <Text style={styles.stats}>
          Movimientos: {moves} | Pares: {matchedPairs}
        </Text>
      </View>

      <Animated.View 
        style={[styles.gameArea, { transform: [{ scale: animatedValue }] }]}
      >
        <View style={styles.cardsGrid}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                card.isFlipped || card.isMatched ? 
                  { backgroundColor: card.color.hex } : 
                  styles.cardBack,
                card.isMatched && styles.matchedCard
              ]}
              onPress={() => handleCardPress(card.id)}
              disabled={isChecking}
            >
              {card.isFlipped || card.isMatched ? (
                <Text style={styles.cardText}>
                  {language === 'es' ? card.color.nameEs : card.color.name}
                </Text>
              ) : (
                <Text style={styles.cardBackText}>?</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
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
  stats: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardBack: {
    backgroundColor: '#34495e',
  },
  matchedCard: {
    opacity: 0.8,
    borderWidth: 3,
    borderColor: '#f1c40f',
  },
  cardText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardBackText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default MemoryGame;
