<template>
  <div class="home-container">
    <div class="hero-section neomorph-card">
      <div class="hero-content">
        <h1 class="hero-title">Documentation Topics</h1>
        <p class="hero-subtitle">Explore our comprehensive documentation library</p>
      </div>
      <div class="hero-icon">📖</div>
    </div>

    <div v-if="docs && docs.children && docs.children.length > 0" class="docs-grid">
      <div v-for="item in docs.children" :key="item.name" class="doc-card neomorph-card">
        <router-link :to="`/${item.name}`" class="doc-link">
          <div class="doc-icon">
            {{ item.type === 'directory' ? '📁' : '📄' }}
          </div>
          <div class="doc-info">
            <h3 class="doc-name">{{ item.name }}</h3>
            <p class="doc-type">{{ item.type === 'directory' ? 'Directory' : 'File' }}</p>
          </div>
          <div class="doc-arrow">→</div>
        </router-link>
      </div>
    </div>

    <div v-else class="empty-state neomorph-card">
      <div class="empty-icon">📭</div>
      <h2>No documentation found</h2>
      <p>There are currently no documentation topics available.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import docs from '../docs.json';

const docsData = ref(docs);

onMounted(() => {
  console.log('HomeView mounted with docs:', docs);
});
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3rem;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, var(--neomorph-bg), #f0f4f8);
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 3rem;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, var(--neomorph-accent), #6ab0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--neomorph-text-muted);
  margin: 0;
}

.hero-icon {
  font-size: 5rem;
  filter: drop-shadow(4px 4px 8px var(--neomorph-shadow-dark));
}

.neomorph-card {
  background-color: var(--neomorph-bg);
  box-shadow: 8px 8px 16px var(--neomorph-shadow-dark),
              -8px -8px 16px var(--neomorph-shadow-light);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.doc-card {
  padding: 0;
  overflow: hidden;
}

.doc-card:hover {
  transform: translateY(-4px);
  box-shadow: 12px 12px 24px var(--neomorph-shadow-dark),
              -12px -12px 24px var(--neomorph-shadow-light);
}

.doc-link {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  text-decoration: none;
  color: var(--neomorph-text);
  gap: 1rem;
  height: 100%;
}

.doc-icon {
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background-color: var(--neomorph-bg);
  box-shadow: inset 3px 3px 6px var(--neomorph-shadow-dark),
              inset -3px -3px 6px var(--neomorph-shadow-light);
}

.doc-info {
  flex: 1;
}

.doc-name {
  font-size: 1.2rem;
  margin: 0 0 0.25rem 0;
  color: var(--neomorph-text);
  font-weight: 600;
}

.doc-type {
  font-size: 0.9rem;
  color: var(--neomorph-text-muted);
  margin: 0;
}

.doc-arrow {
  font-size: 1.5rem;
  color: var(--neomorph-accent);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.doc-card:hover .doc-arrow {
  opacity: 1;
  transform: translateX(0);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.empty-state h2 {
  margin: 0 0 1rem 0;
  color: var(--neomorph-text);
}

.empty-state p {
  color: var(--neomorph-text-muted);
  margin: 0;
}
</style>
