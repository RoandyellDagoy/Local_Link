<script setup>
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />
  <main>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  <footer class="footer">
    <div class="container">© {{ new Date().getFullYear() }} LocalLink — Support Local. Build Brighter Futures.</div>
  </footer>
</template>

<style scoped>
.footer { border-top: 1px solid var(--green-light); padding: 28px 0; text-align: center; font-size: .9rem; }
</style>
