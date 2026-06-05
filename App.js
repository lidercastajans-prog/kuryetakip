import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/TabNavigator';
import Toast from './src/components/Toast';
import ConfirmModal from './src/components/ConfirmModal';

// Inject professional CSS on web to lock the viewport and solve mobile browser height bugs (100vh scroll issue)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Set the browser tab / document title (Expo doesn't set one, so it shows "undefined")
  document.title = 'KuryeTakip';

  // Ensure viewport-fit=cover for safe area insets on mobile browsers
  const existingMeta = document.querySelector('meta[name="viewport"]');
  if (existingMeta) {
    const content = existingMeta.getAttribute('content') || '';
    if (!content.includes('viewport-fit=cover')) {
      existingMeta.setAttribute('content', content + ', viewport-fit=cover');
    }
  } else {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.appendChild(meta);
  }

  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100dvh !important;
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
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      #root {
        padding-bottom: env(safe-area-inset-bottom, 0px) !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <SafeAreaProvider style={Platform.OS === 'web' ? { position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden', width: '100%', height: '100%' } : { flex: 1 }}>
      <AppNavigator />
      <Toast />
      <ConfirmModal />
    </SafeAreaProvider>
  );
}
