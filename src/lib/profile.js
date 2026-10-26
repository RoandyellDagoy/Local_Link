import { ref, computed, watch } from 'vue'
import { supabase, isSupabaseConfigured } from './supabase'
import { user } from './auth'

export const profile = ref(null)

export const isSeller = computed(() => profile.value?.role === 'seller')
export const isBuyer = computed(() => !isSeller.value)

async function load() {
  const u = user.value
  if (!u || !isSupabaseConfigured) { profile.value = null; return }
  const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
  if (data) { profile.value = data; return }
  // Fallback for accounts created before the profiles table existed
  const role = u.user_metadata?.role || 'buyer'
  const fresh = {
    id: u.id,
    full_name: u.user_metadata?.full_name || '',
    role,
    headline: role === 'seller' ? 'Seller' : 'Shopper'
  }
  const { data: created } = await supabase.from('profiles').upsert(fresh).select().maybeSingle()
  profile.value = created || fresh
}

watch(() => user.value?.id, load, { immediate: true })

export async function saveProfile(patch, avatarFile) {
  const u = user.value
  const update = { ...patch, id: u.id, updated_at: new Date().toISOString() }

  if (avatarFile) {
    const ext = (avatarFile.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${u.id}/avatar-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
    if (upErr) throw upErr
    update.avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  }

  const { data, error } = await supabase.from('profiles').upsert(update).select().single()
  if (error) throw error
  profile.value = data
  // Keep auth metadata in sync too
  const meta = {}
  if (patch.full_name) meta.full_name = patch.full_name
  if (patch.role) meta.role = patch.role
  if (Object.keys(meta).length) await supabase.auth.updateUser({ data: meta })
}

export async function upgradeToSeller(headline = 'Seller & Producer') {
  await saveProfile({ role: 'seller', headline: headline || 'Seller' })
}

export async function downgradeToBuyer() {
  await saveProfile({ role: 'buyer', headline: 'Local Shopper' })
}
