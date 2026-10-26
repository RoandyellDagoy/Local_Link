<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const route = useRoute()
const router = useRouter()
const signup = computed(() => route.query.mode === 'signup')
const fullName = ref('')
const email = ref('')
const password = ref('')
const role = ref('buyer')
const showPassword = ref(false)
const msg = ref('')
const busy = ref(false)

async function submit() {
  msg.value = ''
  if (!isSupabaseConfigured) { msg.value = 'Add your Supabase keys to .env first.'; return }
  busy.value = true
  const creds = { email: email.value, password: password.value }
  const { data, error } = signup.value
    ? await supabase.auth.signUp({
        ...creds,
        options: {
          data: {
            full_name: fullName.value,
            role: role.value
          }
        }
      })
    : await supabase.auth.signInWithPassword(creds)
  busy.value = false
  if (error) { msg.value = error.message; return }
  // A session only exists right away when "Confirm email" is turned off in Supabase.
  if (signup.value && !data.session) { msg.value = 'Check your email to confirm your account.'; return }
  router.push(route.query.redirect || '/profile')
}
</script>

<template>
  <section class="container page">
    <form class="box" @submit.prevent="submit">
      <h1>{{ signup ? 'Sign Up' : 'Login' }}</h1>

      <template v-if="signup">
        <label>I want to join as:
          <div class="role-picker">
            <button
              type="button"
              class="role-card"
              :class="{ on: role === 'buyer' }"
              id="role-buyer"
              @click="role = 'buyer'"
            >
              <span class="emoji">🛒</span>
              <strong>Buyer</strong>
              <small>Shop local produce & goods</small>
            </button>
            <button
              type="button"
              class="role-card"
              :class="{ on: role === 'seller' }"
              id="role-seller"
              @click="role = 'seller'"
            >
              <span class="emoji">🏪</span>
              <strong>Seller</strong>
              <small>Sell products & manage shop</small>
            </button>
          </div>
        </label>
        <label>Full name<input id="full-name" v-model="fullName" type="text" required autocomplete="name" placeholder="e.g. Maria Santos" /></label>
      </template>

      <label>Email<input id="email" v-model="email" type="email" required autocomplete="email" placeholder="you@example.com" /></label>
      <label>Password
        <span class="pw">
          <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" required minlength="6" autocomplete="current-password" />
          <button type="button" id="toggle-password" class="eye" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
            <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19C5 19 1 12 1 12a18.7 18.7 0 0 1 5.1-5.9M9.9 4.2A10 10 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22" /></svg>
          </button>
        </span>
      </label>

      <button class="btn btn-solid" id="auth-submit" :disabled="busy">{{ busy ? 'Please wait…' : signup ? `Create ${role === 'seller' ? 'Seller' : 'Buyer'} Account` : 'Login' }}</button>
      <p v-if="msg" class="msg">{{ msg }}</p>
      <router-link :to="signup ? '/login' : '/login?mode=signup'" class="switch">
        {{ signup ? 'Already have an account? Login' : 'New here? Sign Up' }}
      </router-link>
    </form>
  </section>
</template>

<style scoped>
.box { max-width: 420px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
.box h1 { font-size: 2.4rem; }
label { display: flex; flex-direction: column; gap: 6px; font-size: .95rem; }

.role-picker { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
.role-card { border: 1.5px solid var(--green-light); background: #fff; padding: 12px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; transition: all .2s; }
.role-card .emoji { font-size: 1.4rem; }
.role-card strong { font-size: .95rem; color: var(--green-dark); }
.role-card small { font-size: .68rem; opacity: .75; color: var(--ink); line-height: 1.2; font-weight: 400; }
.role-card:hover { border-color: var(--green); background: var(--green-light); }
.role-card.on { border-color: var(--green); background: var(--green-light); box-shadow: 0 0 0 2px var(--green); }

.pw { position: relative; display: flex; }
.pw input { flex: 1; padding-right: 44px; }
.eye { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: 0; background: none; color: var(--green); display: flex; padding: 4px; }
.eye:hover { color: var(--green-dark); }
input { padding: 10px 12px; border: 1.5px solid var(--green); font: inherit; outline: none; color: var(--ink); }
input:focus { box-shadow: 0 0 0 3px rgba(0,104,56,.18); }
.msg { margin: 0; color: var(--ink); font-size: .9rem; }
.switch { font-size: .9rem; text-decoration: underline; }
</style>
