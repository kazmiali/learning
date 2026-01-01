<template>
  <div class="home-view">
    <div class="hero-section">
      <div class="hero-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Personal Knowledge Base</span>
      </div>
      <h1 class="hero-title">My Learning Journey</h1>
      <p class="hero-subtitle">A curated collection of programming notes, concepts, and insights from my continuous learning adventure</p>
    </div>

    <div v-if="docs && docs.children && docs.children.length > 0" class="content-section">
      <div class="section-header">
        <h2 class="section-title">Topics</h2>
        <div class="topic-count">{{ docs.children.length }} {{ docs.children.length === 1 ? 'topic' : 'topics' }}</div>
      </div>
      
      <div class="docs-grid">
        <router-link v-for="item in docs.children" :key="item.name" :to="`/${item.name}`" class="doc-card">
          <div class="card-header">
            <div class="doc-icon">
              <svg v-if="item.type === 'directory'" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="card-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="12 5 19 12 12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="card-content">
            <h3 class="doc-name">{{ formatName(item.name) }}</h3>
            <p class="doc-type">{{ item.type === 'directory' ? 'Collection' : 'Document' }}</p>
          </div>
        </router-link>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2>No Notes Yet</h2>
      <p>Start your learning journey by adding your first notes</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import docs from '../docs.json';

function formatName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

onMounted(() => {
  console.log('HomeView mounted with docs:', docs);
});
</script>

<style scoped>
.home-view {
  max-width: 100%;
}

.hero-section {
  text-align: center;
  padding: var(--spacing-3xl) 0 var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-accent-light);
  color: var(--color-accent);
  border-radius: 100px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
  max-width: 640px;
  margin: 0 auto;
}

.content-section {
  margin-top: var(--spacing-2xl);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.topic-count {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
}

.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.doc-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-xl);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.doc-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.doc-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-accent);
  text-decoration: none;
}

.doc-card:hover::before {
  transform: scaleX(1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.doc-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--color-accent-light);
  color: var(--color-accent);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.doc-card:hover .doc-icon {
  background-color: var(--color-accent);
  color: white;
  transform: scale(1.05);
}

.card-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-text-tertiary);
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.2s ease;
}

.doc-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--color-accent);
}

.card-content {
  flex: 1;
}

.doc-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  letter-spacing: -0.01em;
}

.doc-type {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-tertiary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background-color: var(--color-surface);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  margin-top: var(--spacing-2xl);
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  color: var(--color-text-tertiary);
  font-size: 1rem;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .docs-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}
</style>
