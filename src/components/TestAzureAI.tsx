import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { azureOpenAIService } from '@/services/azureOpenAI';

const TestAzureAI: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const isConnected = await azureOpenAIService.testConnection();
      if (isConnected) {
        Alert.alert('✅ Éxito', 'Conexión con Azure OpenAI exitosa');
      } else {
        Alert.alert('❌ Error', 'No se pudo conectar con Azure OpenAI');
      }
    } catch (error) {
      console.error('Test error:', error);
      Alert.alert('❌ Error', 'Error al probar conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const generateResponse = async () => {
    setIsLoading(true);
    try {
      const aiResponse = await azureOpenAIService.generateChildResponse(
        'Sofia',
        4,
        'aprender los colores',
        'es'
      );
      setResponse(aiResponse);
    } catch (error) {
      console.error('Generation error:', error);
      setResponse('Error al generar respuesta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 Prueba Azure OpenAI</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Probando...' : 'Probar Conexión'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={generateResponse}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Generando...' : 'Generar Respuesta IA'}
        </Text>
      </TouchableOpacity>

      {response ? (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Respuesta de IA:</Text>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f8ff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  responseContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  responseText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
});

export default TestAzureAI;
