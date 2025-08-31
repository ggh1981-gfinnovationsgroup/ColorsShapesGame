import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Child, User } from '@/types';
import { useAppStore } from '@/store';

type OnboardingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const [step, setStep] = useState(1);
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  
  const { setUser, addChild, completeOnboarding } = useAppStore();

  const handleNext = () => {
    if (step === 1) {
      if (!parentName.trim()) {
        Alert.alert('Por favor', 'Ingresa tu nombre para continuar');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!childName.trim()) {
        Alert.alert('Por favor', 'Ingresa el nombre de tu pequeño');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const age = parseInt(childAge);
      if (!age || age < 3 || age > 6) {
        Alert.alert('Edad válida', 'Por favor ingresa una edad entre 3 y 6 años');
        return;
      }
      
      // Crear el usuario y niño
      const userId = `user_${Date.now()}`;
      const childId = `child_${Date.now()}`;
      
      const newUser: User = {
        id: userId,
        email: '', // Se puede agregar después
        name: parentName.trim(),
        children: [],
        subscriptionType: 'free',
      };
      
      const newChild: Child = {
        id: childId,
        name: childName.trim(),
        age: age,
        createdAt: new Date(),
      };
      
      // Guardar en el store
      setUser(newUser);
      addChild(newChild);
      completeOnboarding();
      
      navigation.replace('Home');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.stepTitle}>¡Hola!</Text>
            <Text style={styles.stepSubtitle}>
              Soy tu asistente mágico para que tu pequeño aprenda colores y formas
            </Text>
            <TextInput
              style={styles.input}
              placeholder="¿Cómo te llamas?"
              value={parentName}
              onChangeText={setParentName}
              placeholderTextColor="#999"
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.emoji}>👶</Text>
            <Text style={styles.stepTitle}>¡Perfecto, {parentName}!</Text>
            <Text style={styles.stepSubtitle}>
              Ahora cuéntame sobre tu pequeño explorador
            </Text>
            <TextInput
              style={styles.input}
              placeholder="¿Cómo se llama tu pequeño?"
              value={childName}
              onChangeText={setChildName}
              placeholderTextColor="#999"
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.emoji}>🎂</Text>
            <Text style={styles.stepTitle}>¡Hola {childName}!</Text>
            <Text style={styles.stepSubtitle}>
              Una última pregunta para personalizar tu experiencia
            </Text>
            <TextInput
              style={styles.input}
              placeholder="¿Cuántos años tiene?"
              value={childAge}
              onChangeText={setChildAge}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text style={styles.hint}>Ideal para niños de 3 a 6 años</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{step} de 3</Text>
        </View>

        {renderStep()}

        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Atrás</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {step === 3 ? '¡Comenzar!' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6c757d',
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: 'white',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6c757d',
  },
  nextButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    flex: 1,
    marginLeft: 20,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
