<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { user, signOut } from '../lib/auth'

const router = useRouter()

const name = computed(() => user.value?.user_metadata?.full_name || user.value?.email?.split('@')[0] || 'Seller')
const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

const menu = [
  { label: 'Dashboard', to: '/profile', icon: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z', active: true },
  { label: 'My Products', to: '/profile/products', icon: 'M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10' },
  { label: 'Orders', icon: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h4' },
  { label: 'Finances', icon: 'M4 20V8h6v12M14 20V4h6v16M2 20h20' },
  { label: 'Messages', icon: 'M4 5h16v11H9l-5 4z' },
  { label: 'Learning Hub', icon: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z' },
  { label: 'Settings', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM3 12h3M18 12h3M12 3v3M12 18v3' }
]

const quick = [
  { label: 'Add New Product', to: '/profile/products' },
  { label: 'Check Sales Report', to: '/profile' },
  { label: 'View Financing Options', to: '/financing' },
  { label: 'Visit Learning Hub', to: '/learn' }
]

// Sample figures — replace with queries to your orders/products tables later.
const stats = [
  { label: 'Total Sales', value: '₱12,500', note: '12% from last month', up: true },
  { label: 'Total Orders', value: '28', note: '16% from last month', up: true },
  { label: 'Pending Orders', value: '5', note: '5% from last month', up: false },
  { label: 'Available Balance', value: '₱8,675', note: 'View Wallet', link: true }
]

const orders = [
  { name: 'Jane De Guzman', item: 'Fresh Vegetable Bundle', date: 'October 1 . Delivered', price: '₱450' },
  { name: 'Angelina Jolie', item: 'Ube Jam', date: 'October 12 . Delivered', price: '₱300' },
  { name: 'Jasmine Dy', item: 'Organic Rice 25kg', date: 'October 24 . Delivered', price: '₱650' },
  { name: 'Keisha Bartolomeo', item: 'Crochet Flowers', date: 'October 30 . Delivered', price: '₱170' }
]

const years = [2021, 2022, 2023, 2024, 2025]
const values = [8, 18, 20, 33, 36]
const pts = values.map((v, i) => [40 + i * 120, 170 - v * 4.1])
const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ')

async function logout() {
  await signOut()
  router.push('/')
}
</script>

<template>
  <section class="container dash">
    <aside class="side">
      <div class="me">
        <div class="avatar big">{{ initials(name) }}</div>
        <h2 id="profile-name">{{ name }}</h2>
        <p>Artist and Seller<br />Valencia, Negros Oriental</p>
      </div>

      <nav class="menu" aria-label="Dashboard">
        <component :is="m.to ? 'router-link' : 'a'" v-for="m in menu" :key="m.label" :to="m.to" :href="m.to ? undefined : '#'" :class="{ on: m.active }" @click="m.to || $event.preventDefault()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path :d="m.icon" /></svg>
          {{ m.label }}
        </component>
      </nav>

      <h3>Quick Actions</h3>
      <div class="quick">
        <router-link v-for="q in quick" :key="q.label" :to="q.to">
          <span class="dot"></span>{{ q.label }}
        </router-link>
      </div>

      <button class="btn btn-outline logout" id="logout-btn" @click="logout">Logout</button>
    </aside>

    <div class="main">
      <header class="head">
        <h1>Seller Dashboard</h1>
        <span class="range">October 1–31 2026</span>
      </header>

      <div class="stats">
        <div v-for="s in stats" :key="s.label" class="stat">
          <span class="lbl">{{ s.label }}</span>
          <strong>{{ s.value }}</strong>
          <small :class="{ down: s.up === false }">
            <template v-if="s.up === true">↑ </template><template v-else-if="s.up === false">↓ </template>{{ s.note }}
          </small>
        </div>
      </div>

      <div class="lower">
        <div class="overview">
          <h2>Sales Overview</h2>
          <svg viewBox="0 0 600 200" class="chart" role="img" aria-label="Sales growth from 2021 to 2025">
            <g class="grid" v-for="n in 5" :key="n">
              <line x1="40" x2="580" :y1="170 - (n - 1) * 41" :y2="170 - (n - 1) * 41" />
              <text x="26" :y="174 - (n - 1) * 41" text-anchor="end">{{ (n - 1) * 10 }}</text>
            </g>
            <path :d="path" class="line" />
            <circle v-for="(p, i) in pts" :key="i" :cx="p[0]" :cy="p[1]" r="4" class="pt" />
            <text v-for="(y, i) in years" :key="y" :x="pts[i][0]" y="192" text-anchor="middle">{{ y }}</text>
          </svg>
        </div>

        <div class="orders">
          <div class="orders-head"><h2>Recent Orders</h2><a href="#" @click.prevent>→ View All</a></div>
          <ul>
            <li v-for="o in orders" :key="o.name">
              <div class="avatar">{{ initials(o.name) }}</div>
              <div class="info"><b>{{ o.name }}</b><span>{{ o.item }}</span><span>{{ o.date }}</span></div>
              <strong>{{ o.price }}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dash { display: grid; grid-template-columns: 240px 1fr; gap: 40px; padding-top: 32px; padding-bottom: 70px; animation: rise .6s both; }
.avatar { width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #0b8a4a, var(--green)); color: #fff; display: grid; place-items: center; font-size: .9rem; flex: none; }
.avatar.big { width: 64px; height: 64px; font-size: 1.3rem; margin-bottom: 8px; }
.me h2 { font-size: 1.15rem; }
.me p { margin: 4px 0 0; font-size: .75rem; line-height: 1.5; }
.menu { display: flex; flex-direction: column; gap: 4px; margin: 22px 0; }
.menu a { display: flex; align-items: center; gap: 10px; padding: 7px 8px; font-size: .8rem; border-radius: 6px; transition: background .2s, transform .2s; }
.menu a:hover { background: var(--green-light); transform: translateX(3px); }
.menu a.on { background: var(--green-light); }
.side h3 { font-size: 1.05rem; margin: 0 0 8px; }
.quick { display: flex; flex-direction: column; gap: 8px; font-size: .75rem; }
.quick a { display: flex; align-items: center; gap: 8px; }
.quick a:hover { text-decoration: underline; }
.dot { width: 8px; height: 8px; background: var(--green); border-radius: 2px; }
.logout { margin-top: 24px; padding: 8px 18px; font-size: .85rem; }

.head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.head h1 { font-family: var(--font-body); font-size: 1.7rem; font-weight: 700; }
.range { font-size: 1.5rem; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 26px 0 36px; }
.stat { border: 1px solid var(--green); padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; transition: transform .25s, box-shadow .25s; }
.stat:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,104,56,.18); }
.lbl { font-size: .85rem; }
.stat strong { font-size: 1.4rem; }
.stat small { font-size: .62rem; }
.stat small.down { color: #e03131; }

.lower { display: grid; grid-template-columns: 1.4fr 1fr; gap: 40px; }
.lower h2 { font-size: 1.6rem; margin-bottom: 8px; }
.chart { width: 100%; font-size: 10px; fill: var(--ink); }
.grid line { stroke: #dde6e0; }
.line { fill: none; stroke: var(--green); stroke-width: 2.5; stroke-linejoin: round; stroke-dasharray: 900; stroke-dashoffset: 900; animation: draw 1.6s .3s forwards; }
.pt { fill: var(--green); }
.orders-head { display: flex; justify-content: space-between; align-items: center; }
.orders-head a { font-size: .72rem; }
.orders ul { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.orders li { display: flex; align-items: center; gap: 14px; }
.info { flex: 1; display: flex; flex-direction: column; font-size: .72rem; line-height: 1.35; }
.info b { font-size: .8rem; }
.info span { font-size: .6rem; }
.orders li strong { font-size: 1.05rem; }

@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (max-width: 950px) {
  .dash { grid-template-columns: 1fr; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .lower { grid-template-columns: 1fr; }
}
</style>
