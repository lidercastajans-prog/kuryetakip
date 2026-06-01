import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/TabNavigator';

// Inject professional CSS on web to lock the viewport and solve mobile browser height bugs (100vh scroll issue)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100% !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      -webkit-text-size-adjust: 100%;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <SafeAreaProvider style={Platform.OS === 'web' ? { position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden', width: '100%', height: '100%' } : { flex: 1 }}>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
