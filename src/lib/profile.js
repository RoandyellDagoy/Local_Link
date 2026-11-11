import { ref, computed, watch } from 'vue'
import { supabase, isSupabaseConfigured } from './supabase'
import { user } from './auth'

export const profile = ref(null)

// One place that describes each role (labels, default headline, landing page)
export const ROLES = {
  buyer: { label: 'Shopper', headline: 'Shopper', dashboard: 'Shopper Dashboard', home: '/profile' },
  seller: { label: 'Seller', headline: 'Seller', dashboard: 'Seller Dashboard', home: '/profile' },
  admin: { label: 'Admin', headline: 'Administrator', dashboard: 'Admin Dashboard', home: '/admin' }
}
export const roleInfo = (role) => ROLES[role] || ROLES.buyer

export async function fetchRole(uid) {
  if (!uid) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle()
  return data?.role ?? null
}

export const isSeller = computed(() => profile.value?.role === 'seller')
export const isAdmin = computed(() => profile.value?.role === 'admin')
export const isBuyer = computed(() => !isSeller.value && !isAdmin.value)

async function load() {
  const u = user.value
  if (!u || !isSupabaseConfigured) { profile.value = null; return }
  const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
  if (data) { profile.value = data; return }
  // Fallback for accounts created before the profiles table existed
  const metaRole = u.user_metadata?.role
  const role = metaRole === 'seller' ? 'seller' : 'buyer' // admin is only granted server-side
  const fresh = {
    id: u.id,
    full_name: u.user_metadata?.full_name || '',
    role,
    headline: roleInfo(role).headline
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

export async function upgradeToSeller(headline = 'Local Producer & Seller') {
  await saveProfile({ role: 'seller', headline: headline || 'Seller' })
}

export async function downgradeToBuyer() {
  await saveProfile({ role: 'buyer', headline: 'Local Shopper' })
}
