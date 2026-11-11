<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { user } from '../lib/auth'
import { isSeller } from '../lib/profile'
import { peso } from '../lib/format'

const items = ref([])
const loading = ref(true)
const error = ref('')
const filter = ref('All')
const statuses = ['All', 'Pending', 'Delivered', 'Cancelled']

async function load() {
  if (!user.value?.id) return
  loading.value = true
  error.value = ''
  const { data, error: err } = await supabase
    .from('order_items')
    .select('id,order_id,name,price,qty,unit,status,buyer_name,created_at,orders(address,contact_number,payment_method)')
    .eq('seller_id', user.value.id)
    .order('created_at', { ascending: false })
  if (err) error.value = err.message
  items.value = data ?? []
  loading.value = false
}
onMounted(load)
watch(() => user.value?.id, load)

const shown = computed(() => items.value.filter((i) => filter.value === 'All' || i.status === filter.value))
const count = (s) => (s === 'All' ? items.value.length : items.value.filter((i) => i.status === s).length)
const line = (i) => Number(i.price) * i.qty
const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

async function setStatus(item, status) {
  const prev = item.status
  item.status = status
  const { error: err } = await supabase.from('order_items').update({ status }).eq('id', item.id)
  if (err) { item.status = prev; error.value = err.message }
}
</script>

<template>
  <section class="container page">
    <router-link to="/profile" class="back" id="back-dashboard">← Back to Dashboard</router-link>
    <h1>Customer Orders</h1>
    <p class="sub">Review incoming orders and update their delivery status.</p>

    <div v-if="!isSeller" class="note">Only seller accounts receive customer orders.</div>
    <template v-else>
      <div class="tabs">
        <button v-for="s in statuses" :key="s" :class="{ on: filter === s }" :id="'orders-tab-' + s.toLowerCase()" @click="filter = s">
          {{ s }} <span>{{ count(s) }}</span>
        </button>
      </div>

      <p v-if="error" class="err">{{ error }}</p>
      <p v-if="loading">Loading…</p>
      <p v-else-if="!shown.length" class="note">No {{ filter === 'All' ? '' : filter.toLowerCase() + ' ' }}orders yet.</p>

      <ul v-else class="list">
        <li v-for="o in shown" :key="o.id" class="order">
          <div class="who">
            <b>{{ o.buyer_name || 'Customer' }}</b>
            <span>Order #{{ o.order_id }} · {{ fmt(o.created_at) }}</span>
          </div>
          <div class="what">
            <span>{{ o.name }} × {{ o.qty }}<template v-if="o.unit"> ({{ o.unit }})</template></span>
            <small v-if="o.orders">📍 {{ o.orders.address }} · 📞 {{ o.orders.contact_number }} · {{ o.orders.payment_method }}</small>
          </div>
          <strong>{{ peso(line(o)) }}</strong>
          <select :value="o.status" :class="'st-' + o.status.toLowerCase()" :aria-label="'Status for order item ' + o.id" @change="setStatus(o, $event.target.value)">
            <option>Pending</option><option>Delivered</option><option>Cancelled</option>
          </select>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.back { display: inline-block; font-size: .8rem; text-decoration: underline; margin-bottom: 14px; }
h1 { font-size: 2.2rem; }
.sub { margin: 4px 0 20px; font-weight: 400; opacity: .8; }
.tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.tabs button { border: 1.5px solid var(--green); background: #fff; color: var(--green); padding: 7px 16px; font-size: .85rem; }
.tabs button span { opacity: .7; margin-left: 4px; }
.tabs button.on, .tabs button:hover { background: var(--green); color: #fff; }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.order { display: grid; grid-template-columns: 1.2fr 2fr auto auto; gap: 16px; align-items: center; border: 1px solid var(--green-light); padding: 14px 16px; }
.who, .what { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.who span, .what small { font-size: .7rem; font-weight: 400; opacity: .8; }
select { border: 1.5px solid var(--green); padding: 6px 10px; font: inherit; background: #fff; color: var(--green); }
.st-delivered { background: #d4edda; color: #155724; }
.st-cancelled { background: #f8d7da; color: #721c24; }
.st-pending { background: #fff3cd; color: #856404; }
.note { margin: 20px 0; }
.err { color: #e03131; }
@media (max-width: 800px) { .order { grid-template-columns: 1fr; } }
</style>

