<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { profile, roleInfo } from '../lib/profile'
import { logout as signOutAndHome } from '../lib/auth'
import StatCard from '../components/StatCard.vue'
import { peso, compact, fmtDate, change, niceMax, monthIndex } from '../lib/format'

const router = useRouter()
const tab = ref('dashboard')
const loading = ref(true)
const error = ref('')
const people = ref([])
const orders = ref([])
const products = ref([])
const filter = ref('')
const q = ref('')
const menu = ref(false)

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'sellers', label: 'Sellers', icon: '🏪' },
  { id: 'customers', label: 'Customers', icon: '👥' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'orders', label: 'Orders', icon: '🧾' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'reports', label: 'Reports', icon: '📊' },
  { id: 'announcements', label: 'Announcements', icon: '📣' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'help', label: 'Help & Support', icon: '💬' }
]
const quick = [
  { id: 'sellers', label: 'Manage Sellers', icon: '🏪' },
  { id: 'products', label: 'Manage Products', icon: '📦' },
  { id: 'orders', label: 'Manage Orders', icon: '📍' },
  { id: 'announcements', label: 'Post Announcements', icon: '📣' },
  { id: 'reports', label: 'View Reports', icon: '📑' }
]

function go(id) { tab.value = id; filter.value = ''; q.value = '' }

async function load() {
  loading.value = true
  const [p, o, pr] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*').order('created_at', { ascending: false })
  ])
  const err = p.error || o.error || pr.error
  if (err) error.value = err.message
  people.value = p.data || []
  orders.value = o.data || []
  products.value = pr.data || []
  loading.value = false
}
onMounted(load)

const joined = (p) => p.created_at || p.updated_at
const sellers = computed(() => people.value.filter((x) => x.role === 'seller'))
const customers = computed(() => people.value.filter((x) => x.role === 'buyer'))
const sales = computed(() => orders.value.reduce((s, o) => s + Number(o.total || 0), 0))
const date = fmtDate
const sellerName = (id) => people.value.find((x) => x.id === id)?.full_name || 'Unknown'

// this month vs last month for a list, using a date accessor and a value accessor
function delta(list, when, val = () => 1) {
  const cur = monthIndex(new Date())
  const sum = (m) => list.filter((x) => monthIndex(when(x)) === m).reduce((s, x) => s + val(x), 0)
  return change(sum(cur), sum(cur - 1))
}
const dSellers = computed(() => delta(sellers.value, joined))
const dOrders = computed(() => delta(orders.value, (o) => o.created_at))
const dCustomers = computed(() => delta(customers.value, joined))
const dSales = computed(() => delta(orders.value, (o) => o.created_at, (o) => Number(o.total || 0)))

const match = (s) => !filter.value || String(s || '').toLowerCase().includes(filter.value.toLowerCase())
const shownSellers = computed(() => sellers.value.filter((x) => match(x.full_name) || match(x.location)))
const shownCustomers = computed(() => customers.value.filter((x) => match(x.full_name) || match(x.location)))
const shownProducts = computed(() => products.value.filter((x) => match(x.name) || match(x.seller)))
const shownOrders = computed(() => orders.value.filter((x) => match(x.full_name) || match(x.status)))

// ---- Smooth sales line chart (per year) ----
const W = 520, H = 190, L = 40, B = 25, T = 10
const chart = computed(() => {
  const now = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => now - 4 + i)
  const totals = years.map((y) => orders.value.filter((o) => new Date(o.created_at).getFullYear() === y).reduce((s, o) => s + Number(o.total || 0), 0))
  const max = niceMax(Math.max(...totals, 0))
  const step = max / 4
  const y = (v) => H - B - (v / max) * (H - B - T)
  const pts = years.map((yr, i) => ({ yr, v: totals[i], x: L + (i * (W - L - 10)) / 4, y: y(totals[i]) }))
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], cx = (a.x + b.x) / 2
    d += ` C${cx},${a.y} ${cx},${b.y} ${b.x},${b.y}`
  }
  const ticks = [0, 1, 2, 3, 4].map((i) => ({ v: i * step, y: y(i * step) }))
  return { pts, d, ticks }
})

