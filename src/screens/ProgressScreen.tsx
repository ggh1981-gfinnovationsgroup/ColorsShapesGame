import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/types';
import { useActiveChild, useAppStore } from '@/store';

type ProgressNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Progress'>;
type ProgressRouteProp = RouteProp<RootStackParamList, 'Progress'>;

const { width } = Dimensions.get('window');

const ProgressScreen: React.FC = () => {
  const navigation = useNavigation<ProgressNavigationProp>();
  const route = useRoute<ProgressRouteProp>();
  const { childId } = route.params;
  
  const activeChild = useActiveChild();
  const { getChildGameSessions } = useAppStore();
  
  // Obtener sesiones reales del store
  const realGameSessions = getChildGameSessions(childId);
  
  // Usar datos reales si existen, sino usar datos mock
  const childName = activeChild?.name || 'Pequeño';
  const hasRealData = realGameSessions.length > 0;

  // Datos de progreso simulados - en el futuro vendrán del store
  const progressData = {
    totalGamesPlayed: 15,
    colorsLearned: 8,
    shapesLearned: 6,
    averageAccuracy: 85,
    streakDays: 3,
    weeklyProgress: [
      { day: 'L', games: 2, accuracy: 80 },
      { day: 'M', games: 3, accuracy: 85 },
      { day: 'X', games: 1, accuracy: 90 },
      { day: 'J', games: 4, accuracy: 88 },
      { day: 'V', games: 2, accuracy: 82 },
      { day: 'S', games: 3, accuracy: 86 },
      { day: 'D', games: 0, accuracy: 0 },
    ],
    achievements: [
      { id: 1, title: 'Primera Victoria', emoji: '🏆', unlocked: true },
      { id: 2, title: 'Maestro de Colores', emoji: '🎨', unlocked: true },
      { id: 3, title: 'Detective de Formas', emoji: '🔍', unlocked: false },
      { id: 4, title: 'Racha de 7 días', emoji: '🔥', unlocked: false },
    ]
  };

  const renderProgressBar = (percentage: number, color: string) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { backgroundColor: color }]}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${percentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>{percentage}%</Text>
    </View>
  );

  const renderWeeklyChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Actividad Semanal</Text>
      <View style={styles.chart}>
        {progressData.weeklyProgress.map((day, index) => (
          <View key={index} style={styles.chartDay}>
            <View style={styles.chartBarContainer}>
              <View 
                style={[
                  styles.chartBar, 
                  { 
                    height: Math.max(day.games * 20, 5),
                    backgroundColor: day.games > 0 ? '#667eea' : '#e9ecef'
                  }
                ]} 
              />
            </View>
            <Text style={styles.chartDayLabel}>{day.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Progreso de {childName}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Mensaje informativo para datos mock */}
        {!hasRealData && (
          <View style={styles.mockDataNotice}>
            <Text style={styles.mockDataEmoji}>📊</Text>
            <Text style={styles.mockDataTitle}>Datos de Ejemplo</Text>
            <Text style={styles.mockDataText}>
              Estos son datos de ejemplo. El progreso real aparecerá cuando {childName} comience a jugar.
            </Text>
          </View>
        )}

        {/* Estadísticas Principales */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progressData.totalGamesPlayed}</Text>
            <Text style={styles.statLabel}>Juegos Jugados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progressData.averageAccuracy}%</Text>
            <Text style={styles.statLabel}>Precisión</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progressData.streakDays}</Text>
            <Text style={styles.statLabel}>Días Seguidos</Text>
          </View>
        </View>

        {/* Progreso por Categoría */}
        <View style={styles.categoryProgress}>
          <Text style={styles.sectionTitle}>📈 Progreso de Aprendizaje</Text>
          
          <View style={styles.progressCategory}>
            <Text style={styles.categoryTitle}>🎨 Colores Aprendidos</Text>
            <Text style={styles.categoryCount}>
              {progressData.colorsLearned} de 12
            </Text>
            {renderProgressBar((progressData.colorsLearned / 12) * 100, '#e74c3c')}
          </View>

          <View style={styles.progressCategory}>
            <Text style={styles.categoryTitle}>🔷 Formas Aprendidas</Text>
            <Text style={styles.categoryCount}>
              {progressData.shapesLearned} de 10
            </Text>
            {renderProgressBar((progressData.shapesLearned / 10) * 100, '#3498db')}
          </View>
        </View>

        {/* Gráfico Semanal */}
        {renderWeeklyChart()}

        {/* Logros */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>🏆 Logros</Text>
          <View style={styles.achievementsList}>
            {progressData.achievements.map((achievement) => (
              <View 
                key={achievement.id} 
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementLocked
                ]}
              >
                <Text style={styles.achievementEmoji}>
                  {achievement.unlocked ? achievement.emoji : '🔒'}
                </Text>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.unlocked && styles.achievementTitleLocked
                ]}>
                  {achievement.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Motivación */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationEmoji}>🌟</Text>
          <Text style={styles.motivationTitle}>¡Excelente trabajo!</Text>
          <Text style={styles.motivationText}>
            Has mejorado mucho esta semana. ¡Sigue así!
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
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
  backButton: {
    marginRight: 15,
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#2c3e50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  categoryProgress: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  progressCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    minWidth: 35,
    textAlign: 'right',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
  },
  chartDay: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBar: {
    width: 20,
    borderRadius: 10,
  },
  chartDayLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  achievementsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: '#6c757d',
  },
  motivationCard: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  motivationEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  mockDataNotice: {
    backgroundColor: '#fff3cd',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    alignItems: 'center',
  },
  mockDataEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  mockDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  mockDataText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProgressScreen;
