import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { useActiveChild } from '@/store';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const activeChild = useActiveChild();

  const handleGamePress = (gameType: string) => {
    const childId = activeChild?.id || 'temp-child-id';
    navigation.navigate('Game', { gameType, childId });
  };

  const handleProgressPress = () => {
    const childId = activeChild?.id || 'temp-child-id';
    navigation.navigate('Progress', { childId });
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const greeting = activeChild ? `¡Hola ${activeChild.name}! 👋` : '¡Hola! 👋';
  const subtitle = activeChild 
    ? '¿Qué quieres aprender hoy?' 
    : 'Bienvenido a Colors & Shapes';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.gamesContainer}>
          <Text style={styles.sectionTitle}>🎮 Juegos Divertidos</Text>
          
          <TouchableOpacity 
            style={[styles.gameCard, styles.colorGame]}
            onPress={() => handleGamePress('tap-the-color')}
          >
            <Text style={styles.gameEmoji}>🎨</Text>
            <Text style={styles.gameTitle}>Tap the Color</Text>
            <Text style={styles.gameDescription}>
              Encuentra los colores que te pido
            </Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>Fácil</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gameCard, styles.shapesGame]}
            onPress={() => handleGamePress('shape-match')}
          >
            <Text style={styles.gameEmoji}>🔷</Text>
            <Text style={styles.gameTitle}>Shape Match</Text>
            <Text style={styles.gameDescription}>
              Encuentra las formas iguales
            </Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>Medio</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gameCard, styles.mixedGame]}
            onPress={() => handleGamePress('color-shapes-mix')}
          >
            <Text style={styles.gameEmoji}>🌈</Text>
            <Text style={styles.gameTitle}>Color & Shapes</Text>
            <Text style={styles.gameDescription}>
              Combina colores y formas
            </Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>Desafío</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <TouchableOpacity style={styles.progressCard} onPress={handleProgressPress}>
            <Text style={styles.progressEmoji}>📊</Text>
            <Text style={styles.progressTitle}>Mi Progreso</Text>
            <Text style={styles.progressDescription}>
              Mira cuánto has aprendido
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: 'white',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  gamesContainer: {
    marginBottom: 30,
  },
  gameCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  colorGame: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  shapesGame: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  mixedGame: {
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  gameEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  progressEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  progressDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

export default HomeScreen;
