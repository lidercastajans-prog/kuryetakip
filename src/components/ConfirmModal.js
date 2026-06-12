import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet, Platform } from 'react-native';
import { useConfirm } from '../store/useConfirm';

export default function ConfirmModal() {
  const { open, title, message, confirmText, cancelText, destructive, _onConfirm, hide } = useConfirm();

  const handleConfirm = () => {
    const fn = _onConfirm;
    hide();
    if (fn) fn();
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={hide}>
      <Pressable style={styles.overlay} onPress={hide} accessibilityLabel="Kapat">
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation?.()}>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={hide} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={cancelText}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, destructive ? styles.destructiveBtn : styles.confirmBtn]}
              onPress={handleConfirm}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
            >
              <Text style={styles.confirmTextStyle}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 22,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24 },
      android: { elevation: 12 },
      web: { boxShadow: '0 12px 32px rgba(0,0,0,0.25)' },
    }),
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  message: { fontSize: 14, fontWeight: '500', color: '#6B7280', lineHeight: 20, marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  confirmBtn: { backgroundColor: '#EA580C' },
  destructiveBtn: { backgroundColor: '#DC2626' },
  confirmTextStyle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
