import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Platform, TextInput, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../store/useToast';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';

export default function NewPasswordScreen() {
  const { updatePassword, isLoading } = useAuthStore();
  const showToast = useToast((s) => s.showToast);
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) return showToast('Şifre en az 6 karakter olmalı.', 'error');
    if (password !== confirm) return showToast('Şifreler eşleşmiyor.', 'error');
    await updatePassword(password);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconCircle}>
          <ShieldCheck color="#FFFFFF" size={40} />
        </View>
        <Text style={styles.title}>Yeni Şifre Belirle</Text>
        <Text style={styles.subtitle}>Hesabınız için yeni bir şifre oluşturun.</Text>

        <View style={styles.inputWrapper}>
          <Lock color="#9CA3AF" size={18} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Yeni şifre"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            {showPassword ? <EyeOff color="#6B7280" size={18} /> : <Eye color="#6B7280" size={18} />}
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <Lock color="#9CA3AF" size={18} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Yeni şifre (tekrar)"
            placeholderTextColor="#6B7280"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, (!password || !confirm) && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || !password || !confirm}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Şifreyi Güncelle</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { paddingHorizontal: 24, alignItems: 'center', gap: 16 },
  iconCircle: {
    width: 84, height: 84, borderRadius: 24,
    backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 },
      android: { elevation: 12 },
    }),
  },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 12 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  eyeBtn: { padding: 4 },
  primaryButton: {
    backgroundColor: '#EA580C', height: 52, borderRadius: 14, width: '100%',
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  primaryButtonDisabled: { backgroundColor: '#7C2D12' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
