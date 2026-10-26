<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { user } from '../lib/auth'
import { cartCount } from '../lib/cart'
import { profile } from '../lib/profile'

const router = useRouter()
const q = ref('')
const links = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/financing', label: 'Financing' },
  { to: '/learn', label: 'Learn' },
  { to: '/about', label: 'About' }
]

const search = () => router.push({ path: '/shop', query: q.value ? { q: q.value } : {} })

const listen = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return
  const r = new SR()
  r.onresult = (e) => { q.value = e.results[0][0].transcript; search() }
  r.start()
}
</script>

<template>
  <header class="nav">
    <div class="container nav-inner">
      <router-link to="/" class="brand" id="brand-link">
        <svg class="leaf" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M30 4C12 14 6 34 14 58c6-2 10-4 14-8C20 38 22 20 30 4z" fill="#006838" />
          <path d="M34 14c14 8 22 22 18 40-10 2-20-4-24-14 2-10 4-18 6-26z" fill="#0b8a4a" />
        </svg>
        <span>LocalLink</span>
      </router-link>

      <nav class="links" aria-label="Main">
        <router-link v-for="l in links" :key="l.to" :to="l.to" :id="'nav-' + l.label.toLowerCase()">{{ l.label }}</router-link>
      </nav>

      <form class="search" role="search" @submit.prevent="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input id="search-input" v-model="q" type="search" placeholder="Search for products, sellers, or categories...." aria-label="Search" />
        <button type="button" id="voice-btn" class="mic" aria-label="Voice search" @click="listen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
        </button>
      </form>

      <div class="auth">
        <router-link to="/cart" id="cart-link" class="cart-icon" aria-label="Shopping cart">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6" /><circle cx="9.5" cy="20" r="1.4" /><circle cx="17.5" cy="20" r="1.4" /></svg>
          <span v-if="cartCount" class="badge" :key="cartCount">{{ cartCount }}</span>
        </router-link>
        <router-link v-if="user" to="/profile" id="profile-link" class="avatar-icon" :title="profile?.role === 'seller' ? 'Seller Dashboard' : 'Shopper Dashboard'">
          <img v-if="profile?.avatar_url" :src="profile.avatar_url" alt="" class="nav-avatar" />
          <svg v-else width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3.4" /><path d="M5.5 19c1.5-3 4-4.2 6.5-4.2s5 1.2 6.5 4.2" /></svg>
          <span v-if="profile?.role" class="nav-role-tag" :class="profile.role">{{ profile.role === 'seller' ? 'Seller' : 'Shopper' }}</span>
        </router-link>
        <template v-else>
          <router-link to="/login" id="login-link">Login</router-link> | <router-link to="/login?mode=signup" id="signup-link">Sign Up</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav { position: sticky; top: 0; z-index: 10; background: rgba(255,255,255,.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--green-light); }
.nav-inner { display: flex; align-items: center; gap: 28px; height: 72px; }
.brand { display: flex; align-items: center; gap: 4px; font-family: var(--font-display); font-size: 1.9rem; color: var(--green); }
.leaf { width: 40px; height: 40px; transition: transform .4s; }
.brand:hover .leaf { transform: rotate(-12deg) scale(1.08); }
.links { display: flex; gap: 22px; font-size: .95rem; }
.links a { position: relative; padding: 4px 0; }
.links a::after { content: ''; position: absolute; left: 0; bottom: 0; width: 0; height: 2px; background: var(--green); transition: width .25s; }
.links a:hover::after, .links a.router-link-exact-active::after { width: 100%; }
.search { flex: 1; max-width: 400px; display: flex; align-items: center; gap: 8px; border: 1.2px solid var(--ink); border-radius: 999px; padding: 6px 14px; transition: box-shadow .2s, border-color .2s; }
.search:focus-within { border-color: var(--green); box-shadow: 0 0 0 3px rgba(0,104,56,.15); }
.search input { flex: 1; border: 0; outline: 0; background: transparent; font: inherit; font-size: .78rem; color: var(--ink); min-width: 0; }
.mic { border: 0; background: none; color: var(--ink); padding: 2px; display: flex; }
.auth { margin-left: auto; font-size: .72rem; white-space: nowrap; color: var(--ink); display: flex; align-items: center; gap: 16px; }
.cart-icon { position: relative; color: var(--green); display: flex; transition: transform .2s; }
.cart-icon:hover { transform: scale(1.1); }
.badge { position: absolute; top: -6px; right: -8px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: #e03131; color: #fff; font-size: .62rem; display: grid; place-items: center; animation: pop .3s; }
@keyframes pop { 0% { transform: scale(.4); } 70% { transform: scale(1.25); } 100% { transform: scale(1); } }
.auth a:hover { color: var(--green); text-decoration: underline; }
.avatar-icon { color: var(--green); display: flex; align-items: center; gap: 8px; transition: transform .2s; }
.avatar-icon:hover { transform: scale(1.05); }
.nav-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid var(--green); }
.nav-role-tag { font-size: .62rem; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; letter-spacing: .02em; }
.nav-role-tag.seller { background: var(--green); color: #fff; }
.nav-role-tag.buyer { background: var(--green-light); color: var(--green-dark); }
.who { display: none; }
@media (max-width: 1000px) { .links { display: none; } }
@media (max-width: 700px) { .search { display: none; } }
</style>
