<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { user } from '../lib/auth'
import produce from '../assets/img/cat_produce.jpg'
import food from '../assets/img/cat_food.jpg'
import crafts from '../assets/img/cat_crafts.jpg'
import home from '../assets/img/cat_home.jpg'
import fashion from '../assets/img/cat_fashion.jpg'

const props = defineProps({ mine: Boolean })
const route = useRoute()
const router = useRouter()

const categories = [
  { slug: 'fresh-produce', name: 'Fresh Produce', image: produce },
  { slug: 'food-beverages', name: 'Food and Beverages', image: food },
  { slug: 'handmade-crafts', name: 'Handmade Crafts', image: crafts },
  { slug: 'home-living', name: 'Home and Living', image: home },
  { slug: 'fashion-accessories', name: 'Fashion and Accessories', image: fashion }
]
const locations = ['Dumaguete', 'Valencia', 'Sibulan', 'Bacong', 'Bonto', 'Amlan', 'San Jose', 'Others']

const products = ref([])
const loading = ref(true)
const error = ref('')
const locOpen = ref(true)

const activeCategory = computed(() => route.query.category || '')
const activeLocation = computed(() => route.query.location || '')
const title = computed(() => {
  if (props.mine) return 'My Products'
  return categories.find((c) => c.slug === activeCategory.value)?.name || (route.query.q ? `Results for “${route.query.q}”` : 'All Products')
})

function setFilter(key, value) {
  const query = { ...route.query }
  if (value) query[key] = value
  else delete query[key]
  router.push({ query })
}

async function load() {
  loading.value = true
  error.value = ''
  if (!isSupabaseConfigured) {
    error.value = 'Add your Supabase keys to .env to load products.'
    products.value = []
    loading.value = false
    return
  }
  let q = supabase.from('products').select('*').order('created_at', { ascending: false })
  if (props.mine) q = q.eq('owner_id', user.value?.id)
  if (activeCategory.value) q = q.eq('category_slug', activeCategory.value)
  if (activeLocation.value) q = q.eq('location', activeLocation.value)
  if (route.query.q) q = q.ilike('name', `%${route.query.q}%`)
  const { data, error: err } = await q
  if (err) error.value = err.message
  products.value = data ?? []
  loading.value = false
}

onMounted(load)
watch(() => route.query, load)
watch(() => user.value?.id, () => props.mine && load())

// ---- Add product (seller only) ----
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const preview = ref('')
const file = ref(null)
const form = ref({ name: '', price: '', unit: '', category_slug: categories[0].slug, location: locations[0] })

function pick(e) {
  file.value = e.target.files[0] || null
  preview.value = file.value ? URL.createObjectURL(file.value) : ''
}

function openForm() {
  form.value = { name: '', price: '', unit: '', category_slug: categories[0].slug, location: locations[0] }
  file.value = null
  preview.value = ''
  formError.value = ''
  showForm.value = true
}

