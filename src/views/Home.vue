<script setup>
import { ref, onMounted } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { categories as localCategories, categoryImage } from '../lib/categories'
import hero from '../assets/img/hero_market.jpg'

// Local fallback; replaced by the `categories` table when Supabase is configured.
const categories = ref(localCategories)

onMounted(async () => {
  if (!isSupabaseConfigured) return
  const { data } = await supabase.from('categories').select('slug,name,image_url').order('sort_order')
  if (data?.length) categories.value = data.map((c) => ({ ...c, image: c.image_url || categoryImage(c.slug) }))
})
</script>

<template>
  <div>
    <section class="container hero">
      <div class="copy">
        <h1>Support Local.<br />Build Brighter Futures.</h1>
        <p>Shop fresh, handmade, and unique products from local farmers, artisans, and small businesses</p>
        <div class="cta">
          <router-link to="/shop" class="btn btn-solid" id="shop-now">Shop Now</router-link>
          <router-link to="/about" class="btn btn-outline" id="learn-more">Learn More</router-link>
        </div>
      </div>
      <div class="hero-img"><img :src="hero" alt="Baskets of dragon fruit, tomatoes, oranges and mangoes at a local market" /></div>
    </section>

    <section class="container cats" aria-labelledby="cat-title">
      <h2 id="cat-title">Shop by Category</h2>
      <ul>
        <li v-for="c in categories" :key="c.slug">
          <router-link :to="{ path: '/shop', query: { category: c.slug } }" :id="'cat-' + c.slug">
            <div class="thumb"><img :src="c.image" :alt="c.name" loading="lazy" /></div>
            <span>{{ c.name }}</span>
          </router-link>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.hero { display: grid; grid-template-columns: 1fr 1.6fr; gap: 40px; align-items: center; padding-top: 36px; padding-bottom: 40px; }
.copy h1 { font-size: clamp(2.2rem, 4vw, 3.2rem); line-height: 1.2; animation: rise .7s both; }
.copy p { max-width: 340px; font-size: 1.1rem; line-height: 1.4; margin: 18px 0 20px; animation: rise .7s .12s both; }
.cta { display: flex; gap: 14px; animation: rise .7s .24s both; }
.hero-img { border: 2px solid var(--accent); overflow: hidden; aspect-ratio: 2.1/1; animation: rise .8s .1s both; }
.hero-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s ease; }
.hero-img:hover img { transform: scale(1.05); }

.cats { padding-bottom: 80px; }
.cats h2 { font-size: 1.35rem; margin: 10px 0 24px; }
.cats ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; }
.cats li a { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; font-size: .95rem; line-height: 1.2; }
.thumb { width: 100%; max-width: 150px; aspect-ratio: 1; overflow: hidden; transition: transform .25s, box-shadow .25s; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.cats li a:hover .thumb { transform: translateY(-6px); box-shadow: 0 14px 24px rgba(0,104,56,.25); }

@keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; }
  .cats ul { grid-template-columns: repeat(3, 1fr); }
}
</style>
