<template>
  <div class="home-view">
    <div class="hero-section">
      <div class="hero-decoration hero-decoration-1"></div>
      <div class="hero-decoration hero-decoration-2"></div>
      <div class="hero-badge">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>PERSONAL KNOWLEDGE BASE</span>
      </div>
      <h1 class="hero-title">MY LEARNING<br/><span class="title-accent">JOURNEY</span></h1>
      <p class="hero-subtitle">A curated collection of programming notes, concepts, and insights from my continuous learning adventure.</p>
      
      <div class="hero-stats">
        <div class="stat-item stat-orange">
          <div class="stat-number">{{ totalTopics }}</div>
          <div class="stat-label">TOPICS</div>
        </div>
        <div class="stat-item stat-purple">
          <div class="stat-number">{{ totalFiles }}</div>
          <div class="stat-label">DOCUMENTS</div>
        </div>
        <div class="stat-item stat-cyan">
          <div class="stat-number">{{ totalDepth }}</div>
          <div class="stat-label">CATEGORIES</div>
        </div>
      </div>
    </div>

    <div v-if="docs && docs.children && docs.children.length > 0" class="content-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-decoration"></span>
          TOPICS
        </h2>
        <div class="header-actions">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="SEARCH TOPICS..." 
              class="search-input"
            />
          </div>
          <div class="topic-count">{{ filteredTopics.length }} {{ filteredTopics.length === 1 ? 'TOPIC' : 'TOPICS' }}</div>
        </div>
      </div>
      
      <div class="docs-grid">
        <router-link 
          v-for="(item, index) in filteredTopics" 
          :key="item.name" 
          :to="`/${item.name}`" 
          class="doc-card"
          :class="getCardColorClass(index)"
        >
          <div class="card-stripe"></div>
          <div class="card-header">
            <div class="doc-icon">
              <svg v-if="item.type === 'directory'" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="card-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="12 5 19 12 12 19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="card-content">
            <h3 class="doc-name">{{ formatName(item.name) }}</h3>
            <p class="doc-type">{{ item.type === 'directory' ? 'COLLECTION' : 'DOCUMENT' }}</p>
            <div class="card-meta">
              <span class="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2.5"/>
                </svg>
                {{ item.type === 'directory' ? countFiles(item) + ' ITEMS' : '1 DOC' }}
              </span>
              <span class="meta-item" v-if="item.type === 'directory'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2.5"/>
                </svg>
                {{ countDepth(item) }} LEVELS
              </span>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2>NO NOTES YET</h2>
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

function getCardColorClass(index: number): string {
  const colors = ['card-orange', 'card-purple', 'card-cyan', 'card-pink', 'card-lime', 'card-yellow'];
  return colors[index % colors.length] as string;
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
  position: relative;
  text-align: center;
  padding: var(--spacing-3xl) 0 var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
}

.hero-decoration {
  position: absolute;
  width: 120px;
  height: 120px;
  border: var(--border-brutal);
  z-index: -1;
}

.hero-decoration-1 {
  top: 20px;
  left: 10%;
  background-color: var(--color-yellow);
  transform: rotate(12deg);
}

.hero-decoration-2 {
  bottom: 40px;
  right: 10%;
  background-color: var(--color-cyan);
  transform: rotate(-8deg);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.75rem;
  font-weight: 800;
  margin-bottom: var(--spacing-xl);
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.hero-title {
  font-size: 4rem;
  font-weight: 900;
  margin-bottom: var(--spacing-lg);
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: -0.03em;
}

.title-accent {
  color: var(--color-accent);
  display: inline-block;
  background-color: var(--color-accent);
  color: #1a1a1a;
  padding: 0 var(--spacing-md);
  transform: rotate(-1deg);
}

.hero-subtitle {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  font-weight: 500;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-2xl);
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  background-color: var(--color-surface);
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal);
  min-width: 140px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.stat-item:hover {
  transform: translate(-3px, -3px);
  box-shadow: var(--shadow-brutal-lg);
}

.stat-orange { border-top: 6px solid var(--color-accent); }
.stat-purple { border-top: 6px solid var(--color-purple); }
.stat-cyan { border-top: 6px solid var(--color-cyan); }

.stat-number {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
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
  border-bottom: var(--border-brutal);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0;
}

.title-decoration {
  width: 24px;
  height: 24px;
  background-color: var(--color-accent);
  border: var(--border-brutal-thin);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface);
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal-sm);
  min-width: 240px;
  transition: all 0.15s ease;
}

.search-box:focus-within {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-brutal);
}

.search-box svg {
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: none;
  outline: none;
  flex: 1;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.topic-count {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-text-primary);
  color: var(--color-background);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.doc-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  background-color: var(--color-surface);
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal);
  text-decoration: none;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
}

.doc-card:hover {
  transform: translate(-4px, -4px);
  box-shadow: var(--shadow-brutal-lg);
  text-decoration: none;
}

.doc-card:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.card-stripe {
  height: 8px;
  width: 100%;
}

.card-orange .card-stripe { background-color: var(--color-accent); }
.card-purple .card-stripe { background-color: var(--color-purple); }
.card-cyan .card-stripe { background-color: var(--color-cyan); }
.card-pink .card-stripe { background-color: var(--color-pink); }
.card-lime .card-stripe { background-color: var(--color-lime); }
.card-yellow .card-stripe { background-color: var(--color-yellow); }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  padding-bottom: 0;
}

.doc-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background-color: var(--color-background);
  color: var(--color-text-primary);
  border: var(--border-brutal-thin);
  transition: all 0.15s ease;
}

.doc-card:hover .doc-icon {
  transform: rotate(-3deg);
}

.card-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--color-text-tertiary);
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.15s ease;
}

.doc-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--color-accent);
}

.card-content {
  padding: var(--spacing-lg);
  flex: 1;
}

.doc-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}

.doc-type {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-tertiary);
  margin: 0 0 var(--spacing-md) 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  background-color: var(--color-background);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 2px solid var(--color-border);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background-color: var(--color-surface);
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal);
  margin-top: var(--spacing-2xl);
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-tertiary);
  background-color: var(--color-background);
  border: var(--border-brutal);
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: var(--spacing-sm);
  text-transform: uppercase;
}

.empty-state p {
  color: var(--color-text-tertiary);
  font-size: 1rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .hero-decoration {
    width: 60px;
    height: 60px;
  }
  
  .hero-stats {
    gap: var(--spacing-md);
  }
  
  .stat-item {
    min-width: 120px;
    padding: var(--spacing-md);
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .docs-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
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
    align-items: center;
  }
  
  .stat-item {
    width: 100%;
    max-width: 200px;
  }
  
  .hero-decoration {
    display: none;
  }
}
</style>
