<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { courses } from '../lib/courses'

const route = useRoute()
const course = computed(() => courses.find((c) => c.id === route.params.id))
const done = ref(JSON.parse(localStorage.getItem('ll-done') || '[]'))
const isDone = computed(() => done.value.includes(route.params.id))

function toggle() {
  done.value = isDone.value ? done.value.filter((i) => i !== route.params.id) : [...done.value, route.params.id]
  localStorage.setItem('ll-done', JSON.stringify(done.value))
}
</script>

<template>
  <section class="container lesson" v-if="course">
    <router-link to="/learn" class="back" id="back-learn">← Back to Learning Hub</router-link>
    <img :src="course.image" :alt="course.title" class="cover" />
    <span class="badge">{{ course.topic }}</span>
    <h1>{{ course.title }}</h1>
    <p class="meta">{{ course.minutes }} minutes. {{ course.level }}</p>
    <p class="sum">{{ course.summary }}</p>

    <ol class="steps">
      <li v-for="s in course.sections" :key="s.h">
        <h2>{{ s.h }}</h2>
        <p>{{ s.p }}</p>
      </li>
    </ol>

    <div class="box">
      <h3>Key takeaways</h3>
      <ul><li v-for="t in course.takeaways" :key="t">{{ t }}</li></ul>
    </div>

    <div class="box">
      <h3>Resources to learn more</h3>
      <ul>
        <li v-for="r in course.resources" :key="r.url"><a :href="r.url" target="_blank" rel="noopener">{{ r.label }} ↗</a></li>
      </ul>
    </div>

    <button class="btn" :class="isDone ? 'btn-outline' : 'btn-solid'" id="mark-done" @click="toggle">
      {{ isDone ? '✓ Completed — undo' : 'Mark as complete' }}
    </button>
  </section>

  <section class="container lesson" v-else>
    <h1>Lesson not found</h1>
    <router-link to="/learn" class="back">← Back to Learning Hub</router-link>
  </section>
</template>

<style scoped>
.lesson { max-width: 760px; padding-top: 32px; padding-bottom: 90px; animation: rise .5s both; }
.back { font-size: .85rem; text-decoration: underline; }
.cover { width: 100%; aspect-ratio: 2.4; object-fit: cover; margin: 18px 0; }
.badge { display: inline-block; background: var(--green-light); padding: 3px 14px; border-radius: 999px; font-size: .75rem; }
h1 { font-family: var(--font-body); font-size: 2rem; margin: 10px 0 4px; }
.meta { margin: 0; font-size: .8rem; }
.sum { font-size: 1.1rem; font-weight: 400; margin: 10px 0 24px; }
.steps { padding-left: 22px; display: flex; flex-direction: column; gap: 20px; }
.steps h2 { font-size: 1.1rem; }
.steps p { margin: 4px 0 0; font-weight: 400; line-height: 1.65; color: var(--ink); }
.box { border: 1px solid var(--green); padding: 16px 20px; margin: 28px 0; }
.box h3 { margin: 0 0 8px; }
.box ul { margin: 0; padding-left: 18px; line-height: 1.8; font-weight: 400; }
.box a { text-decoration: underline; }
@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
</style>
