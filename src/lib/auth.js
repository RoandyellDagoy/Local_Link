import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from './supabase'
import { clearCart } from './cart'

export const user = ref(null)

if (isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data }) => { user.value = data.session?.user ?? null })
  supabase.auth.onAuthStateChange((_e, session) => { user.value = session?.user ?? null })
}

export const signOut = () => {
  clearCart()
  return supabase.auth.signOut()
}

// Sign out and send the user back to the home page
export async function logout(router) {
  await signOut()
  router.push('/')
}
