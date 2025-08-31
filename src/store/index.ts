import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Child, ChildLearningProfile, GameSession, User } from '@/types';

interface AppState {
  // Estado de autenticación y usuario
  user: User | null;
  isFirstTime: boolean;
  isOnboardingCompleted: boolean;
  
  // Estado de los niños
  activeChild: Child | null;
  children: Child[];
  childrenProfiles: Record<string, ChildLearningProfile>;
  
  // Estado de juegos y sesiones
  currentGameSession: GameSession | null;
  gameSessions: GameSession[];
  
  // Configuraciones de la app
  settings: {
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    vibrationEnabled: boolean;
    darkModeEnabled: boolean;
    language: 'es' | 'en';
  };
  
  // Acciones para usuario
  setUser: (user: User) => void;
  clearUser: () => void;
  
  // Acciones para onboarding
  completeOnboarding: () => void;
  setFirstTime: (isFirstTime: boolean) => void;
  
  // Acciones para niños
  addChild: (child: Child) => void;
  updateChild: (childId: string, updates: Partial<Child>) => void;
  setActiveChild: (child: Child | null) => void;
  deleteChild: (childId: string) => void;
  
  // Acciones para perfiles de aprendizaje
  updateChildProfile: (childId: string, profile: Partial<ChildLearningProfile>) => void;
  getChildProfile: (childId: string) => ChildLearningProfile | null;
  
  // Acciones para sesiones de juego
  startGameSession: (session: Omit<GameSession, 'id'>) => void;
  endGameSession: (sessionId: string, endData: Partial<GameSession>) => void;
  getChildGameSessions: (childId: string) => GameSession[];
  
  // Acciones para configuraciones
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  
  // Acciones para resetear datos
  resetAllData: () => void;
}

// Estado inicial
const initialState = {
  user: null,
  isFirstTime: true,
  isOnboardingCompleted: false,
  activeChild: null,
  children: [],
  childrenProfiles: {},
  currentGameSession: null,
  gameSessions: [],
  settings: {
    soundEnabled: true,
    notificationsEnabled: true,
    vibrationEnabled: false,
    darkModeEnabled: false,
    language: 'es' as const,
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Acciones para usuario
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      
      // Acciones para onboarding
      completeOnboarding: () => set({ 
        isOnboardingCompleted: true,
        isFirstTime: false 
      }),
      setFirstTime: (isFirstTime) => set({ isFirstTime }),
      
      // Acciones para niños
      addChild: (child) => set((state) => ({
        children: [...state.children, child],
        activeChild: state.activeChild || child, // Establecer como activo si es el primero
      })),
      
      updateChild: (childId, updates) => set((state) => ({
        children: state.children.map(child => 
          child.id === childId ? { ...child, ...updates } : child
        ),
        activeChild: state.activeChild?.id === childId 
          ? { ...state.activeChild, ...updates } 
          : state.activeChild,
      })),
      
      setActiveChild: (child) => set({ activeChild: child }),
      
      deleteChild: (childId) => set((state) => {
        const updatedChildren = state.children.filter(child => child.id !== childId);
        const newActiveChild = state.activeChild?.id === childId 
          ? updatedChildren[0] || null 
          : state.activeChild;
        
        // Eliminar también el perfil y sesiones del niño
        const { [childId]: deletedProfile, ...remainingProfiles } = state.childrenProfiles;
        const remainingSessions = state.gameSessions.filter(session => session.childId !== childId);
        
        return {
          children: updatedChildren,
          activeChild: newActiveChild,
          childrenProfiles: remainingProfiles,
          gameSessions: remainingSessions,
        };
      }),
      
      // Acciones para perfiles de aprendizaje
      updateChildProfile: (childId, profileUpdates) => set((state) => ({
        childrenProfiles: {
          ...state.childrenProfiles,
          [childId]: {
            ...state.childrenProfiles[childId],
            ...profileUpdates,
            childId,
          },
        },
      })),
      
      getChildProfile: (childId) => {
        const state = get();
        return state.childrenProfiles[childId] || null;
      },
      
      // Acciones para sesiones de juego
      startGameSession: (sessionData) => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session: GameSession = {
          id: sessionId,
          ...sessionData,
        };
        
        set((state) => ({
          currentGameSession: session,
          gameSessions: [...state.gameSessions, session],
        }));
      },
      
      endGameSession: (sessionId, endData) => set((state) => ({
        currentGameSession: state.currentGameSession?.id === sessionId ? null : state.currentGameSession,
        gameSessions: state.gameSessions.map(session =>
          session.id === sessionId ? { ...session, ...endData } : session
        ),
      })),
      
      getChildGameSessions: (childId) => {
        const state = get();
        return state.gameSessions.filter(session => session.childId === childId);
      },
      
      // Acciones para configuraciones
      updateSettings: (settingsUpdates) => set((state) => ({
        settings: { ...state.settings, ...settingsUpdates },
      })),
      
      // Acción para resetear todos los datos
      resetAllData: () => set(initialState),
    }),
    {
      name: 'colors-shapes-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Solo persistir ciertos campos
        user: state.user,
        isFirstTime: state.isFirstTime,
        isOnboardingCompleted: state.isOnboardingCompleted,
        activeChild: state.activeChild,
        children: state.children,
        childrenProfiles: state.childrenProfiles,
        gameSessions: state.gameSessions,
        settings: state.settings,
      }),
    }
  )
);

// Selectores útiles
export const useIsLoggedIn = () => useAppStore((state) => !!state.user);
export const useActiveChild = () => useAppStore((state) => state.activeChild);
export const useChildren = () => useAppStore((state) => state.children);
export const useSettings = () => useAppStore((state) => state.settings);
export const useIsFirstTime = () => useAppStore((state) => state.isFirstTime);
export const useIsOnboardingCompleted = () => useAppStore((state) => state.isOnboardingCompleted);
