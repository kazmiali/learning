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
      
      <div class="hero-stats">
        <div class="stat-item">
          <div class="stat-number">{{ totalTopics }}</div>
          <div class="stat-label">Topics</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ totalFiles }}</div>
          <div class="stat-label">Documents</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ totalDepth }}</div>
          <div class="stat-label">Categories</div>
        </div>
      </div>
    </div>

    <div v-if="docs && docs.children && docs.children.length > 0" class="content-section">
      <div class="section-header">
        <h2 class="section-title">Topics</h2>
        <div class="header-actions">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search topics..." 
              class="search-input"
            />
          </div>
          <div class="topic-count">{{ filteredTopics.length }} {{ filteredTopics.length === 1 ? 'topic' : 'topics' }}</div>
        </div>
      </div>
      
      <div class="docs-grid">
        <router-link v-for="item in filteredTopics" :key="item.name" :to="`/${item.name}`" class="doc-card">
          <div class="card-header">
            <div class="doc-icon" :class="{ 'is-directory': item.type === 'directory' }">
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
            <div class="card-meta">
              <span class="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ item.type === 'directory' ? countFiles(item) + ' items' : '1 document' }}
              </span>
              <span class="meta-item" v-if="item.type === 'directory'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ countDepth(item) + ' levels' }}
              </span>
            </div>
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
import { onMounted, computed, ref } from 'vue';
import docs from '../docs.json';

function formatName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function countFiles(item: any): number {
  if (item.type === 'file') return 1;
  if (!item.children) return 0;
  return item.children.reduce((total: number, child: any) => total + countFiles(child), 0);
}

function countDepth(item: any, currentDepth: number = 0): number {
  if (item.type === 'file') return currentDepth;
  if (!item.children || item.children.length === 0) return currentDepth;
  return Math.max(...item.children.map((child: any) => countDepth(child, currentDepth + 1)));
}

const searchQuery = ref('');
const totalTopics = computed(() => docs.children?.length || 0);
const totalFiles = computed(() => countFiles(docs));
const totalDepth = computed(() => countDepth(docs));

const filteredTopics = computed(() => {
  if (!docs.children) return [];
  if (!searchQuery.value) return docs.children;
  
  const query = searchQuery.value.toLowerCase();
  return docs.children.filter(item => 
    item.name.toLowerCase().includes(query) ||
    formatName(item.name).toLowerCase().includes(query)
  );
});

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

.hero-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

.stat-item {
  text-align: center;
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-number {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-accent);
  margin-bottom: var(--spacing-xs);
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  min-width: 240px;
  transition: all 0.15s ease;
}

.search-box:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.search-box svg {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: none;
  outline: none;
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
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

.doc-icon.is-directory {
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  color: white;
}

.doc-card:hover .doc-icon {
  transform: scale(1.05);
}

.doc-card:hover .doc-icon:not(.is-directory) {
  background-color: var(--color-accent);
  color: white;
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
  margin: 0 0 var(--spacing-sm) 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  background-color: var(--color-background);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
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
  
  .hero-stats {
    gap: var(--spacing-lg);
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .docs-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .hero-stats {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
  }
  
  .stat-number {
    font-size: 1.75rem;
    margin-bottom: 0;
  }
}
</style>
