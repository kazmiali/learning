<template>
  <div class="doc-view">
    <nav class="breadcrumbs" v-if="breadcrumbs.length > 0">
      <router-link to="/" class="breadcrumb-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>HOME</span>
      </router-link>
      <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
        <svg class="separator" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="9 18 15 12 9 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
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
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="directory-info">
            <h1 class="directory-title">{{ formatName(item.name) }}</h1>
            <p class="directory-subtitle">{{ sortedChildren.length }} {{ sortedChildren.length === 1 ? 'ITEM' : 'ITEMS' }}</p>
          </div>
        </div>
        
        <div class="file-list">
          <router-link 
            v-for="(child, index) in sortedChildren" 
            :key="child.name" 
            :to="`${$route.path}/${child.name}`" 
            class="file-item"
            :class="getFileColorClass(index)"
          >
            <div class="file-item-stripe"></div>
            <div class="file-item-content">
              <div class="file-item-icon">
                <svg v-if="child.type === 'directory'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="file-name">{{ formatName(child.name) }}</span>
              <span class="file-type">{{ child.type === 'directory' ? 'FOLDER' : 'DOC' }}</span>
              <svg class="file-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="9 18 15 12 9 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
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
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1>PAGE NOT FOUND</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <router-link to="/" class="back-home-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="12 19 5 12 12 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>BACK TO HOME</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import docs from '../docs.json';

// Configure marked to use highlight.js via marked-highlight
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('Highlight error:', err);
      }
    }
    // Auto-detect language if not specified
    try {
      return hljs.highlightAuto(code).value;
    } catch (err) {
      console.error('Highlight auto error:', err);
    }
    return code;
  }
}));

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

function getFileColorClass(index: number): string {
  const colors = ['file-orange', 'file-purple', 'file-cyan', 'file-pink', 'file-lime', 'file-yellow'];
  return colors[index % colors.length];
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
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal-sm);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 700;
  padding: var(--spacing-xs) var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.15s ease;
  border: 2px solid transparent;
}

.breadcrumb-item:hover {
  color: var(--color-text-primary);
  background-color: var(--color-yellow);
  border-color: var(--color-border);
  text-decoration: none;
}

.separator {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.breadcrumb-current {
  color: var(--color-text-primary);
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: var(--color-accent);
  color: #1a1a1a;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.content-wrapper {
  margin: 0 auto;
}

/* Directory View */
.directory-view {
  background-color: var(--color-surface);
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal);
  padding: var(--spacing-2xl);
}

.directory-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: var(--border-brutal);
}

.directory-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: var(--color-accent);
  color: #1a1a1a;
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal-sm);
  flex-shrink: 0;
}

.directory-info {
  flex: 1;
}

.directory-title {
  font-size: 2rem;
  font-weight: 900;
  margin: 0 0 var(--spacing-xs) 0;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.directory-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  margin: 0;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.file-list {
  display: grid;
  gap: var(--spacing-md);
}

.file-item {
  display: flex;
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
  background-color: var(--color-background);
  border: var(--border-brutal-thin);
  box-shadow: var(--shadow-brutal-sm);
  overflow: hidden;
}

.file-item:hover {
  transform: translate(-3px, -3px);
  box-shadow: var(--shadow-brutal);
  text-decoration: none;
}

.file-item:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.file-item-stripe {
  width: 6px;
  flex-shrink: 0;
}

.file-orange .file-item-stripe { background-color: var(--color-accent); }
.file-purple .file-item-stripe { background-color: var(--color-purple); }
.file-cyan .file-item-stripe { background-color: var(--color-cyan); }
.file-pink .file-item-stripe { background-color: var(--color-pink); }
.file-lime .file-item-stripe { background-color: var(--color-lime); }
.file-yellow .file-item-stripe { background-color: var(--color-yellow); }

.file-item-content {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  gap: var(--spacing-md);
  flex: 1;
}

.file-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--color-surface);
  border: var(--border-brutal-thin);
  color: var(--color-text-primary);
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.file-item:hover .file-item-icon {
  transform: rotate(-3deg);
}

