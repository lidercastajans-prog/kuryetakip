import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://xwkhnxubxoqclwizhojf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3a2hueHVieG9xY2x3aXpob2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzI3MzIsImV4cCI6MjA5MDEwODczMn0.6Z2Q0mI_GpHHRylWiotpmzODtBg7JEPJMeUp80vUTJ8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
