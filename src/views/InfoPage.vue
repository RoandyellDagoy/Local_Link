<script setup>
defineProps({ title: String, text: String })
</script>

<template>
  <section class="container page">
    <h1>{{ title }}</h1>
    <p class="lead">{{ text }}</p>
  </section>
</template>
