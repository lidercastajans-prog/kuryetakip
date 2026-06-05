import { create } from 'zustand';

// Global confirmation dialog (replaces Alert.alert with buttons, which is a
// no-op on react-native-web). Call showConfirm({ ..., onConfirm }).
export const useConfirm = create((set) => ({
  open: false,
  title: '',
  message: '',
  confirmText: 'Onayla',
  cancelText: 'İptal',
  destructive: false,
  _onConfirm: null,

  showConfirm: ({ title, message = '', confirmText = 'Onayla', cancelText = 'İptal', destructive = false, onConfirm }) =>
    set({ open: true, title, message, confirmText, cancelText, destructive, _onConfirm: onConfirm || null }),

  hide: () => set({ open: false, _onConfirm: null }),
}));
