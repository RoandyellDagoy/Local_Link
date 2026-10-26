<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { user } from '../lib/auth'
import { profile } from '../lib/profile'
import { cart, subtotal, clearCart, peso, DELIVERY_FEE } from '../lib/cart'

const router = useRouter()

const form = ref({
  full_name: user.value?.user_metadata?.full_name || '',
  address: '',
  contact_number: ''
})

// Fill blank fields from the saved profile (it may finish loading after this page opens)
watch(profile, (p) => {
  if (!p) return
  form.value.full_name ||= p.full_name || ''
  form.value.address ||= p.address || ''
  form.value.contact_number ||= p.contact_number || ''
}, { immediate: true })
const payment = ref('GCash')
const methods = ['GCash', 'Bank Transfer', 'Cash on Delivery']

const total = computed(() => subtotal.value + (cart.value.length ? DELIVERY_FEE : 0))
const busy = ref(false)
const error = ref('')
const placedId = ref(null)

async function placeOrder() {
  error.value = ''
  if (!cart.value.length) return
  busy.value = true
  try {
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .insert({
        ...form.value,
        payment_method: payment.value,
        subtotal: subtotal.value,
        delivery_fee: DELIVERY_FEE,
        total: total.value,
        user_id: user.value.id
      })
      .select('id')
      .single()
    if (oErr) throw oErr

    const { error: iErr } = await supabase.from('order_items').insert(
      cart.value.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        seller_id: i.owner_id,
        name: i.name,
        price: i.price,
        unit: i.unit,
        image_url: i.image_url,
        qty: i.qty,
        buyer_name: form.value.full_name
      }))
    )
    if (iErr) throw iErr

    placedId.value = order.id
    clearCart()
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="container checkout">
    <!-- Success state -->
    <div v-if="placedId" class="done">
      <div class="tick">✓</div>
      <h1>Order Placed!</h1>
      <p>Thank you for supporting local. Your order <b>#{{ placedId }}</b> has been sent to the sellers.</p>
      <router-link to="/shop" class="btn btn-solid" id="keep-shopping">Continue Shopping</router-link>
    </div>

    <form v-else @submit.prevent="placeOrder">
      <router-link to="/cart" class="back" id="back-cart">← Back to Cart</router-link>
      <h1>Checkout</h1>

      <p v-if="!cart.length" class="empty">Your cart is empty. <router-link to="/shop">Browse products</router-link></p>

      <template v-else>
        <h2>1. Delivery Information</h2>
        <div class="fields">
          <label for="c-name">Full Name</label>
          <input id="c-name" v-model="form.full_name" required autocomplete="name" />
          <label for="c-address">Address</label>
          <input id="c-address" v-model="form.address" required placeholder="Purok, Barangay, City, Province" autocomplete="street-address" />
          <label for="c-contact">Contact Number</label>
          <input id="c-contact" v-model="form.contact_number" required inputmode="tel" pattern="[0-9+\s-]{7,}" placeholder="09XX XXX XXXX" autocomplete="tel" />
        </div>

        <h2>2. Payment Method</h2>
        <div class="pay">
          <label v-for="m in methods" :key="m" class="opt" :class="{ on: payment === m }">
            <input type="radio" name="payment" :value="m" v-model="payment" />
            <span class="dot"></span>
            <span class="name">{{ m }}</span>
            <svg v-if="m === 'GCash'" class="ico" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#007cff" /><text x="16" y="20" text-anchor="middle" font-size="9" fill="#fff" font-family="Arial" font-weight="700">G</text></svg>
            <svg v-else-if="m === 'Bank Transfer'" class="ico" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.4"><path d="M3 9l9-6 9 6M5 9v9M9 9v9M15 9v9M19 9v9M3 21h18M3 18h18" /></svg>
            <svg v-else class="ico" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.4"><rect x="2" y="6" width="20" height="12" rx="1.5" /><circle cx="12" cy="12" r="3" /><path d="M5 9v.01M19 15v.01" /></svg>
          </label>
        </div>

        <h2>3. Order Summary</h2>
        <ul class="items">
          <li v-for="i in cart" :key="i.id">
            <div class="thumb"><img v-if="i.image_url" :src="i.image_url" :alt="i.name" /><span v-else>No photo</span></div>
            <div class="info">
              <b>{{ i.name }}</b>
              <small>{{ peso(i.price) }} x {{ i.qty }}</small>
            </div>
          </li>
        </ul>

        <dl class="totals">
          <div><dt>Subtotal</dt><dd>{{ peso(subtotal) }}</dd></div>
          <div><dt>Delivery Fee</dt><dd>{{ peso(DELIVERY_FEE) }}</dd></div>
          <div class="grand"><dt>Total</dt><dd>{{ peso(total) }}</dd></div>
        </dl>

        <p v-if="error" class="err">{{ error }}</p>
        <button class="place" id="place-order" :disabled="busy">{{ busy ? 'Placing order…' : 'Place Order' }}</button>
      </template>
    </form>
  </section>