async function save() {
  formError.value = ''
  saving.value = true
  try {
    let image_url = null
    if (file.value) {
      const path = `${user.value.id}/${Date.now()}-${file.value.name.replace(/[^\w.-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file.value)
      if (upErr) throw upErr
      image_url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }
    const seller = user.value.user_metadata?.full_name || user.value.email
    const { error: insErr } = await supabase.from('products').insert({
      ...form.value,
      price: Number(form.value.price),
      image_url,
      seller,
      owner_id: user.value.id
    })
    if (insErr) throw insErr
    showForm.value = false
    await load()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function remove(p) {
  if (!confirm(`Delete “${p.name}”?`)) return
  const { error: err } = await supabase.from('products').delete().eq('id', p.id)
  if (err) { error.value = err.message; return }
  products.value = products.value.filter((x) => x.id !== p.id)
}

const peso = (n) => '₱' + Number(n).toLocaleString('en-PH', { maximumFractionDigits: 2 })
</script>

<template>
  <section class="container browser">
    <aside class="side">
      <router-link v-if="mine" to="/profile" class="back" id="back-dashboard">← Back to Dashboard</router-link>

      <h2>Categories</h2>
      <ul class="cats">
        <li>
          <a href="#" :class="{ on: !activeCategory }" id="cat-all" @click.prevent="setFilter('category', '')">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            All Products
          </a>
        </li>
        <li v-for="c in categories" :key="c.slug">
          <a href="#" :class="{ on: activeCategory === c.slug }" :id="'cat-' + c.slug" @click.prevent="setFilter('category', c.slug)">
            <img :src="c.image" alt="" />{{ c.name }}
          </a>
        </li>
      </ul>

      <h2>Location</h2>
      <button class="loc-toggle" type="button" id="loc-toggle" @click="locOpen = !locOpen">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.500a2.500 2.500 0 0 1 0 5z" /></svg>
        <span @click.stop="setFilter('location', '')">All locations</span>
        <svg class="chev" :class="{ open: locOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <ul v-show="locOpen" class="locs">
        <li v-for="l in locations" :key="l">
          <a href="#" :class="{ on: activeLocation === l }" @click.prevent="setFilter('location', l)">{{ l }}</a>
        </li>
      </ul>
    </aside>

    <div class="content">
      <div class="bar">
        <h1>{{ title }}</h1>
        <button v-if="mine" class="btn btn-solid" id="add-product-btn" @click="openForm">+ Add Product</button>
      </div>

      <p v-if="loading">Loading…</p>
      <p v-else-if="error" class="note">{{ error }}</p>
      <p v-else-if="!products.length" class="note">
        {{ mine ? 'You haven’t added any products yet. Click “Add Product” to list your first one.' : 'No products found.' }}
      </p>

      <div class="grid">
        <article v-for="p in products" :key="p.id" class="card">
          <div class="pic">
            <img v-if="p.image_url" :src="p.image_url" :alt="p.name" loading="lazy" />
            <div v-else class="noimg">No photo</div>
            <button v-if="mine" class="del" aria-label="Delete product" @click="remove(p)">✕</button>
          </div>
          <h3>{{ p.name }}</h3>
          <span class="meta">{{ p.seller }}</span>
          <span class="meta">{{ p.location }}</span>
          <strong>{{ peso(p.price) }}<template v-if="p.unit"> / {{ p.unit }}</template></strong>
        </article>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showForm" class="overlay" @click.self="showForm = false">
        <form class="modal" @submit.prevent="save">
          <h2>Add New Product</h2>
          <label>Product name<input id="p-name" v-model="form.name" required /></label>
          <div class="row">
            <label>Price (₱)<input id="p-price" v-model="form.price" type="number" min="0" step="0.01" required /></label>
            <label>Per unit (optional)<input id="p-unit" v-model="form.unit" placeholder="kg, dozen…" /></label>
          </div>
          <div class="row">
            <label>Category
              <select id="p-category" v-model="form.category_slug"><option v-for="c in categories" :key="c.slug" :value="c.slug">{{ c.name }}</option></select>
            </label>
            <label>Location
              <select id="p-location" v-model="form.location"><option v-for="l in locations" :key="l">{{ l }}</option></select>
            </label>
          </div>
          <label>Photo<input id="p-photo" type="file" accept="image/*" @change="pick" /></label>
          <img v-if="preview" :src="preview" class="preview" alt="Preview" />
          <p v-if="formError" class="err">{{ formError }}</p>
          <div class="actions">
            <button type="button" class="btn btn-outline" @click="showForm = false">Cancel</button>
            <button class="btn btn-solid" id="save-product" :disabled="saving">{{ saving ? 'Saving…' : 'Save Product' }}</button>
          </div>
        </form>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.browser { display: grid; grid-template-columns: 200px 1fr; gap: 36px; padding-top: 32px; padding-bottom: 80px; }
.side h2 { font-size: 1.15rem; margin: 0 0 12px; }
.back { display: inline-block; font-size: .8rem; margin-bottom: 18px; text-decoration: underline; }
.cats, .locs { list-style: none; margin: 0 0 28px; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.cats a { display: flex; align-items: center; gap: 8px; font-size: .72rem; padding: 3px 4px; border-radius: 4px; transition: background .2s, transform .2s; }
.cats a:hover, .cats a.on { background: var(--green-light); transform: translateX(3px); }
.cats img { width: 22px; height: 22px; object-fit: cover; flex: none; }
.loc-toggle { display: flex; align-items: center; gap: 6px; background: none; border: 0; padding: 0; margin-bottom: 8px; color: var(--ink); font-size: .75rem; }
.loc-toggle span:hover { text-decoration: underline; }
.chev { transition: transform .2s; }
.chev.open { transform: rotate(180deg); }
.locs { gap: 6px; margin-left: 32px; font-size: .62rem; }
.locs a:hover, .locs a.on { text-decoration: underline; color: var(--green-dark); }
.locs a.on { font-size: .7rem; }

.bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; gap: 12px; }
.bar h1 { font-family: var(--font-body); font-size: 1.35rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 28px 24px; }
.card { display: flex; flex-direction: column; gap: 1px; animation: rise .45s both; }
.pic { position: relative; aspect-ratio: 1.12; background: var(--green-light); overflow: hidden; margin-bottom: 8px; }
.pic img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.card:hover .pic img { transform: scale(1.07); }
.noimg { height: 100%; display: grid; place-items: center; font-size: .75rem; opacity: .6; }
.del { position: absolute; top: 6px; right: 6px; width: 26px; height: 26px; border-radius: 50%; border: 0; background: rgba(255,255,255,.92); color: #c92a2a; opacity: 0; transition: opacity .2s; }
.card:hover .del { opacity: 1; }
.card h3 { margin: 0; font-size: .85rem; }
.meta { font-size: .58rem; }
.card strong { font-size: .65rem; }
.note { margin: 20px 0; }

.overlay { position: fixed; inset: 0; background: rgba(8, 40, 24, .55); backdrop-filter: blur(3px); display: grid; place-items: center; z-index: 50; padding: 16px; }
.modal { background: #fff; width: 100%; max-width: 480px; max-height: 92vh; overflow: auto; padding: 28px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 24px 60px rgba(0,0,0,.3); }
.modal h2 { font-size: 1.4rem; }
.modal label { display: flex; flex-direction: column; gap: 5px; font-size: .85rem; flex: 1; }
.modal input, .modal select { padding: 9px 10px; border: 1.5px solid var(--green); font: inherit; font-size: .9rem; color: var(--ink); background: #fff; outline: none; }
.modal input:focus, .modal select:focus { box-shadow: 0 0 0 3px rgba(0,104,56,.18); }
.row { display: flex; gap: 12px; }
.preview { max-height: 150px; object-fit: cover; }
.err { color: #c92a2a; margin: 0; font-size: .85rem; }
.actions { display: flex; justify-content: flex-end; gap: 10px; }

@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (max-width: 800px) { .browser { grid-template-columns: 1fr; } }
</style>
