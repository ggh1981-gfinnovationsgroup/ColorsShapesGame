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

interface AudioRecognitionProps {
  onScore: (points: number) => void;
  onMistake: () => void;
  onComplete: () => void;
  language: 'es' | 'en' | 'both';
  level: number;
}

const { width } = Dimensions.get('window');
const OPTION_SIZE = (width - 80) / 2;

const AUDIO_ITEMS = [
  // Animals
  { id: 'dog', name: 'Dog', nameEs: 'Perro', sound: 'Woof woof', soundEs: 'Guau guau', emoji: '🐕', category: 'animals' },
  { id: 'cat', name: 'Cat', nameEs: 'Gato', sound: 'Meow', soundEs: 'Miau', emoji: '🐱', category: 'animals' },
  { id: 'cow', name: 'Cow', nameEs: 'Vaca', sound: 'Moo', soundEs: 'Muu', emoji: '🐄', category: 'animals' },
  { id: 'bird', name: 'Bird', nameEs: 'Pájaro', sound: 'Tweet tweet', soundEs: 'Pío pío', emoji: '🐦', category: 'animals' },
  { id: 'lion', name: 'Lion', nameEs: 'León', sound: 'Roar', soundEs: 'Rugido', emoji: '🦁', category: 'animals' },
  
  // Vehicles
  { id: 'car', name: 'Car', nameEs: 'Carro', sound: 'Beep beep', soundEs: 'Pip pip', emoji: '🚗', category: 'vehicles' },
  { id: 'train', name: 'Train', nameEs: 'Tren', sound: 'Choo choo', soundEs: 'Chu chu', emoji: '🚂', category: 'vehicles' },
  { id: 'airplane', name: 'Airplane', nameEs: 'Avión', sound: 'Zoom', soundEs: 'Zum', emoji: '✈️', category: 'vehicles' },
  { id: 'motorcycle', name: 'Motorcycle', nameEs: 'Moto', sound: 'Vroom vroom', soundEs: 'Brum brum', emoji: '🏍️', category: 'vehicles' },
  
  // Musical Instruments
  { id: 'piano', name: 'Piano', nameEs: 'Piano', sound: 'Ding dong', soundEs: 'Din don', emoji: '🎹', category: 'music' },
  { id: 'drum', name: 'Drum', nameEs: 'Tambor', sound: 'Boom boom', soundEs: 'Pum pum', emoji: '🥁', category: 'music' },
  { id: 'guitar', name: 'Guitar', nameEs: 'Guitarra', sound: 'Strum strum', soundEs: 'Tran tran', emoji: '🎸', category: 'music' },
];

const AudioRecognition: React.FC<AudioRecognitionProps> = ({
  onScore,
  onMistake,
  onComplete,
  language = 'both',
  level
}) => {
  const [targetItem, setTargetItem] = useState<typeof AUDIO_ITEMS[0]>(AUDIO_ITEMS[0]);
  const [options, setOptions] = useState<typeof AUDIO_ITEMS>([]);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));

  // Play the target sound
  const playTargetSound = async () => {
    if (isPlayingSound) return;
    
    setIsPlayingSound(true);
    
    try {
      // Play sound effect first
      const sound = language === 'es' ? targetItem.soundEs : targetItem.sound;
      
      await Speech.speak(sound, {
        language: language === 'es' ? 'es-ES' : 'en-US',
        pitch: 1.3,
        rate: 0.7,
      });
      
      // Small pause
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Then ask what makes this sound
      if (language === 'both' || language === 'es') {
        await Speech.speak('¿Qué hace este sonido?', {
          language: 'es-ES',
          pitch: 1.1,
          rate: 0.8,
        });
        
        if (language === 'both') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (language === 'both' || language === 'en') {
        await Speech.speak('What makes this sound?', {
          language: 'en-US',
          pitch: 1.1,
          rate: 0.8,
        });
      }
    } catch (error) {
      console.warn('TTS Error:', error);
    } finally {
      setIsPlayingSound(false);
    }
  };

  // Speak feedback
  const speakFeedback = async (correct: boolean, item?: typeof AUDIO_ITEMS[0]) => {
    try {
      if (correct && item) {
        const messages = language === 'es' 
          ? [`¡Correcto! Es un ${item.nameEs}`, `¡Muy bien! Es un ${item.nameEs}`]
          : language === 'en' 
          ? [`Correct! It's a ${item.name}`, `Great! It's a ${item.name}`]
          : [`¡Correcto! Es un ${item.nameEs}`, `Correct! It's a ${item.name}`];
        
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
    const difficulty = Math.min(2 + level, 4); // 2-4 options
    
    // Filter items by category for progression
    let availableItems = AUDIO_ITEMS;
    if (level <= 2) {
      availableItems = AUDIO_ITEMS.filter(item => item.category === 'animals');
    } else if (level <= 4) {
      availableItems = AUDIO_ITEMS.filter(item => 
        item.category === 'animals' || item.category === 'vehicles'
      );
    }
    
    // Select random target
    const randomTarget = availableItems[Math.floor(Math.random() * availableItems.length)];
    setTargetItem(randomTarget);
    
    // Create options including the target
    const otherItems = availableItems.filter(item => item.id !== randomTarget.id);
    const selectedOthers = otherItems
      .sort(() => Math.random() - 0.5)
      .slice(0, difficulty - 1);
    
    const roundOptions = [randomTarget, ...selectedOthers]
      .sort(() => Math.random() - 0.5);
    
    setOptions(roundOptions);
    
    // Play sound after a delay
    setTimeout(() => {
      playTargetSound();
    }, 1000);
  };

  // Handle option press
  const handleOptionPress = async (item: typeof AUDIO_ITEMS[0]) => {
    if (isPlayingSound) return;

    if (item.id === targetItem.id) {
      // Correct answer
      onScore(15 + level * 3);
      await speakFeedback(true, item);
      
      // Success animation
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
        onComplete();
      }, 2000);
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
          {language === 'es' ? 'Escucha el sonido y encuentra quién lo hace' 
          : language === 'en' ? 'Listen to the sound and find who makes it'
          : 'Escucha / Listen'}
        </Text>
        
        <TouchableOpacity 
          style={styles.playButton}
          onPress={playTargetSound}
          disabled={isPlayingSound}
        >
          <Text style={styles.playButtonText}>
            {isPlayingSound ? '🔊' : '🔊 Reproducir'}
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View 
        style={[styles.gameArea, { transform: [{ scale: animatedValue }] }]}
      >
        <View style={styles.optionsGrid}>
          {options.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.optionButton}
              onPress={() => handleOptionPress(item)}
              disabled={isPlayingSound}
            >
              <Text style={styles.optionEmoji}>{item.emoji}</Text>
              <Text style={styles.optionName}>
                {language === 'es' ? item.nameEs 
                : language === 'en' ? item.name
                : `${item.nameEs}\n${item.name}`}
              </Text>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  playButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  optionButton: {
    width: OPTION_SIZE,
    height: OPTION_SIZE,
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
  optionEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 10,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
});

export default AudioRecognition;
