<template>
  <div class="home-view">
    <div class="hero-section">
      <h1 class="hero-title">Documentation Topics</h1>
      <p class="hero-subtitle">Explore our comprehensive documentation library</p>
    </div>

    <div v-if="docs && docs.children && docs.children.length > 0" class="docs-grid">
      <router-link v-for="item in docs.children" :key="item.name" :to="`/${item.name}`" class="doc-card">
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

    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <h2>No documentation found</h2>
      <p>There are currently no documentation topics available.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import docs from '../docs.json';

onMounted(() => {
  console.log('HomeView mounted with docs:', docs);
});
</script>

<style scoped>
.hero-section {
  text-align: center;
  padding: var(--spacing-xxl) 0;
  margin-bottom: var(--spacing-xl);
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-muted);
  max-width: 600px;
  margin: 0 auto;
}

.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.doc-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--color-text-body);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.doc-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: var(--color-primary);
  text-decoration: none;
}

.doc-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-mute);
  border-radius: var(--border-radius);
}

.doc-info {
  flex: 1;
}

.doc-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-heading);
  margin: 0 0 0.25rem 0;
}

.doc-type {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0;
}

.doc-arrow {
  font-size: 1.5rem;
  color: var(--color-text-muted);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.2s ease;
}

.doc-card:hover .doc-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--color-primary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xxl);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-lg);
  display: inline-block;
}

.empty-state h2 {
  font-size: 1.5rem;
}

.empty-state p {
  color: var(--color-text-muted);
  margin-top: var(--spacing-sm);
}
</style>
