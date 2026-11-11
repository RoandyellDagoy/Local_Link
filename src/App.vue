<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'

// The admin dashboard has its own header/sidebar layout
const route = useRoute()
const bare = computed(() => route.path.startsWith('/admin'))
</script>

<template>
  <NavBar v-if="!bare" />
  <main>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  <footer v-if="!bare" class="footer">
    <div class="container">© {{ new Date().getFullYear() }} LocalLink — Support Local. Build Brighter Futures.</div>
  </footer>
</template>

<style scoped>
.footer { border-top: 1px solid var(--green-light); padding: 28px 0; text-align: center; font-size: .9rem; }
</style>
