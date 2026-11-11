<script setup>
// Shared KPI card used by the seller/shopper dashboard and the admin dashboard.
defineProps({
  label: String,
  value: [String, Number],
  note: String,
  up: { type: Boolean, default: null }, // true = ↑ green, false = ↓ red, null = neutral
  large: Boolean // bigger display-font variant (admin dashboard)
})
</script>

<template>
  <div class="stat" :class="{ large }">
    <span class="lbl">{{ label }}</span>
    <strong>{{ value }}</strong>
    <small v-if="note" :class="{ down: up === false, up: up === true }">
      <template v-if="up === true">↑ </template><template v-else-if="up === false">↓ </template>{{ note }}
    </small>
  </div>
</template>

<style scoped>
.stat { border: 1px solid var(--green); padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; transition: transform .25s, box-shadow .25s; }
.stat:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,104,56,.18); }
.lbl { font-size: .85rem; }
strong { font-size: 1.4rem; }
small { font-size: .62rem; font-weight: 400; }
small.down { color: #e03131; }
small.up { color: var(--green-dark); }
.stat.large { padding: 12px 16px; gap: 4px; }
.large .lbl { font-family: var(--font-display); font-weight: 400; font-size: 1.1rem; }
.large strong { font-family: var(--font-display); font-weight: 400; font-size: 1.7rem; }
.large small { font-size: .7rem; font-weight: 700; }
</style>

