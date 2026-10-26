<script setup>
import { cart, subtotal, setQty, removeFromCart, peso } from '../lib/cart'
</script>

<template>
  <section class="container cart">
    <router-link to="/shop" class="back" id="back-shop">← Continue Shopping</router-link>
    <h1>Your Cart</h1>

    <div v-if="!cart.length" class="empty">
      <p>Your cart is empty.</p>
      <router-link to="/shop" class="btn btn-solid">Browse Products</router-link>
    </div>

    <div v-else class="layout">
      <ul class="items">
        <li v-for="i in cart" :key="i.id">
          <div class="thumb">
            <img v-if="i.image_url" :src="i.image_url" :alt="i.name" />
            <span v-else>No photo</span>
          </div>
          <div class="info">
            <b>{{ i.name }}</b>
            <span>{{ i.seller }}</span>
            <span>{{ peso(i.price) }}<template v-if="i.unit"> / {{ i.unit }}</template></span>
          </div>
          <div class="qty">
            <button :id="'dec-' + i.id" aria-label="Decrease" @click="setQty(i.id, i.qty - 1)">−</button>
            <span>{{ i.qty }}</span>
            <button :id="'inc-' + i.id" aria-label="Increase" @click="setQty(i.id, i.qty + 1)">+</button>
          </div>
          <strong class="line">{{ peso(i.price * i.qty) }}</strong>
          <button class="rm" aria-label="Remove" @click="removeFromCart(i.id)">✕</button>
        </li>
      </ul>

      <aside class="sum">
        <h2>Summary</h2>
        <div class="row"><span>Subtotal</span><span>{{ peso(subtotal) }}</span></div>
        <p class="hint">Delivery fee is added at checkout.</p>
        <router-link to="/checkout" class="btn btn-solid" id="checkout-btn">Proceed to Checkout</router-link>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.cart { padding-top: 32px; padding-bottom: 90px; max-width: 980px; animation: rise .5s both; }
.back { font-size: .85rem; text-decoration: underline; }
h1 { font-family: var(--font-body); font-size: 1.8rem; margin: 12px 0 22px; }
.empty { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
.layout { display: grid; grid-template-columns: 1fr 260px; gap: 36px; align-items: start; }
.items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.items li { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--green-light); }
.thumb { width: 64px; height: 64px; background: var(--green-light); display: grid; place-items: center; font-size: .55rem; flex: none; overflow: hidden; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.info { flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: .75rem; }
.info b { font-size: .9rem; }
.qty { display: flex; align-items: center; gap: 10px; }
.qty button { width: 26px; height: 26px; border: 1.5px solid var(--green); background: #fff; color: var(--green); font-size: 1rem; line-height: 1; transition: background .2s, color .2s; }
.qty button:hover { background: var(--green); color: #fff; }
.line { min-width: 70px; text-align: right; }
.rm { border: 0; background: none; color: #c92a2a; font-size: .9rem; }
.sum { border: 1px solid var(--green); padding: 18px; display: flex; flex-direction: column; gap: 10px; position: sticky; top: 90px; }
.sum h2 { font-size: 1.2rem; }
.row { display: flex; justify-content: space-between; }
.hint { margin: 0; font-size: .65rem; opacity: .8; }
.sum .btn { text-align: center; }
@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (max-width: 800px) { .layout { grid-template-columns: 1fr; } .sum { position: static; } }
</style>
