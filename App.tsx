import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';

// Importar todas las pantallas
import SplashScreen from '@/screens/SplashScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import HomeScreen from '@/screens/HomeScreen';
import GameScreen from '@/screens/GameScreenFixed';
import ProgressScreen from '@/screens/ProgressScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen} 
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />
                <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen
          name="Progress"
          component={ProgressScreen}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
