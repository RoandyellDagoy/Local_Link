import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import Home from './views/Home.vue'
import ProductBrowser from './components/ProductBrowser.vue'
import Login from './views/Login.vue'
import InfoPage from './views/InfoPage.vue'
import Profile from './views/Profile.vue'
import Learn from './views/Learn.vue'
import Lesson from './views/Lesson.vue'
import Cart from './views/Cart.vue'
import Checkout from './views/Checkout.vue'
import Admin from './views/Admin.vue'
import SellerOrders from './views/SellerOrders.vue'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { fetchRole } from './lib/profile'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: Home },
    { path: '/shop', component: ProductBrowser },
    { path: '/cart', component: Cart, meta: { auth: true } },
    { path: '/checkout', component: Checkout, meta: { auth: true } },
    { path: '/login', component: Login },
    { path: '/profile', component: Profile, meta: { auth: true } },
    { path: '/profile/orders', component: SellerOrders, meta: { auth: true } },
    { path: '/admin', component: Admin, meta: { auth: true, admin: true } },
    { path: '/profile/products', component: ProductBrowser, props: { mine: true }, meta: { auth: true } },
    { path: '/learn', component: Learn },
    { path: '/learn/:id', component: Lesson },
    { path: '/about', component: InfoPage, props: { title: 'About', text: 'LocalLink connects communities with the farmers, artisans, and small businesses around them.' } }
  ]
})

router.beforeEach(async (to) => {
  if (!to.meta.auth) return true
  if (!isSupabaseConfigured) return { path: '/login', query: { redirect: to.fullPath } }
  const { data } = await supabase.auth.getSession()
  if (!data.session) return { path: '/login', query: { redirect: to.fullPath } }
  // Admins live in /admin; everyone else is kept out of it (data is also protected by RLS)
  const admin = (await fetchRole(data.session.user.id)) === 'admin'
  if (to.meta.admin && !admin) return '/profile'
  if (admin && to.path === '/profile') return '/admin'
  return true
})

createApp(App).use(router).mount('#app')

