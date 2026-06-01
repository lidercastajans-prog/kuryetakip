import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/TabNavigator';

export default function App() {
  return (
    <SafeAreaProvider style={Platform.OS === 'web' ? { flex: 1, minHeight: '100vh', width: '100%' } : { flex: 1 }}>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
