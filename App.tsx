import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import TestAzureAI from './src/components/TestAzureAI';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎨 Colors & Shapes</Text>
      <Text style={styles.subtitle}>Demo de Azure OpenAI</Text>
      <TestAzureAI />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 20,
  },
});
