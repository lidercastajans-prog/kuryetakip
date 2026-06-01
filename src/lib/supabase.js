import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const supabaseUrl = 'https://nfdzipkrkphvkhybjuvw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZHppcGtya3BodmtoeWJqdXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzMxMzMsImV4cCI6MjA5NTkwOTEzM30.ISng_jfheSK0BV2DcSBmYJIqcb2EuJ6Q4ODyxKmGfWM'

const isWeb = Platform.OS === 'web'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isWeb ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,
  },
})
