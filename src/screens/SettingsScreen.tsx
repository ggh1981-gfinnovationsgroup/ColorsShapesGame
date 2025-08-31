import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { useAppStore, useActiveChild, useSettings } from '@/store';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  
  // Usar settings del store en lugar de estado local
  const settings = useSettings();
  const activeChild = useActiveChild();
  const { updateSettings } = useAppStore();
  
  // Estados locales solo para UI
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.vibrationEnabled);
  const [darkModeEnabled, setDarkModeEnabled] = useState(settings.darkModeEnabled);

  // Funciones para actualizar settings en el store
  const handleSoundToggle = (value: boolean) => {
    setSoundEnabled(value);
    updateSettings({ soundEnabled: value });
  };

  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    updateSettings({ notificationsEnabled: value });
  };

  const handleVibrationToggle = (value: boolean) => {
    setVibrationEnabled(value);
    updateSettings({ vibrationEnabled: value });
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
    updateSettings({ darkModeEnabled: value });
  };

  const handleChildProfilePress = () => {
    navigation.navigate('Onboarding');
  };

  const handleParentControlsPress = () => {
    Alert.alert(
      'Control Parental',
      'Esta función permite configurar tiempo de juego, dificultad y contenido apropiado.',
      [{ text: 'OK' }]
    );
  };

  const handleDataExportPress = () => {
    Alert.alert(
      'Exportar Datos',
      '¿Deseas exportar el progreso y datos del niño?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Exportar', onPress: () => console.log('Exportando datos...') }
      ]
    );
  };

  const handleResetProgressPress = () => {
    const childName = activeChild?.name || 'el niño';
    Alert.alert(
      '⚠️ Reiniciar Progreso',
      `Esta acción eliminará todo el progreso de ${childName}. ¿Estás seguro?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Reiniciar', 
          style: 'destructive',
          onPress: () => console.log('Reiniciando progreso...') 
        }
      ]
    );
  };

  const handleAboutPress = () => {
    Alert.alert(
      'Acerca de Colors & Shapes',
      'Versión 1.0.0\n\nUna aplicación educativa para ayudar a los niños a aprender colores y formas de manera divertida.\n\nDesarrollado con ❤️ para el aprendizaje infantil.',
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    hasSwitch = false, 
    switchValue = false, 
    onSwitchChange,
    showArrow = true
  }: {
    title: string;
    subtitle?: string;
    icon: string;
    onPress?: () => void;
    hasSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={hasSwitch}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingTexts}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {hasSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#e9ecef', true: '#667eea' }}
            thumbColor={switchValue ? '#ffffff' : '#ffffff'}
          />
        ) : showArrow ? (
          <Text style={styles.arrow}>→</Text>
        ) : null}
      </View>
    </TouchableOpacity>
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
        <Text style={styles.title}>Configuración</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Perfil del Niño */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👶 Perfil del Niño</Text>
          <SettingItem
            icon="👤"
            title="Perfil del Niño"
            subtitle="Editar información y preferencias"
            onPress={handleChildProfilePress}
          />
          <SettingItem
            icon="🛡️"
            title="Control Parental"
            subtitle="Tiempo de juego y configuraciones"
            onPress={handleParentControlsPress}
          />
        </View>

        {/* Configuraciones de Audio y Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Audio y Notificaciones</Text>
          <SettingItem
            icon="🔊"
            title="Sonidos"
            subtitle="Efectos de sonido y música"
            hasSwitch={true}
            switchValue={soundEnabled}
            onSwitchChange={handleSoundToggle}
            showArrow={false}
          />
          <SettingItem
            icon="🔔"
            title="Notificaciones"
            subtitle="Recordatorios de juego"
            hasSwitch={true}
            switchValue={notificationsEnabled}
            onSwitchChange={handleNotificationsToggle}
            showArrow={false}
          />
          <SettingItem
            icon="📳"
            title="Vibración"
            subtitle="Retroalimentación táctil"
            hasSwitch={true}
            switchValue={vibrationEnabled}
            onSwitchChange={handleVibrationToggle}
            showArrow={false}
          />
        </View>

        {/* Configuraciones de Apariencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Apariencia</Text>
          <SettingItem
            icon="🌙"
            title="Modo Oscuro"
            subtitle="Interfaz con colores oscuros"
            hasSwitch={true}
            switchValue={darkModeEnabled}
            onSwitchChange={handleDarkModeToggle}
            showArrow={false}
          />
        </View>

        {/* Datos y Privacidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Datos y Privacidad</Text>
          <SettingItem
            icon="📊"
            title="Exportar Datos"
            subtitle="Descargar progreso del niño"
            onPress={handleDataExportPress}
          />
          <SettingItem
            icon="🗑️"
            title="Reiniciar Progreso"
            subtitle="Eliminar todo el progreso"
            onPress={handleResetProgressPress}
          />
        </View>

        {/* Información */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Información</Text>
          <SettingItem
            icon="📋"
            title="Acerca de"
            subtitle="Versión e información de la app"
            onPress={handleAboutPress}
          />
          <SettingItem
            icon="📞"
            title="Soporte"
            subtitle="Ayuda y contacto"
            onPress={() => Alert.alert('Soporte', 'Contacta con nosotros en: support@colorsshapes.com')}
          />
          <SettingItem
            icon="⭐"
            title="Calificar App"
            subtitle="Ayúdanos mejorando la app"
            onPress={() => Alert.alert('Calificar', '¡Gracias por usar nuestra app!')}
          />
        </View>

        {/* Información de la App */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Colors & Shapes Game</Text>
          <Text style={styles.versionText}>Versión 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 GF Innovations Group</Text>
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
  section: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingTexts: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 18,
    color: '#6c757d',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  appInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: '#adb5bd',
  },
});

export default SettingsScreen;
