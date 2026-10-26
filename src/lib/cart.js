import { ref, computed, watch } from 'vue'

const KEY = 'll-cart'
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export const cart = ref(load())
watch(cart, (v) => localStorage.setItem(KEY, JSON.stringify(v)), { deep: true })

export const DELIVERY_FEE = 50

export const cartCount = computed(() => cart.value.reduce((n, i) => n + i.qty, 0))
export const subtotal = computed(() => cart.value.reduce((n, i) => n + i.price * i.qty, 0))

export function addToCart(p, qty = 1) {
  const found = cart.value.find((i) => i.id === p.id)
  if (found) found.qty += qty
  else cart.value.push({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    unit: p.unit || '',
    image_url: p.image_url || '',
    seller: p.seller || '',
    owner_id: p.owner_id || null,
    qty
  })
}

export function setQty(id, qty) {
  const item = cart.value.find((i) => i.id === id)
  if (!item) return
  if (qty < 1) return removeFromCart(id)
  item.qty = Math.min(qty, 99)
}

export const removeFromCart = (id) => { cart.value = cart.value.filter((i) => i.id !== id) }
export const clearCart = () => { cart.value = [] }

export const peso = (n) => '₱' + Number(n).toLocaleString('en-PH', { maximumFractionDigits: 2 })
