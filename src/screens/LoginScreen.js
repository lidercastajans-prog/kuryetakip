import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ActivityIndicator, Platform, TextInput, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/useAuthStore';
import { Truck, User, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react-native';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const logoScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    if (mode === 'login') {
      await signInWithEmail(email.trim(), password);
    } else {
      await signUpWithEmail(email.trim(), password);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoCircle}>
              <Truck color="#FFFFFF" size={44} />
            </View>
          </Animated.View>
          <Animated.Text style={[styles.title, { opacity: contentOpacity }]}>KuryeApp</Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity: contentOpacity }]}>
            Profesyonel Kurye Yönetim Sistemi
          </Animated.Text>
        </View>

        <Animated.View style={[styles.formCard, { opacity: contentOpacity }]}>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <User color="#9CA3AF" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Kullanıcı adı"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock color="#9CA3AF" size={18} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Şifre"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              {showPassword
                ? <EyeOff color="#6B7280" size={18} />
                : <Eye color="#6B7280" size={18} />
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!email || !password) && styles.primaryButtonDisabled]}
            onPress={handleEmailAuth}
            disabled={isLoading || !email || !password}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={signInWithGoogle}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#111827" size="small" />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Google ile Giriş Yap</Text>
                <ChevronRight color="#9CA3AF" size={18} />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.disclaimer}>
          Giriş yaparak verilerinizin güvenli şekilde{'\n'}bulut sunucusunda saklanmasını kabul ediyorsunuz.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
    backgroundColor: '#111827', borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  bgBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
    backgroundColor: '#0F172A',
  },
  content: { paddingHorizontal: 24, gap: 28 },
  logoSection: { alignItems: 'center' },
  logoContainer: { marginBottom: 20 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 26,
    backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 },
      android: { elevation: 12 },
    }),
  },
  title: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 6, fontWeight: '500' },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 12,
  },
  modeToggle: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12, padding: 4, marginBottom: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#EA580C' },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  modeBtnTextActive: { color: '#FFFFFF' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  eyeBtn: { padding: 4 },
  primaryButton: {
    backgroundColor: '#EA580C', height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  primaryButtonDisabled: { backgroundColor: '#7C2D12' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '500' },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', height: 52, borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  googleIconContainer: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  googleIcon: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  googleButtonText: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  disclaimer: { fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 18 },
});
