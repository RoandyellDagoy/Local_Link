import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from './supabase'

export const user = ref(null)

if (isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data }) => { user.value = data.session?.user ?? null })
  supabase.auth.onAuthStateChange((_e, session) => { user.value = session?.user ?? null })
}

export const signOut = () => supabase.auth.signOut()