.file-name {
  flex: 1;
  font-weight: 700;
  color: var(--color-text-primary);
  font-size: 0.9375rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.file-type {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--color-text-tertiary);
  background-color: var(--color-surface);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 2px solid var(--color-border);
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal);
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
  border-bottom: var(--border-brutal-thin);
  color: var(--color-text-primary);
  font-weight: 900;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.markdown-content :deep(h1) {
  font-size: 2.25rem;
  border-bottom-width: 3px;
}

.markdown-content :deep(h2) {
  font-size: 1.875rem;
}

.markdown-content :deep(h3) {
  font-size: 1.5rem;
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
  font-weight: 700;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  transition: all 0.15s ease;
}

.markdown-content :deep(a:hover) {
  color: var(--color-accent-hover);
  background-color: var(--color-accent-light);
}

.markdown-content :deep(code) {
  background-color: var(--hljs-bg, #1a1a1a);
  color: var(--hljs-keyword, #ff79c6);
  padding: 0.2em 0.5em;
  font-size: 0.875em;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'JetBrains Mono', monospace;
  font-weight: 500;
  border: 2px solid var(--color-border);
  border-radius: 0;
}

.markdown-content :deep(pre) {
  background-color: var(--hljs-bg, #1a1a1a);
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal-sm);
  padding: 0;
  margin: 1.5em 0;
  overflow-x: auto;
  position: relative;
}

/* Language label for code blocks */
.markdown-content :deep(pre)::before {
  content: '';
  display: block;
  height: 6px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-purple), var(--color-cyan));
}

.markdown-content :deep(pre code) {
  display: block;
  background: var(--hljs-bg, #1a1a1a) !important;
  color: var(--hljs-fg, #f8f8f2);
  padding: var(--spacing-lg);
  border: none;
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 1.7;
}

.markdown-content :deep(pre code.hljs) {
  padding: var(--spacing-lg);
}

.markdown-content :deep(blockquote) {
  border-left: 6px solid var(--color-accent);
  margin: 1.5em 0;
  padding: 1em 1.5em;
  color: var(--color-text-secondary);
  background-color: var(--color-accent-light);
  font-weight: 500;
  border: var(--border-brutal-thin);
  border-left: 6px solid var(--color-accent);
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.75em;
  margin-bottom: 1.5em;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5em;
  font-weight: 500;
}

.markdown-content :deep(li::marker) {
  color: var(--color-accent);
  font-weight: 800;
}

.markdown-content :deep(strong) {
  font-weight: 800;
  color: var(--color-text-primary);
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal-sm);
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: var(--spacing-md);
  text-align: left;
  border: 2px solid var(--color-border);
}

.markdown-content :deep(th) {
  background-color: var(--color-accent);
  color: #1a1a1a;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
}

.markdown-content :deep(tr:nth-child(even)) {
  background-color: var(--color-background);
}

/* Not Found View */
.not-found {
  text-align: center;
  padding: var(--spacing-3xl);
  background-color: var(--color-surface);
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal);
}

.not-found-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  margin-bottom: var(--spacing-lg);
  color: var(--color-danger);
  background-color: var(--color-background);
  border: var(--border-brutal);
}

.not-found h1 {
  font-size: 2rem;
  font-weight: 900;
  margin-bottom: var(--spacing-sm);
  text-transform: uppercase;
}

.not-found p {
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-xl);
  font-size: 1rem;
  font-weight: 500;
}

.back-home-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 800;
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--color-accent);
  color: #1a1a1a;
  text-decoration: none;
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.15s ease;
}

.back-home-btn:hover {
  transform: translate(-3px, -3px);
  box-shadow: var(--shadow-brutal-lg);
  text-decoration: none;
}

.back-home-btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
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
  
  .directory-title {
    font-size: 1.5rem;
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
  
  .file-item-content {
    flex-wrap: wrap;
  }
  
  .file-name {
    flex: 1 1 100%;
    order: 1;
  }
  
  .file-item-icon {
    order: 0;
  }
  
  .file-type {
    order: 2;
  }
  
  .file-arrow {
    order: 3;
  }
}
</style>