</template>

<style scoped>
.checkout { max-width: 560px; padding-top: 28px; padding-bottom: 100px; animation: rise .5s both; }
.back { font-size: .8rem; }
.back:hover { text-decoration: underline; }
h1 { font-family: var(--font-body); font-size: 1.6rem; margin: 6px 0 22px; }
h2 { font-size: .85rem; margin: 26px 0 12px; }
.fields { display: grid; grid-template-columns: 120px 1fr; gap: 12px 12px; align-items: center; font-size: .75rem; }
.fields input { padding: 8px 10px; border: 1.2px solid var(--green); font: inherit; font-size: .8rem; color: var(--ink); outline: none; background: #fff; }
.fields input:focus { box-shadow: 0 0 0 3px rgba(0,104,56,.18); }

.pay { display: flex; flex-direction: column; gap: 10px; max-width: 360px; }
.opt { display: flex; align-items: center; gap: 10px; font-size: .78rem; cursor: pointer; padding: 6px 8px; border-radius: 6px; transition: background .2s; }
.opt:hover, .opt.on { background: var(--green-light); }
.opt input { position: absolute; opacity: 0; }
.dot { width: 14px; height: 14px; border: 1.5px solid var(--green); border-radius: 50%; display: grid; place-items: center; flex: none; }
.opt.on .dot::after { content: ''; width: 8px; height: 8px; background: var(--green); border-radius: 50%; }
.name { flex: 1; }
.ico { width: 28px; height: 28px; }

.items { list-style: none; margin: 0 0 16px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.items li { display: flex; gap: 14px; align-items: center; }
.thumb { width: 52px; height: 52px; background: var(--green-light); display: grid; place-items: center; font-size: .5rem; overflow: hidden; flex: none; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.info { display: flex; flex-direction: column; gap: 2px; font-size: .78rem; }
.info small { font-size: .62rem; }

.totals { margin: 0 0 16px; max-width: 300px; font-size: .78rem; display: flex; flex-direction: column; gap: 6px; }
.totals div { display: flex; justify-content: space-between; }
.totals dt, .totals dd { margin: 0; }
.grand { font-size: 1rem; font-weight: 700; padding-top: 6px; border-top: 1px solid var(--green-light); }

.place { width: 100%; max-width: 360px; padding: 9px; border: 0; background: var(--green); color: #fff; font-size: .9rem; font-weight: 700; transition: background .2s, transform .15s, box-shadow .2s; }
.place:hover:not(:disabled) { background: var(--green-dark); box-shadow: 0 8px 18px rgba(0,104,56,.28); transform: translateY(-2px); }
.place:disabled { opacity: .6; cursor: wait; }
.err { color: #c92a2a; font-size: .8rem; }
.empty { font-size: .9rem; }
.empty a { text-decoration: underline; }

.done { text-align: center; padding: 50px 0; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.tick { width: 72px; height: 72px; border-radius: 50%; background: var(--green); color: #fff; font-size: 2.2rem; display: grid; place-items: center; animation: pop .5s; }
@keyframes pop { 0% { transform: scale(.3); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }
@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (max-width: 520px) { .fields { grid-template-columns: 1fr; } }
</style>
