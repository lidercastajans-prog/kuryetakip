import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Required for web browser auth session
WebBrowser.maybeCompleteAuthSession();

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  profile: null,

  // Initialize auth state on app launch
  initAuth: async () => {
    try {
      set({ isLoading: true });

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session) {
        set({
          user: session.user,
          session,
          isAuthenticated: true,
          profile: {
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email,
            avatar: session.user.user_metadata?.avatar_url || null,
          },
        });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          set({
            user: session.user,
            session,
            isAuthenticated: true,
            profile: {
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email,
              avatar: session.user.user_metadata?.avatar_url || null,
            },
          });
        } else {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            profile: null,
          });
        }
      });
    } catch (error) {
      console.error('Auth init error:', error.message);
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign in with Google using Supabase OAuth (redirect-based)
  signInWithGoogle: async () => {
    try {
      set({ isLoading: true });

      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        return;
      }

      // Use the app's custom scheme as redirect (Native only)
      const redirectUrl = Linking.createURL('auth/callback');

      console.log('Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          { showInRecents: true }
        );

        console.log('Auth result type:', result.type);

        if (result.type === 'success' && result.url) {
          console.log('Auth result URL:', result.url);

          // Parse the URL - tokens can be in hash fragment or query params
          const resultUrl = result.url;

          // Try hash fragment first (Supabase default for implicit flow)
          let params;
          const hashIndex = resultUrl.indexOf('#');
          if (hashIndex !== -1) {
            params = new URLSearchParams(resultUrl.substring(hashIndex + 1));
          } else {
            const queryIndex = resultUrl.indexOf('?');
            if (queryIndex !== -1) {
              params = new URLSearchParams(resultUrl.substring(queryIndex + 1));
            }
          }

          const access_token = params?.get('access_token');
          const refresh_token = params?.get('refresh_token');

          if (access_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) throw sessionError;

            if (sessionData?.session) {
              set({
                user: sessionData.session.user,
                session: sessionData.session,
                isAuthenticated: true,
                profile: {
                  email: sessionData.session.user.email,
                  name: sessionData.session.user.user_metadata?.full_name || sessionData.session.user.email,
                  avatar: sessionData.session.user.user_metadata?.avatar_url || null,
                },
              });
            }
          } else {
            // Check for error in the redirect
            const errorDesc = params?.get('error_description') || params?.get('error');
            if (errorDesc) {
              throw new Error(errorDesc);
            }
            throw new Error('Token alınamadı. Lütfen tekrar deneyin.');
          }
        } else if (result.type === 'cancel') {
          // User cancelled, just reset loading
          console.log('User cancelled auth');
        }
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Giriş Hatası', error.message || 'Google ile giriş yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign in with Username & Password
  signInWithEmail: async (username, password) => {
    try {
      set({ isLoading: true });
      const email = `${username.toLowerCase()}@kuryeapp.app`;
      // On success, the onAuthStateChange listener flips isAuthenticated.
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      // Surface the real reason instead of always blaming the password.
      let message = error.message || 'Giriş yapılamadı.';
      if (message === 'Invalid login credentials') {
        message = 'Kullanıcı adı veya şifre hatalı.';
      } else if (message === 'Email not confirmed') {
        message = 'Hesabınız henüz doğrulanmamış. Supabase panelinde "Confirm email" ayarını kapatın.';
      }
      Alert.alert('Giriş Hatası', message);
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign up with Username & Password
  signUpWithEmail: async (username, password, realEmail, phone) => {
    try {
      set({ isLoading: true });
      const email = `${username.toLowerCase()}@kuryeapp.app`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            contact_email: realEmail,
            phone: phone
          }
        },
      });
      if (error) throw error;

      // Email confirmation disabled → signUp returns a session and the user is
      // already logged in (onAuthStateChange handles the navigation). This is
      // what makes "register then use the app" work without a manual login step.
      if (data.session) {
        return { success: true };
      }

      // No session returned → try to log in straight away with the same creds.
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInError) {
        return { success: true };
      }

      // Auto-login failed → email confirmation is enabled on the Supabase project,
      // which can never complete for these internal @kuryeapp.app addresses.
      Alert.alert(
        'Kayıt Tamamlanamadı',
        'Hesap oluşturuldu ancak otomatik giriş yapılamadı. Supabase panelinde Authentication → Providers → Email altından "Confirm email" ayarını kapatın, ardından tekrar deneyin.'
      );
      return { success: false };
    } catch (error) {
      let message = error.message || 'Kayıt oluşturulamadı.';
      if (message === 'User already registered') {
        message = 'Bu kullanıcı adı zaten kayıtlı. Giriş yapmayı deneyin.';
      }
      Alert.alert('Kayıt Hatası', message);
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        session: null,
        isAuthenticated: false,
        profile: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Çıkış Hatası', 'Çıkış yapılamadı.');
    }
  },
}));
