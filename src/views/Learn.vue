<script setup>
import { ref, computed } from 'vue'
import { courses, topics } from '../lib/courses'

const q = ref('')
const topic = ref('')
const done = JSON.parse(localStorage.getItem('ll-done') || '[]')

const list = computed(() =>
  courses.filter((c) =>
    (!topic.value || c.topic === topic.value) &&
    (!q.value || (c.title + ' ' + c.summary).toLowerCase().includes(q.value.toLowerCase()))
  )
)
</script>

<template>
  <section class="container hub">
    <h1>Learning Hub</h1>
    <p class="tag">Build your skills. Grow your business.</p>

    <form class="search" role="search" @submit.prevent>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
      <input id="learn-search" v-model="q" type="search" placeholder="Search for topics....." aria-label="Search topics" />
    </form>

    <div class="chips">
      <button :class="{ on: !topic }" id="topic-all" @click="topic = ''">All Topics</button>
      <button v-for="t in topics" :key="t" :class="{ on: topic === t }" @click="topic = t">{{ t }}</button>
    </div>

    <ul class="list">
      <li v-for="c in list" :key="c.id">
        <img :src="c.image" :alt="c.title" loading="lazy" />
        <div class="info">
          <h2>{{ c.title }}</h2>
          <p>{{ c.summary }}</p>
          <span>{{ c.minutes }} minutes. {{ c.level }}</span>
        </div>
        <router-link :to="'/learn/' + c.id" class="start" :id="'start-' + c.id">{{ done.includes(c.id) ? 'Review' : 'Start' }}</router-link>
      </li>
    </ul>
    <p v-if="!list.length" class="empty">No lessons match your search.</p>
  </section>
</template>

<style scoped>
.hub { padding-top: 40px; padding-bottom: 80px; max-width: 900px; }
h1 { font-family: var(--font-body); font-size: 2rem; font-weight: 700; }
.tag { font-size: 1.35rem; margin: 4px 0 18px; font-weight: 400; }
.search { display: flex; align-items: center; gap: 8px; border: 1.2px solid var(--ink); border-radius: 999px; padding: 6px 14px; max-width: 360px; transition: box-shadow .2s; }
.search:focus-within { box-shadow: 0 0 0 3px rgba(0,104,56,.15); border-color: var(--green); }
.search input { flex: 1; border: 0; outline: 0; font: inherit; font-size: .8rem; color: var(--ink); background: transparent; }
.chips { display: flex; flex-wrap: wrap; gap: 14px; margin: 18px 0 24px; }
.chips button { background: var(--green); color: #fff; border: 0; border-radius: 999px; padding: 6px 18px; font-size: .78rem; opacity: .75; transition: opacity .2s, transform .2s; }
.chips button:hover { opacity: 1; transform: translateY(-2px); }
.chips button.on { opacity: 1; box-shadow: 0 0 0 3px rgba(0,104,56,.25); }
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 18px; }
.list li { display: flex; align-items: center; gap: 16px; padding: 8px; border-radius: 8px; transition: background .2s, transform .2s; animation: rise .45s both; }
.list li:hover { background: var(--green-light); transform: translateX(4px); }
.list img { width: 58px; height: 58px; object-fit: cover; flex: none; }
.info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.info h2 { font-size: .85rem; }
.info p { margin: 0; font-size: .68rem; font-weight: 400; }
.info span { font-size: .62rem; margin-top: 4px; }
.start { background: var(--green); color: #fff; padding: 6px 22px; border-radius: 999px; font-size: .78rem; transition: background .2s, transform .2s; }
.start:hover { background: var(--green-dark); transform: scale(1.06); }
.empty { margin-top: 20px; }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
</style>
