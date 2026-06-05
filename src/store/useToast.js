import { create } from 'zustand';

// Lightweight global toast/notification used across the app.
// Works on web too, unlike React Native's Alert (which is a no-op on react-native-web).
let hideTimer = null;

export const useToast = create((set) => ({
  visible: false,
  message: '',
  type: 'success', // 'success' | 'error' | 'info'

  showToast: (message, type = 'success', duration = 2800) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: true, message, type });
    hideTimer = setTimeout(() => set({ visible: false }), duration);
  },

  hideToast: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: false });
  },
}));
