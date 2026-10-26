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
import { supabase, isSupabaseConfigured } from './lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', component: Home },
    { path: '/shop', component: ProductBrowser },
    { path: '/cart', component: Cart },
    { path: '/checkout', component: Checkout, meta: { auth: true } },
    { path: '/login', component: Login },
    { path: '/profile', component: Profile, meta: { auth: true } },
    { path: '/profile/products', component: ProductBrowser, props: { mine: true }, meta: { auth: true } },
    { path: '/financing', component: InfoPage, props: { title: 'Financing', text: 'Micro-loans and flexible payment options to help local sellers grow and shoppers support them.' } },
    { path: '/learn', component: Learn },
    { path: '/learn/:id', component: Lesson },
    { path: '/about', component: InfoPage, props: { title: 'About', text: 'LocalLink connects communities with the farmers, artisans, and small businesses around them.' } }
  ]
})

router.beforeEach(async (to) => {
  if (!to.meta.auth) return true
  if (!isSupabaseConfigured) return { path: '/login', query: { redirect: to.fullPath } }
  const { data } = await supabase.auth.getSession()
  return data.session ? true : { path: '/login', query: { redirect: to.fullPath } }
})

createApp(App).use(router).mount('#app')
