<template>
  <div class="doc-view">
    <nav class="breadcrumbs" v-if="breadcrumbs.length > 0">
      <router-link to="/">Home</router-link>
      <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
        <span class="separator">/</span>
        <router-link v-if="index < breadcrumbs.length - 1" :to="crumb.path">{{ crumb.name }}</router-link>
        <span v-else class="current">{{ crumb.name }}</span>
      </template>
    </nav>

    <div v-if="item" class="content-wrapper">
      <div v-if="item.type === 'directory'" class="directory-view card">
        <h1 class="directory-title">{{ item.name }}</h1>
        <div class="file-list">
          <router-link v-for="child in sortedChildren" :key="child.name" :to="`${$route.path}/${child.name}`" class="file-item">
            <span class="file-icon">{{ child.type === 'directory' ? '📁' : '📄' }}</span>
            <span class="file-name">{{ child.name }}</span>
            <span class="file-arrow">→</span>
          </router-link>
        </div>
      </div>
      
      <div v-else-if="item.type === 'file'" class="file-view card">
        <div class="markdown-content" v-html="markdownContent"></div>
      </div>
    </div>
    
    <div v-else class="not-found card">
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <router-link to="/" class="back-home-link">← Back to Home</router-link>
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
.card {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-xl);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  font-size: 0.95rem;
}

.breadcrumbs a {
  color: var(--color-text-muted);
}

.breadcrumbs a:hover {
  color: var(--color-primary);
  text-decoration: none;
}

.separator {
  color: var(--color-text-muted);
}

.current {
  color: var(--color-text-heading);
  font-weight: 500;
}

.content-wrapper {
  margin: 0 auto;
}

/* Directory View */
.directory-title {
  margin-bottom: var(--spacing-lg);
  font-size: 2rem;
}

.file-list {
  display: grid;
  gap: var(--spacing-sm);
}

.file-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  gap: var(--spacing-md);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--color-text-body);
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background-color: var(--color-background-mute);
  text-decoration: none;
}

.file-icon {
  font-size: 1.5rem;
  color: var(--color-text-muted);
}

.file-name {
  flex: 1;
  font-weight: 500;
  color: var(--color-text-heading);
}

.file-arrow {
  font-size: 1.25rem;
  color: var(--color-text-muted);
  transition: transform 0.2s ease;
}

.file-item:hover .file-arrow {
  transform: translateX(4px);
}

/* File View (Markdown) */
.markdown-content {
  line-height: 1.7;
  font-size: 1.1rem;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 2em;
  margin-bottom: 0.8em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--color-border);
}

.markdown-content :deep(p) {
  margin-bottom: 1.25em;
}

.markdown-content :deep(a) {
  font-weight: 500;
  text-decoration: underline;
  text-decoration-color: var(--color-primary-light);
}

.markdown-content :deep(code) {
  background-color: var(--color-primary-light);
  color: var(--color-text-heading);
  padding: 0.2em 0.4em;
  border-radius: var(--spacing-xs);
  font-size: 0.9em;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
}

.markdown-content :deep(pre) {
  background-color: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin: 1.5em 0;
  overflow-x: auto;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  border: none;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--color-border);
  margin: 1.5em 0;
  padding: 1em 1.5em;
  color: var(--color-text-muted);
  background-color: var(--color-background-mute);
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.5em;
  margin-bottom: 1.25em;
}

/* Not Found View */
.not-found {
  text-align: center;
  padding: var(--spacing-xxl);
}

.not-found h1 {
  font-size: 2rem;
}

.not-found p {
  color: var(--color-text-muted);
  margin-top: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.back-home-link {
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  background-color: var(--color-primary);
  color: var(--color-background);
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.back-home-link:hover {
  background-color: var(--color-primary-hover);
  text-decoration: none;
}
</style>
