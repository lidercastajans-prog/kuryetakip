import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, X } from 'lucide-react-native';
import { useToast } from '../store/useToast';

const VARIANTS = {
  success: { bg: '#ECFDF5', border: '#10B981', accent: '#059669', text: '#065F46', Icon: CheckCircle2 },
  error: { bg: '#FEF2F2', border: '#EF4444', accent: '#DC2626', text: '#7F1D1D', Icon: AlertCircle },
  info: { bg: '#EFF6FF', border: '#3B82F6', accent: '#2563EB', text: '#1E3A8A', Icon: AlertCircle },
};

export default function Toast() {
  const { visible, message, type, hideToast } = useToast();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: visible ? 0 : -140, useNativeDriver: true, friction: 9, tension: 70 }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const v = VARIANTS[type] || VARIANTS.success;
  const Icon = v.Icon;

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[styles.wrap, { top: insets.top + 12, opacity, transform: [{ translateY }] }]}
    >
      <View style={[styles.toast, { backgroundColor: v.bg, borderColor: v.border }]}>
        <Icon color={v.accent} size={22} />
        <Text style={[styles.message, { color: v.text }]} numberOfLines={2}>{message}</Text>
        <TouchableOpacity onPress={hideToast} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X color={v.text} size={18} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 9999, alignItems: 'center' },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    width: '100%', maxWidth: 460,
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1, borderLeftWidth: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
    }),
  },
  message: { flex: 1, fontSize: 14, fontWeight: '600' },
});