// ---- Order status (pie) ----
const grp = (s) => (/complete|deliver/i.test(s || '') ? 'Completed' : /cancel/i.test(s || '') ? 'Cancelled' : 'Processing')
const colors = { Completed: '#e8453c', Processing: '#12b5d0', Cancelled: '#b05fc4' }
const statusStats = computed(() => {
  const total = orders.value.length || 1
  return ['Completed', 'Processing', 'Cancelled'].map((k) => {
    const n = orders.value.filter((o) => grp(o.status) === k).length
    return { k, n, pct: Math.round((n / total) * 100), color: colors[k] }
  })
})
const pie = computed(() => {
  if (!orders.value.length) return '#e8f3ec'
  let acc = 0
  return `conic-gradient(${statusStats.value.map((s) => { const a = acc; acc += (s.n / orders.value.length) * 100; return `${s.color} ${a}% ${acc}%` }).join(',')})`
})

// ---- Recent activities ----
const activities = computed(() => {
  const items = []
  people.value.filter((p) => p.role !== 'admin').forEach((p) => items.push({ t: joined(p), icon: '✅', text: `New ${p.role === 'seller' ? 'seller' : 'customer'} registered: ${p.full_name || 'Unnamed'}` }))
  orders.value.forEach((o) => items.push({ t: o.created_at, icon: '🛒', text: `Order #${o.id} was placed` }))
  orders.value.forEach((o) => items.push({ t: o.created_at, icon: '💵', text: `Payment received: ${peso(o.total)}` }))
  return items.filter((i) => i.t).sort((a, b) => new Date(b.t) - new Date(a.t))
})
const recent = computed(() => activities.value.slice(0, 5))
const pending = computed(() => orders.value.filter((o) => grp(o.status) === 'Processing').length)
function ago(t) {
  const m = Math.max(1, Math.round((Date.now() - new Date(t)) / 60000))
  return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`
}

function doSearch() {
  const s = q.value.trim().toLowerCase()
  if (!s) return
  const hit = (arr, f) => arr.some((x) => f(x).toLowerCase().includes(s))
  const to = hit(sellers.value, (x) => x.full_name || '') ? 'sellers'
    : hit(customers.value, (x) => x.full_name || '') ? 'customers'
    : hit(products.value, (x) => (x.name || '') + (x.category_slug || '')) ? 'products' : 'orders'
  tab.value = to
  filter.value = q.value
}

async function setRole(p, role) {
  if (!confirm(`Change ${p.full_name || 'this user'} to ${role}?`)) return
  const { error: e } = await supabase.from('profiles').update({ role, headline: roleInfo(role).headline }).eq('id', p.id)
  if (e) { alert(e.message); return }
  p.role = role
}
async function removeProduct(p) {
  if (!confirm(`Remove product "${p.name}"?`)) return
  const { error: e } = await supabase.from('products').delete().eq('id', p.id)
  if (e) { alert(e.message); return }
  products.value = products.value.filter((x) => x.id !== p.id)
}
const logout = () => signOutAndHome(router)

async function removeUser(p) {
  const kind = p.role === 'seller' ? 'seller' : 'customer'
  const extra = p.role === 'seller' ? ' Their products will be removed too.' : ''
  if (!confirm(`Permanently remove ${kind} "${p.full_name || 'Unnamed'}"? Their account and orders are deleted.${extra} This cannot be undone.`)) return
  const { error: e } = await supabase.rpc('admin_delete_user', { target: p.id })
  if (e) { alert(e.message); return }
  await load()
}

async function resetData() {
  if (prompt('This deletes ALL orders, sales and products. Type RESET to continue.') !== 'RESET') return
  const users = confirm('Also remove ALL seller and customer accounts? (Admin accounts are kept.)\n\nOK = remove them too, Cancel = keep accounts')
  const { error: e } = await supabase.rpc('admin_reset_data', { include_users: users })
  if (e) { alert(e.message); return }
  await load()
}
</script>

<template>
  <div class="admin">
    <aside class="side">
      <a class="brand" href="#" @click.prevent="go('dashboard')">
        <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true">
          <path d="M30 4C12 14 6 34 14 58c6-2 10-4 14-8C20 38 22 20 30 4z" fill="#006838" />
          <path d="M34 14c14 8 22 22 18 40-10 2-20-4-24-14 2-10 4-18 6-26z" fill="#0b8a4a" />
        </svg>
        <span>LocalLink</span>
      </a>
      <nav>
        <button v-for="n in nav" :key="n.id" :id="'admin-nav-' + n.id" :class="{ on: tab === n.id }" @click="go(n.id)">
          <span class="ic">{{ n.icon }}</span>{{ n.label }}
        </button>
      </nav>
    </aside>

    <div class="content">
      <header class="top">
        <form class="search" role="search" @submit.prevent="doSearch">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input id="admin-search" v-model="q" placeholder="Search for products, sellers, or categories...." aria-label="Search" />
        </form>
        <button class="bell" id="admin-bell" title="Orders awaiting action" @click="go('orders')">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5-6.7V3a2 2 0 0 0-4 0v1.3A7 7 0 0 0 5 11v5l-2 2v1h18v-1z" /></svg>
          <span v-if="pending" class="dot">{{ pending }}</span>
        </button>
        <div class="user">
          <button id="admin-user" aria-label="Account" @click="menu = !menu">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3.4" /><path d="M5.5 19c1.5-3 4-4.2 6.5-4.2s5 1.2 6.5 4.2" /></svg>
          </button>
          <div v-if="menu" class="pop"><button id="admin-logout" @click="logout">Log out</button></div>
        </div>
      </header>

      <main class="main">
        <p v-if="error" class="err">{{ error }} — run the latest migrations (npm run db:upgrade).</p>
        <p v-if="loading">Loading…</p>

        <template v-else-if="tab === 'dashboard'">
          <div class="title-row">
            <h1>Welcome back, Admin!</h1>
            <button class="mini danger" id="reset-data" @click="resetData">Reset all data</button>
          </div>
          <div class="stats">
            <StatCard large label="Total Sellers" :value="sellers.length.toLocaleString()" :note="dSellers.text" :up="dSellers.up" />
            <StatCard large label="Total Orders" :value="orders.length.toLocaleString()" :note="dOrders.text" :up="dOrders.up" />
            <StatCard large label="Total Customers" :value="compact(customers.length, 10000)" :note="dCustomers.text" :up="dCustomers.up" />
            <StatCard large label="Total Sales" :value="peso(sales)" :note="dSales.text" :up="dSales.up" />
          </div>

          <div class="grid">
            <section>
              <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img" aria-label="Sales per year">
                <g v-for="t in chart.ticks" :key="t.v">
                  <line :x1="L" :x2="W - 10" :y1="t.y" :y2="t.y" stroke="#e5ece7" />
                  <text :x="L - 8" :y="t.y + 4" text-anchor="end" font-size="11" fill="#1c3b2b">{{ compact(t.v) }}</text>
                </g>
                <path :d="chart.d" fill="none" stroke="#006838" stroke-width="2.5" />
                <g v-for="p in chart.pts" :key="p.yr">
                  <circle :cx="p.x" :cy="p.y" r="3.5" fill="#006838" />
                  <text :x="p.x" :y="H - 6" text-anchor="middle" font-size="11" fill="#1c3b2b">{{ p.yr }}</text>
                </g>
              </svg>
              <div class="quick">
                <button v-for="a in quick" :key="a.id + a.label" @click="go(a.id)"><span class="qi">{{ a.icon }}</span><span>{{ a.label }}</span></button>
              </div>
            </section>

            <section class="right">
              <div class="head"><h2>Recent Activities</h2><a href="#" @click.prevent="go('orders')">⟶ View All</a></div>
              <ul class="acts">
                <li v-for="(a, i) in recent" :key="i"><span class="ai">{{ a.icon }}</span><em>{{ a.text }}</em><small>{{ ago(a.t) }}</small></li>
                <li v-if="!recent.length">No activity yet.</li>
              </ul>
              <div class="head sm"><h3>Order Status</h3><a href="#" @click.prevent="go('orders')">⟶ View All</a></div>
              <div class="pie-wrap">
                <div class="pie" :style="{ background: pie }"><span></span></div>
                <ul class="legend">
                  <li v-for="s in statusStats" :key="s.k"><i :style="{ background: s.color }"></i><em>{{ s.k }}</em><small>{{ s.pct }}%</small></li>
                </ul>
              </div>
            </section>
          </div>
        </template>

        <template v-else-if="tab === 'sellers' || tab === 'customers'">
          <h1>{{ tab === 'sellers' ? 'Sellers' : 'Customers' }}</h1>
          <input v-model="filter" class="filter" placeholder="Search by name or location" />
          <table>
            <thead><tr><th>Name</th><th>Location</th><th>Contact</th><th v-if="tab === 'sellers'">Products</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              <tr v-for="p in (tab === 'sellers' ? shownSellers : shownCustomers)" :key="p.id">
                <td>{{ p.full_name || '—' }}</td>
                <td>{{ p.location || '—' }}</td>
                <td>{{ p.contact_number || '—' }}</td>
                <td v-if="tab === 'sellers'">{{ products.filter((x) => x.owner_id === p.id).length }}</td>
                <td>{{ date(joined(p)) }}</td>
                <td>
                  <button class="mini" @click="setRole(p, tab === 'sellers' ? 'buyer' : 'seller')">{{ tab === 'sellers' ? 'Make customer' : 'Make seller' }}</button>
                  <button class="mini danger" :id="'remove-user-' + p.id" @click="removeUser(p)">Remove</button>
                </td>
              </tr>
              <tr v-if="!(tab === 'sellers' ? shownSellers : shownCustomers).length"><td colspan="6">None found.</td></tr>
            </tbody>
          </table>
        </template>

        <template v-else-if="tab === 'products'">
          <h1>Products</h1>
          <input v-model="filter" class="filter" placeholder="Search products or sellers" />
          <table>
            <thead><tr><th>Product</th><th>Seller</th><th>Price</th><th>Added</th><th></th></tr></thead>
            <tbody>
              <tr v-for="p in shownProducts" :key="p.id">
                <td>{{ p.name }}</td><td>{{ p.seller || sellerName(p.owner_id) }}</td><td>{{ peso(p.price) }}</td><td>{{ date(p.created_at) }}</td>
                <td><button class="mini danger" @click="removeProduct(p)">Remove</button></td>
              </tr>
              <tr v-if="!shownProducts.length"><td colspan="5">None found.</td></tr>
            </tbody>
          </table>
        </template>

        <template v-else-if="tab === 'orders'">
          <h1>Orders</h1>
          <input v-model="filter" class="filter" placeholder="Search by customer or status" />
          <table>
            <thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              <tr v-for="o in shownOrders" :key="o.id">
                <td>{{ o.id }}</td><td>{{ o.full_name }}</td><td>{{ peso(o.total) }}</td><td>{{ o.payment_method }}</td><td>{{ o.status }}</td><td>{{ date(o.created_at) }}</td>
              </tr>
              <tr v-if="!shownOrders.length"><td colspan="6">None found.</td></tr>
            </tbody>
          </table>
        </template>

        <template v-else>
          <h1>{{ nav.find((n) => n.id === tab)?.label }}</h1>
          <p>Coming soon.</p>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin { display: grid; grid-template-columns: 210px 1fr; min-height: 100vh; background: #fff; }
.side { padding: 18px 14px; }
.brand { display: flex; align-items: center; gap: 2px; font-family: var(--font-display); font-size: 1.9rem; color: var(--green); margin-bottom: 16px; }
.side nav { display: flex; flex-direction: column; gap: 4px; }
.side nav button { display: flex; align-items: center; gap: 12px; border: 0; background: none; padding: 9px 8px; font-size: .95rem; color: var(--green); text-align: left; border-radius: 6px; }
.side nav button:hover, .side nav button.on { background: var(--green-light); }
.ic { width: 26px; text-align: center; font-size: 1.15rem; }
.content { min-width: 0; padding: 18px 28px; }
.top { display: flex; align-items: center; gap: 12px; }
.search { flex: 1; max-width: 560px; display: flex; align-items: center; gap: 10px; border: 1.3px solid var(--ink); border-radius: 999px; padding: 10px 18px; }
.search:focus-within { border-color: var(--green); box-shadow: 0 0 0 3px rgba(0,104,56,.15); }
.search input { flex: 1; border: 0; outline: 0; font: inherit; color: var(--green); background: transparent; min-width: 0; }
.bell, .user > button { border: 0; background: none; color: var(--ink); display: flex; position: relative; padding: 2px; }
.user { margin-left: 0; position: relative; }
.user > button { color: var(--green); }
.bell { margin-left: auto; }
.dot { position: absolute; top: -4px; right: -6px; background: #e03131; color: #fff; font-size: .6rem; min-width: 16px; height: 16px; border-radius: 999px; display: grid; place-items: center; }
.pop { position: absolute; right: 0; top: 40px; background: #fff; border: 1px solid var(--green-light); box-shadow: 0 6px 18px rgba(0,0,0,.12); z-index: 5; }
.pop button { border: 0; background: none; padding: 10px 18px; color: var(--green); white-space: nowrap; }
.pop button:hover { background: var(--green-light); }
.main { padding-top: 22px; }
h1 { font-size: 2.4rem; margin-bottom: 20px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 26px; max-width: 760px; }
.grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 28px; align-items: start; max-width: 1000px; }
.chart { width: 100%; }
.quick { display: flex; gap: 14px; margin: 8px 0 0 30px; flex-wrap: wrap; }
.quick button { border: 0; background: none; display: flex; flex-direction: column; align-items: center; gap: 4px; width: 62px; color: var(--green); }
.qi { font-size: 1.9rem; }
.quick button span:last-child { font-size: .55rem; text-align: center; line-height: 1.1; }
.quick button:hover .qi { transform: scale(1.12); }
.qi { transition: transform .2s; }
.head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.head h2 { font-family: var(--font-display); font-weight: 400; font-size: 1.25rem; }
.head h3 { margin: 0; font-size: .75rem; }
.head a { font-size: .68rem; }
.head.sm { margin-top: 18px; }
.acts { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; font-size: .7rem; }
.acts li { display: flex; gap: 8px; align-items: center; }
.ai { font-size: 1.1rem; width: 22px; text-align: center; }
.acts em { flex: 1; font-style: normal; }
.acts small { opacity: .6; white-space: nowrap; font-size: .62rem; }
.pie-wrap { display: flex; align-items: center; gap: 18px; }
.pie { width: 96px; height: 96px; border-radius: 50%; flex: none; display: grid; place-items: center; }
.pie span { width: 28px; height: 28px; border-radius: 50%; background: #fff; }
.legend { list-style: none; margin: 0; padding: 0; font-size: .68rem; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.legend li { display: flex; align-items: center; gap: 8px; }
.legend i { width: 10px; height: 10px; border-radius: 50%; flex: none; }
.legend em { font-style: normal; flex: 1; }
.filter { padding: 9px 12px; border: 1.5px solid var(--green); font: inherit; margin-bottom: 14px; width: 100%; max-width: 360px; outline: none; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; }
th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--green-light); }
th { background: var(--green-light); }
.mini { border: 1.5px solid var(--green); background: #fff; color: var(--green); padding: 4px 10px; font-size: .78rem; }
.mini:hover { background: var(--green-light); }
.mini.danger { border-color: #e03131; color: #e03131; }
.mini + .mini { margin-left: 6px; }
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.title-row h1 { margin-bottom: 0; }
.err { color: #e03131; }
@media (max-width: 900px) { .admin { grid-template-columns: 1fr; } .grid { grid-template-columns: 1fr; } .side nav { flex-direction: row; flex-wrap: wrap; } }
@media (max-width: 700px) { table { display: block; overflow-x: auto; white-space: nowrap; } }
@media (max-width: 600px) { .content { padding: 14px 16px; } .top { flex-wrap: wrap; } .search { order: 3; flex-basis: 100%; max-width: none; } .quick { margin-left: 0; justify-content: center; } }
@media (max-width: 600px) { .content { padding: 14px 16px; } .top { flex-wrap: wrap; } .search { order: 3; flex-basis: 100%; max-width: none; } .quick { margin-left: 0; justify-content: center; } }
</style>
