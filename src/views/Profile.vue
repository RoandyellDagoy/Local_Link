<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { user, signOut } from '../lib/auth'
import { profile, isSeller, isBuyer, saveProfile, upgradeToSeller, downgradeToBuyer } from '../lib/profile'

const router = useRouter()

/* ---------- identity ---------- */
const name = computed(() => profile.value?.full_name || user.value?.user_metadata?.full_name || user.value?.email?.split('@')[0] || 'User')
const initials = (n) => (n || '?').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const currentRole = computed(() => profile.value?.role || 'buyer')

// Active tab for sellers: 'seller' or 'buyer' (sellers can also review their purchases)
const viewMode = ref('seller')
watch(isSeller, (seller) => {
  if (!seller) viewMode.value = 'buyer'
  else if (viewMode.value !== 'buyer') viewMode.value = 'seller'
}, { immediate: true })

const sellerMenu = [
  { label: 'Seller Dashboard', action: () => (viewMode.value = 'seller'), icon: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z', active: () => viewMode.value === 'seller' },
  { label: 'My Products', to: '/profile/products', icon: 'M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10' },
  { label: 'Customer Orders', action: () => (viewMode.value = 'seller'), icon: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h4', active: () => false },
  { label: 'My Purchases', action: () => (viewMode.value = 'buyer'), icon: 'M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6', active: () => viewMode.value === 'buyer' },
  { label: 'Learning Hub', to: '/learn', icon: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z' }
]

const buyerMenu = [
  { label: 'My Purchases', action: () => (viewMode.value = 'buyer'), icon: 'M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6', active: () => true },
  { label: 'Shop Products', to: '/shop', icon: 'M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10' },
  { label: 'Learning Hub', to: '/learn', icon: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z' }
]

const quick = computed(() => {
  if (isSeller.value) {
    return [
      { label: 'Add New Product', to: '/profile/products' },
      { label: 'Check Sales Report', to: '/profile' },
      { label: 'View Financing Options', to: '/financing' },
      { label: 'Visit Learning Hub', to: '/learn' }
    ]
  }
  return [
    { label: 'Browse Local Shop', to: '/shop' },
    { label: 'Explore Financing', to: '/financing' },
    { label: 'Visit Learning Hub', to: '/learn' }
  ]
})

/* ---------- real seller order data ---------- */
const items = ref([])
const loading = ref(true)
const loadError = ref('')

async function loadSellerOrders() {
  if (!user.value?.id) return
  loading.value = true
  loadError.value = ''
  const { data, error } = await supabase
    .from('order_items')
    .select('id,order_id,name,price,qty,status,buyer_name,created_at')
    .eq('seller_id', user.value.id)
    .order('created_at', { ascending: false })
  if (error) loadError.value = error.message
  items.value = data ?? []
  loading.value = false
}

/* ---------- real buyer order data ---------- */
const buyerOrders = ref([])
const loadingBuyer = ref(true)

async function loadBuyerOrders() {
  if (!user.value?.id) return
  loadingBuyer.value = true
  const { data } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      status,
      payment_method,
      delivery_fee,
      subtotal,
      total,
      address,
      contact_number,
      order_items (id, product_id, name, price, qty, unit, image_url, status)
    `)
    .eq('user_id', user.value.id)
    .order('created_at', { ascending: false })
  buyerOrders.value = data ?? []
  loadingBuyer.value = false
}

function refreshAll() {
  loadSellerOrders()
  loadBuyerOrders()
}

onMounted(refreshAll)
watch(() => user.value?.id, (id) => id && refreshAll())

/* ---------- seller metrics ---------- */
const now = new Date()
const monthStart = (offset = 0) => new Date(now.getFullYear(), now.getMonth() + offset, 1)
const inRange = (i, from, to) => { const d = new Date(i.created_at); return d >= from && d < to }
const live = computed(() => items.value.filter((i) => i.status !== 'Cancelled'))
const line = (i) => Number(i.price) * i.qty
const sum = (arr) => arr.reduce((n, i) => n + line(i), 0)
const orderCount = (arr) => new Set(arr.map((i) => i.order_id)).size

const thisMonth = computed(() => live.value.filter((i) => inRange(i, monthStart(0), monthStart(1))))
const lastMonth = computed(() => live.value.filter((i) => inRange(i, monthStart(-1), monthStart(0))))

const peso = (n) => '₱' + Number(n).toLocaleString('en-PH', { maximumFractionDigits: 2 })

function change(cur, prev) {
  if (!prev) return cur ? { text: 'New this month', up: true } : { text: 'No data yet', up: null }
  const pct = Math.round(((cur - prev) / prev) * 100)
  return { text: `${Math.abs(pct)}% from last month`, up: pct >= 0 }
}

const pendingCount = computed(() => orderCount(items.value.filter((i) => i.status === 'Pending')))
const balance = computed(() => sum(items.value.filter((i) => i.status === 'Delivered')))

const stats = computed(() => {
  const s = change(sum(thisMonth.value), sum(lastMonth.value))
  const o = change(orderCount(thisMonth.value), orderCount(lastMonth.value))
  return [
    { label: 'Total Sales', value: peso(sum(thisMonth.value)), note: s.text, up: s.up },
    { label: 'Total Orders', value: String(orderCount(thisMonth.value)), note: o.text, up: o.up },
    { label: 'Pending Orders', value: String(pendingCount.value), note: pendingCount.value ? 'Awaiting delivery' : 'All caught up', up: pendingCount.value ? false : null },
    { label: 'Available Balance', value: peso(balance.value), note: 'From delivered orders', link: true }
  ]
})

const rangeLabel = computed(() => {
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return `${now.toLocaleString('en-US', { month: 'long' })} 1–${last} ${now.getFullYear()}`
})

/* ---------- buyer metrics ---------- */
const buyerTotalSpent = computed(() =>
  buyerOrders.value
    .filter((o) => o.status !== 'Cancelled')
    .reduce((acc, o) => acc + Number(o.total), 0)
)
const buyerPendingOrders = computed(() =>
  buyerOrders.value.filter((o) => o.status === 'Pending').length
)

/* ---------- chart: last 6 months (seller) ---------- */
const months = computed(() =>
  Array.from({ length: 6 }, (_, k) => {
    const start = monthStart(k - 5)
    const end = monthStart(k - 4)
    return { label: start.toLocaleString('en-US', { month: 'short' }), total: sum(live.value.filter((i) => inRange(i, start, end))) }
  })
)
const niceMax = computed(() => {
  const max = Math.max(...months.value.map((m) => m.total), 0)
  if (!max) return 100
  const pow = 10 ** Math.floor(Math.log10(max))
  return Math.ceil(max / pow) * pow
})
const ticks = computed(() => [0, 1, 2, 3, 4].map((n) => (niceMax.value / 4) * n))
const compact = (n) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(Math.round(n)))
const pts = computed(() => months.value.map((m, i) => [40 + i * 108, 170 - (m.total / niceMax.value) * 164]))
const path = computed(() => pts.value.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' '))

/* ---------- seller recent orders ---------- */
const showAll = ref(false)
const recent = computed(() => (showAll.value ? items.value.slice(0, 30) : items.value.slice(0, 5)))
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

async function setStatus(item, status) {
  const prev = item.status
  item.status = status
  const { error } = await supabase.from('order_items').update({ status }).eq('id', item.id)
  if (error) { item.status = prev; loadError.value = error.message }
}

/* ---------- edit profile ---------- */
const editing = ref(false)
const saving = ref(false)
const formError = ref('')
const avatarFile = ref(null)
const avatarPreview = ref('')
const form = ref({ full_name: '', headline: '', location: '', address: '', contact_number: '', role: 'buyer' })

function openEdit() {
  const p = profile.value || {}
  form.value = {
    full_name: p.full_name || name.value,
    headline: p.headline || (p.role === 'seller' ? 'Seller & Producer' : 'Local Shopper'),
    location: p.location || '',
    address: p.address || '',
    contact_number: p.contact_number || '',
    role: p.role || 'buyer'
  }
  avatarFile.value = null
  avatarPreview.value = p.avatar_url || ''
  formError.value = ''
  editing.value = true
}

function pickAvatar(e) {
  const f = e.target.files[0]
  if (!f) return
  if (f.size > 3 * 1024 * 1024) { formError.value = 'Please choose an image under 3 MB.'; return }
  avatarFile.value = f
  avatarPreview.value = URL.createObjectURL(f)
}

async function submitProfile() {
  saving.value = true
  formError.value = ''
  try {
    await saveProfile(form.value, avatarFile.value)
    editing.value = false
    refreshAll()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

/* ---------- role switching ---------- */
const upgrading = ref(false)
async function handleUpgrade() {
  if (!confirm('Would you like to activate your Seller account? This will grant you access to the Seller Dashboard and allow you to list and sell products on LocalLink.')) return
  upgrading.value = true
  try {
    await upgradeToSeller('Local Producer & Seller')
    viewMode.value = 'seller'
    refreshAll()
  } catch (e) {
    alert('Error upgrading: ' + e.message)
  } finally {
    upgrading.value = false
  }
}

async function logout() {
  await signOut()
  router.push('/')
}
</script>

<template>
  <section class="container dash">
    <aside class="side">
      <div class="me">
        <div class="avatar big">
          <img v-if="profile?.avatar_url" :src="profile.avatar_url" :alt="name" />
          <span v-else>{{ initials(name) }}</span>
        </div>
        <h2 id="profile-name">{{ name }}</h2>
        <span class="role-badge" :class="currentRole">{{ currentRole === 'seller' ? '🏪 Seller Account' : '🛒 Shopper Account' }}</span>
        <p>{{ profile?.headline || (currentRole === 'seller' ? 'Artist and Seller' : 'Local Shopper') }}<template v-if="profile?.location"><br />{{ profile.location }}</template></p>
        <button class="edit" id="edit-profile-btn" @click="openEdit">✎ Edit Profile</button>
      </div>

      <!-- Menu options tailored to role -->
      <nav class="menu" aria-label="Dashboard">
        <template v-if="isSeller">
          <template v-for="m in sellerMenu" :key="m.label">
            <router-link v-if="m.to" :to="m.to" :class="{ on: m.active && m.active() }">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path :d="m.icon" /></svg>
              {{ m.label }}
            </router-link>
            <a v-else href="#" :class="{ on: m.active && m.active() }" @click.prevent="m.action && m.action()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path :d="m.icon" /></svg>
              {{ m.label }}
            </a>
          </template>
        </template>
        <template v-else>
          <template v-for="m in buyerMenu" :key="m.label">
            <router-link v-if="m.to" :to="m.to" :class="{ on: m.active && m.active() }">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path :d="m.icon" /></svg>
              {{ m.label }}
            </router-link>
            <a v-else href="#" :class="{ on: m.active && m.active() }" @click.prevent="m.action && m.action()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path :d="m.icon" /></svg>
              {{ m.label }}
            </a>
          </template>
        </template>
      </nav>

      <!-- Upgrade prompt for buyers -->
      <div v-if="isBuyer" class="become-seller-card">
        <h4>🌾 Start Selling</h4>
        <p>Sell your harvest, crafts, or food to your local community.</p>
        <button class="btn btn-solid btn-sm" id="upgrade-seller-btn" :disabled="upgrading" @click="handleUpgrade">
          {{ upgrading ? 'Activating…' : 'Become a Seller' }}
        </button>
      </div>

      <h3>Quick Actions</h3>
      <div class="quick">
        <router-link v-for="q in quick" :key="q.label" :to="q.to"><span class="dot"></span>{{ q.label }}</router-link>
      </div>

      <button class="btn btn-outline logout" id="logout-btn" @click="logout">Logout</button>
    </aside>

    <!-- MAIN CONTENT AREA -->
    <div class="main">
      <!-- SELLER DASHBOARD VIEW -->
      <template v-if="isSeller && viewMode === 'seller'">
        <header class="head">
          <div>
            <h1>Seller Dashboard</h1>
            <span class="sub-head">Manage sales, revenue and incoming customer orders</span>
          </div>
          <span class="range">{{ rangeLabel }}</span>
        </header>

        <p v-if="loadError" class="err">{{ loadError }}</p>

        <div class="stats">
          <div v-for="s in stats" :key="s.label" class="stat">
            <span class="lbl">{{ s.label }}</span>
            <strong>{{ s.value }}</strong>
            <small :class="{ down: s.up === false, up: s.up === true }">
              <template v-if="s.up === true">↑ </template><template v-else-if="s.up === false">↓ </template>{{ s.note }}
            </small>
          </div>
        </div>

        <div class="lower">
          <div class="overview">
            <h2>Sales Overview</h2>
            <svg viewBox="0 0 600 200" class="chart" role="img" aria-label="Sales for the last 6 months">
              <g class="grid" v-for="(t, n) in ticks" :key="n">
                <line x1="40" x2="580" :y1="170 - n * 41" :y2="170 - n * 41" />
                <text x="34" :y="174 - n * 41" text-anchor="end">{{ compact(t) }}</text>
              </g>
              <path :key="path" :d="path" class="line" />
              <circle v-for="(p, i) in pts" :key="i" :cx="p[0]" :cy="p[1]" r="4" class="pt"><title>{{ months[i].label }}: {{ peso(months[i].total) }}</title></circle>
              <text v-for="(m, i) in months" :key="m.label + i" :x="pts[i][0]" y="192" text-anchor="middle">{{ m.label }}</text>
            </svg>
          </div>

          <div class="orders">
            <div class="orders-head">
              <h2>Recent Customer Orders</h2>
              <a href="#" @click.prevent="showAll = !showAll">{{ showAll ? '↑ Show Less' : '→ View All' }}</a>
            </div>
            <p v-if="loading" class="muted">Loading…</p>
            <p v-else-if="!items.length" class="muted">No orders yet. They will appear here when customers purchase your products.</p>
            <ul>
              <li v-for="o in recent" :key="o.id">
                <div class="avatar">{{ initials(o.buyer_name || 'Customer') }}</div>
                <div class="info">
                  <b>{{ o.buyer_name || 'Customer' }}</b>
                  <span>{{ o.name }} × {{ o.qty }}</span>
                  <span>{{ fmtDate(o.created_at) }} .
                    <select :value="o.status" :class="'st-' + o.status.toLowerCase()" :aria-label="'Status for order item ' + o.id" @change="setStatus(o, $event.target.value)">
                      <option>Pending</option><option>Delivered</option><option>Cancelled</option>
                    </select>
                  </span>
                </div>
                <strong>{{ peso(line(o)) }}</strong>
              </li>
            </ul>
          </div>
        </div>
      </template>

      <!-- BUYER / PURCHASES VIEW (Used by Buyers, or Sellers checking their purchases) -->
      <template v-else>
        <header class="head">
          <div>
            <h1>{{ isSeller ? 'My Purchases' : 'Shopper Dashboard' }}</h1>
            <span class="sub-head">Track your orders, delivery status, and purchase history</span>
          </div>
          <button v-if="isSeller" class="btn btn-outline btn-sm" @click="viewMode = 'seller'">
            ← Back to Seller Dashboard
          </button>
        </header>

        <!-- Buyer Stats -->
        <div class="stats buyer-stats">
          <div class="stat">
            <span class="lbl">Total Spent</span>
            <strong>{{ peso(buyerTotalSpent) }}</strong>
            <small>Across all completed orders</small>
          </div>
          <div class="stat">
            <span class="lbl">Orders Placed</span>
            <strong>{{ buyerOrders.length }}</strong>
            <small>Lifetime orders on LocalLink</small>
          </div>
          <div class="stat">
            <span class="lbl">Active Deliveries</span>
            <strong>{{ buyerPendingOrders }}</strong>
            <small :class="{ down: buyerPendingOrders > 0 }">{{ buyerPendingOrders ? 'Awaiting arrival' : 'None active' }}</small>
          </div>
        </div>

        <!-- Orders Section -->
        <div class="buyer-orders-section">
          <h2>Order History</h2>
          <p v-if="loadingBuyer" class="muted">Loading your orders…</p>
          <div v-else-if="!buyerOrders.length" class="empty-orders">
            <p>You haven’t placed any orders yet.</p>
            <router-link to="/shop" class="btn btn-solid">Browse Fresh Products</router-link>
          </div>

          <div v-else class="order-cards">
            <article v-for="ord in buyerOrders" :key="ord.id" class="order-card">
              <div class="order-card-header">
                <div>
                  <span class="order-num">Order #{{ ord.id }}</span>
                  <span class="order-date">{{ fmtDate(ord.created_at) }}</span>
                </div>
                <div class="order-tags">
                  <span class="pay-badge">{{ ord.payment_method }}</span>
                  <span class="status-pill" :class="'st-' + (ord.status || 'pending').toLowerCase()">
                    {{ ord.status || 'Pending' }}
                  </span>
                </div>
              </div>

              <div class="order-card-body">
                <div class="item-list">
                  <div v-for="it in ord.order_items" :key="it.id" class="order-item-row">
                    <div class="item-pic">
                      <img v-if="it.image_url" :src="it.image_url" :alt="it.name" />
                      <span v-else>🌾</span>
                    </div>
                    <div class="item-desc">
                      <b>{{ it.name }}</b>
                      <small>{{ peso(it.price) }} × {{ it.qty }}</small>
                    </div>
                    <strong class="item-subtotal">{{ peso(it.price * it.qty) }}</strong>
                  </div>
                </div>

                <div class="order-meta-info">
                  <div class="delivery-to">
                    <small>Delivery Address:</small>
                    <p>{{ ord.address }}</p>
                  </div>
                  <div class="order-cost-breakdown">
                    <div class="cost-row"><span>Items subtotal</span><span>{{ peso(ord.subtotal) }}</span></div>
                    <div class="cost-row"><span>Delivery fee</span><span>{{ peso(ord.delivery_fee) }}</span></div>
                    <div class="cost-row total-row"><span>Total</span><strong>{{ peso(ord.total) }}</strong></div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </template>
    </div>

    <!-- EDIT PROFILE MODAL -->
    <Transition name="fade">
      <div v-if="editing" class="overlay" @click.self="editing = false">
        <form class="modal" @submit.prevent="submitProfile">
          <h2>Edit Profile</h2>

          <div class="pic-row">
            <div class="avatar huge">
              <img v-if="avatarPreview" :src="avatarPreview" alt="Profile preview" />
              <span v-else>{{ initials(form.full_name) }}</span>
            </div>
            <label class="upload">
              Change profile picture
              <input id="avatar-input" type="file" accept="image/*" @change="pickAvatar" />
            </label>
          </div>

          <label>Account Type:
            <select v-model="form.role" id="pf-role">
              <option value="buyer">🛒 Shopper / Buyer (Orders & Shopping)</option>
              <option value="seller">🏪 Seller (Dashboard, Sales & Products)</option>
            </select>
          </label>

          <label>Full name<input id="pf-name" v-model="form.full_name" required /></label>
          <label>Headline / Title<input id="pf-headline" v-model="form.headline" placeholder="e.g. Local Shopper or Organic Farmer" /></label>
          <label>Location<input id="pf-location" v-model="form.location" placeholder="e.g. Valencia, Negros Oriental" /></label>
          <label>Default delivery address<input id="pf-address" v-model="form.address" placeholder="Purok, Barangay, City, Province" /></label>
          <label>Contact number<input id="pf-contact" v-model="form.contact_number" inputmode="tel" placeholder="09XX XXX XXXX" /></label>

          <p v-if="formError" class="err">{{ formError }}</p>
          <div class="actions">
            <button type="button" class="btn btn-outline" @click="editing = false">Cancel</button>
            <button class="btn btn-solid" id="save-profile" :disabled="saving">{{ saving ? 'Saving…' : 'Save Changes' }}</button>
          </div>
        </form>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.dash { display: grid; grid-template-columns: 240px 1fr; gap: 40px; padding-top: 32px; padding-bottom: 70px; animation: rise .6s both; }
.avatar { width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #0b8a4a, var(--green)); color: #fff; display: grid; place-items: center; font-size: .9rem; flex: none; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar.big { width: 64px; height: 64px; font-size: 1.3rem; margin-bottom: 8px; }
.avatar.huge { width: 84px; height: 84px; font-size: 1.6rem; }
.me h2 { font-size: 1.15rem; margin-bottom: 4px; }
.role-badge { display: inline-block; font-size: .65rem; padding: 2px 8px; border-radius: 999px; margin-bottom: 6px; font-weight: 700; }
.role-badge.seller { background: var(--green); color: #fff; }
.role-badge.buyer { background: var(--green-light); color: var(--green-dark); }
.me p { margin: 4px 0 8px; font-size: .75rem; line-height: 1.5; }
.edit { border: 1px solid var(--green); background: #fff; color: var(--green); font-size: .68rem; padding: 4px 10px; transition: background .2s, color .2s; }
.edit:hover { background: var(--green); color: #fff; }

.menu { display: flex; flex-direction: column; gap: 4px; margin: 22px 0; }
.menu a { display: flex; align-items: center; gap: 10px; padding: 7px 8px; font-size: .8rem; border-radius: 6px; transition: background .2s, transform .2s; color: inherit; }
.menu a:hover { background: var(--green-light); transform: translateX(3px); }
.menu a.on { background: var(--green-light); font-weight: 700; }

.become-seller-card { border: 1.5px dashed var(--green); background: #fdfefe; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px; }
.become-seller-card h4 { margin: 0; font-size: .85rem; color: var(--green-dark); }
.become-seller-card p { margin: 0; font-size: .68rem; line-height: 1.3; opacity: .8; font-weight: 400; }
.btn-sm { padding: 6px 12px; font-size: .72rem; }

.side h3 { font-size: 1.05rem; margin: 0 0 8px; }
.quick { display: flex; flex-direction: column; gap: 8px; font-size: .75rem; }
.quick a { display: flex; align-items: center; gap: 8px; }
.quick a:hover { text-decoration: underline; }
.dot { width: 8px; height: 8px; background: var(--green); border-radius: 2px; }
.logout { margin-top: 24px; padding: 8px 18px; font-size: .85rem; }

.head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
.head h1 { font-family: var(--font-body); font-size: 1.7rem; font-weight: 700; margin: 0; }
.sub-head { display: block; font-size: .75rem; opacity: .75; margin-top: 2px; font-weight: 400; }
.range { font-size: 1.4rem; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 22px 0 32px; }
.buyer-stats { grid-template-columns: repeat(3, 1fr); }
.stat { border: 1px solid var(--green); padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; transition: transform .25s, box-shadow .25s; }
.stat:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,104,56,.18); }
.lbl { font-size: .85rem; }
.stat strong { font-size: 1.4rem; }
.stat small { font-size: .62rem; font-weight: 400; }
.stat small.down { color: #e03131; }
.stat small.up { color: var(--green-dark); }

.lower { display: grid; grid-template-columns: 1.4fr 1fr; gap: 40px; }
.lower h2 { font-size: 1.4rem; margin-bottom: 8px; }
.chart { width: 100%; font-size: 10px; fill: var(--ink); }
.grid line { stroke: #dde6e0; }
.line { fill: none; stroke: var(--green); stroke-width: 2.5; stroke-linejoin: round; stroke-dasharray: 900; stroke-dashoffset: 900; animation: draw 1.6s .2s forwards; }
.pt { fill: var(--green); }
.orders-head { display: flex; justify-content: space-between; align-items: center; }
.orders-head a { font-size: .72rem; }
.orders ul { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.orders li { display: flex; align-items: center; gap: 14px; }
.info { flex: 1; display: flex; flex-direction: column; font-size: .72rem; line-height: 1.35; }
.info b { font-size: .8rem; }
.info span { font-size: .6rem; }
.info select { font: inherit; font-size: .6rem; border: 1px solid var(--green-light); background: #fff; padding: 0 2px; color: var(--green); }
.info select.st-pending { color: #b8860b; }
.info select.st-cancelled { color: #c92a2a; }
.orders li strong { font-size: 1.05rem; }
.muted { font-size: .78rem; font-weight: 400; }
.err { color: #c92a2a; font-size: .85rem; margin: 6px 0; }

/* BUYER ORDERS CARDS */
.buyer-orders-section { margin-top: 20px; }
.buyer-orders-section h2 { font-size: 1.35rem; margin-bottom: 16px; }
.empty-orders { padding: 30px 20px; border: 1px dashed var(--green); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.order-cards { display: flex; flex-direction: column; gap: 18px; }
.order-card { border: 1px solid var(--green-light); box-shadow: 0 4px 12px rgba(0,0,0,.03); padding: 16px; display: flex; flex-direction: column; gap: 12px; transition: transform .2s; }
.order-card:hover { transform: translateY(-2px); border-color: var(--green); }
.order-card-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--green-light); flex-wrap: wrap; gap: 8px; }
.order-num { font-weight: 700; font-size: .95rem; margin-right: 12px; }
.order-date { font-size: .75rem; opacity: .7; font-weight: 400; }
.order-tags { display: flex; gap: 8px; align-items: center; }
.pay-badge { font-size: .65rem; background: var(--green-light); padding: 2px 8px; border-radius: 4px; font-weight: 700; }
.status-pill { font-size: .65rem; padding: 2px 8px; border-radius: 999px; font-weight: 700; text-transform: uppercase; }
.status-pill.st-pending { background: #fff3cd; color: #856404; }
.status-pill.st-delivered { background: #d4edda; color: #155724; }
.status-pill.st-cancelled { background: #f8d7da; color: #721c24; }

.order-card-body { display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px; }
.item-list { display: flex; flex-direction: column; gap: 10px; }
.order-item-row { display: flex; align-items: center; gap: 12px; }
.item-pic { width: 44px; height: 44px; background: var(--green-light); display: grid; place-items: center; font-size: 1.2rem; flex: none; overflow: hidden; }
.item-pic img { width: 100%; height: 100%; object-fit: cover; }
.item-desc { flex: 1; display: flex; flex-direction: column; font-size: .78rem; }
.item-desc small { font-size: .65rem; opacity: .75; }
.item-subtotal { font-size: .85rem; }

.order-meta-info { border-left: 1px solid var(--green-light); padding-left: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; font-size: .75rem; }
.delivery-to small { font-size: .65rem; opacity: .7; display: block; }
.delivery-to p { margin: 2px 0 0; font-weight: 400; line-height: 1.3; }
.order-cost-breakdown { display: flex; flex-direction: column; gap: 4px; }
.cost-row { display: flex; justify-content: space-between; font-weight: 400; font-size: .72rem; }
.cost-row.total-row { font-weight: 700; font-size: .85rem; padding-top: 6px; border-top: 1px solid var(--green-light); margin-top: 2px; }

/* MODAL */
.overlay { position: fixed; inset: 0; background: rgba(8, 40, 24, .55); backdrop-filter: blur(3px); display: grid; place-items: center; z-index: 50; padding: 16px; }
.modal { background: #fff; width: 100%; max-width: 480px; max-height: 92vh; overflow: auto; padding: 28px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 24px 60px rgba(0,0,0,.3); }
.modal h2 { font-size: 1.4rem; }
.modal label { display: flex; flex-direction: column; gap: 5px; font-size: .85rem; }
.modal input:not([type='file']), .modal select { padding: 9px 10px; border: 1.5px solid var(--green); font: inherit; font-size: .9rem; color: var(--ink); outline: none; background: #fff; }
.modal input:focus, .modal select:focus { box-shadow: 0 0 0 3px rgba(0,104,56,.18); }
.pic-row { display: flex; align-items: center; gap: 18px; }
.upload { font-size: .8rem; }
.upload input { font-size: .72rem; margin-top: 4px; max-width: 220px; }
.actions { display: flex; justify-content: flex-end; gap: 10px; }

@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (max-width: 950px) {
  .dash { grid-template-columns: 1fr; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .lower { grid-template-columns: 1fr; }
  .order-card-body { grid-template-columns: 1fr; }
  .order-meta-info { border-left: 0; border-top: 1px solid var(--green-light); padding-left: 0; padding-top: 12px; }
}
</style>
