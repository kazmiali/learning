<template>
  <div class="doc-view">
    <nav class="breadcrumbs" v-if="breadcrumbs.length > 0">
      <router-link to="/" class="breadcrumb-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Home</span>
      </router-link>
      <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
        <svg class="separator" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="9 18 15 12 9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <router-link v-if="index < breadcrumbs.length - 1" :to="crumb.path" class="breadcrumb-item">
          {{ formatName(crumb.name) }}
        </router-link>
        <span v-else class="breadcrumb-current">{{ formatName(crumb.name) }}</span>
      </template>
    </nav>

    <div v-if="item" class="content-wrapper">
      <div v-if="item.type === 'directory'" class="directory-view">
        <div class="directory-header">
          <div class="directory-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 class="directory-title">{{ formatName(item.name) }}</h1>
            <p class="directory-subtitle">{{ sortedChildren.length }} {{ sortedChildren.length === 1 ? 'item' : 'items' }}</p>
          </div>
        </div>
        
        <div class="file-list">
          <router-link v-for="child in sortedChildren" :key="child.name" :to="`${$route.path}/${child.name}`" class="file-item">
            <div class="file-item-icon">
              <svg v-if="child.type === 'directory'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="file-name">{{ formatName(child.name) }}</span>
            <svg class="file-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="9 18 15 12 9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </router-link>
        </div>
      </div>
      
      <div v-else-if="item.type === 'file'" class="file-view">
        <div class="markdown-content" v-html="markdownContent"></div>
      </div>
    </div>
    
    <div v-else class="not-found">
      <div class="not-found-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <router-link to="/" class="back-home-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="12 19 5 12 12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Back to Home</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked';
import docs from '../docs.json';

const route = useRoute();
const item = ref<any>(null);
const markdownContent = ref('');

function formatName(name: string): string {
  return name
    .replace(/\.(md|markdown)$/i, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Compute breadcrumbs
const breadcrumbs = computed(() => {
  const pathSegments = Array.isArray(route.params.path) 
    ? route.params.path 
    : (route.params.path ? [route.params.path] : []);
  const crumbs = [];
  let currentPath = '';
  
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    crumbs.push({
      name: segment,
      path: currentPath
    });
  }
  
  return crumbs;
});

// Sort children: directories first, then files, both alphabetically
const sortedChildren = computed(() => {
  if (!item.value || !item.value.children) return [];
  
  return [...item.value.children].sort((a: any, b: any) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });
});

function findItem(path: string[], tree: any): any {
  let current = tree;
  for (const segment of path) {
    const child = current.children?.find((c: any) => c.name === segment);
    if (!child) {
      return null;
    }
    current = child;
  }
  return current;
}

async function updateContent() {
  const pathSegments = Array.isArray(route.params.path) 
    ? route.params.path 
    : (route.params.path ? [route.params.path] : []);
  
  item.value = findItem(pathSegments, docs);

  if (item.value && item.value.type === 'file') {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}docs/${pathSegments.join('/')}`);
      if (!response.ok) {
        throw new Error('File not found');
      }
      const markdown = await response.text();
      markdownContent.value = await marked.parse(markdown);
    } catch (error) {
      console.error('Error fetching markdown:', error);
      markdownContent.value = '<p>Error loading file</p>';
    }
  } else if (item.value && item.value.type === 'directory') {
    markdownContent.value = '';
  }
}

watch(() => route.params.path, updateContent, { immediate: true });
</script>

<style scoped>
.doc-view {
  max-width: 100%;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.breadcrumb-item:hover {
  color: var(--color-accent);
  background-color: var(--color-accent-light);
  text-decoration: none;
}

.separator {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.breadcrumb-current {
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 0.875rem;
}

.content-wrapper {
  margin: 0 auto;
}

/* Directory View */
.directory-view {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
}

.directory-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 2px solid var(--color-border);
}

.directory-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  color: white;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.directory-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 var(--spacing-xs) 0;
  letter-spacing: -0.02em;
}

.directory-subtitle {
  font-size: 0.9375rem;
  color: var(--color-text-tertiary);
  margin: 0;
  font-weight: 500;
}

.file-list {
  display: grid;
  gap: var(--spacing-xs);
}

.file-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  gap: var(--spacing-md);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.file-item:hover {
  background-color: var(--color-accent-light);
  border-color: var(--color-accent);
  text-decoration: none;
  transform: translateX(4px);
}

.file-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: var(--color-background);
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.file-item:hover .file-item-icon {
  background-color: var(--color-accent);
  color: white;
}

.file-name {
  flex: 1;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9375rem;
}

.file-arrow {
  color: var(--color-text-tertiary);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.file-item:hover .file-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--color-accent);
}

/* File View (Markdown) */
.file-view {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
}

.markdown-content {
  line-height: 1.8;
  font-size: 1.0625rem;
  color: var(--color-text-secondary);
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin-top: 2em;
  margin-bottom: 0.75em;
  padding-bottom: 0.5em;
  border-bottom: 2px solid var(--color-border);
  color: var(--color-text-primary);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.markdown-content :deep(h1) {
  font-size: 2.25rem;
}

.markdown-content :deep(h2) {
  font-size: 1.875rem;
}

.markdown-content :deep(h3) {
  font-size: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.markdown-content :deep(h4) {
  font-size: 1.25rem;
  border-bottom: none;
}

.markdown-content :deep(p) {
  margin-bottom: 1.5em;
  line-height: 1.8;
}

.markdown-content :deep(a) {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid var(--color-accent-subtle);
  transition: all 0.15s ease;
}

.markdown-content :deep(a:hover) {
  color: var(--color-accent-hover);
  border-bottom-color: var(--color-accent);
}

.markdown-content :deep(code) {
  background-color: var(--color-accent-light);
  color: var(--color-accent);
  padding: 0.2em 0.5em;
  border-radius: var(--radius-sm);
  font-size: 0.9em;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', 'Source Code Pro', monospace;
  font-weight: 500;
}

.markdown-content :deep(pre) {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin: 1.5em 0;
  overflow-x: auto;
  box-shadow: var(--shadow-sm);
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  border: none;
  color: var(--color-text-primary);
  font-weight: 400;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--color-accent);
  margin: 1.5em 0;
  padding: 1em 1.5em;
  color: var(--color-text-secondary);
  background-color: var(--color-accent-light);
  border-radius: var(--radius-sm);
  font-style: italic;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.75em;
  margin-bottom: 1.5em;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5em;
}

.markdown-content :deep(strong) {
  font-weight: 700;
  color: var(--color-text-primary);
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.markdown-content :deep(th) {
  background-color: var(--color-accent-light);
  color: var(--color-accent);
  font-weight: 700;
}

.markdown-content :deep(tr:last-child td) {
  border-bottom: none;
}

/* Not Found View */
.not-found {
  text-align: center;
  padding: var(--spacing-3xl);
  background-color: var(--color-surface);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.not-found-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

.not-found h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.not-found p {
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-xl);
  font-size: 1rem;
}

.back-home-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  background-color: var(--color-accent);
  color: white;
  text-decoration: none;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-sm);
}

.back-home-btn:hover {
  background-color: var(--color-accent-hover);
  text-decoration: none;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

@media (max-width: 768px) {
  .directory-view,
  .file-view {
    padding: var(--spacing-lg);
  }
  
  .directory-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .markdown-content {
    font-size: 1rem;
  }
  
  .markdown-content :deep(h1) {
    font-size: 1.75rem;
  }
  
  .markdown-content :deep(h2) {
    font-size: 1.5rem;
  }
  
  .markdown-content :deep(h3) {
    font-size: 1.25rem;
  }
}
</style>
