<template>
  <div>
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs" v-if="breadcrumbs.length > 0">
      <router-link to="/">Home</router-link>
      <span v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
        <span class="separator">/</span>
        <router-link v-if="index < breadcrumbs.length - 1" :to="crumb.path">{{ crumb.name }}</router-link>
        <span v-else class="current">{{ crumb.name }}</span>
      </span>
    </nav>

    <!-- Content -->
    <div v-if="item">
      <div v-if="item.type === 'directory'" class="directory-view">
        <h1>{{ item.name }}</h1>
        <div class="file-list">
          <div v-for="child in sortedChildren" :key="child.name" class="file-item">
            <router-link :to="`${$route.path}/${child.name}`" class="file-link">
              <span class="file-icon">{{ child.type === 'directory' ? '📁' : '📄' }}</span>
              <span class="file-name">{{ child.name }}</span>
            </router-link>
          </div>
        </div>
      </div>
      
      <div v-else-if="item.type === 'file'" class="file-view">
        <div class="markdown-content" v-html="markdownContent"></div>
      </div>
    </div>
    
    <div v-else class="not-found">
      <h1>Not Found</h1>
      <p>The requested file or directory could not be found.</p>
      <router-link to="/" class="back-home">← Back to Home</router-link>
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
      const response = await fetch(`/docs/${pathSegments.join('/')}`);
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
.breadcrumbs {
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  background-color: var(--neomorph-bg);
  box-shadow: inset 4px 4px 8px var(--neomorph-shadow-dark),
              inset -4px -4px 8px var(--neomorph-shadow-light);
  border-radius: 16px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.breadcrumbs a {
  color: var(--neomorph-accent);
  text-decoration: none;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: var(--neomorph-bg);
  box-shadow: 3px 3px 6px var(--neomorph-shadow-dark),
              -3px -3px 6px var(--neomorph-shadow-light);
}

.breadcrumbs a:hover {
  box-shadow: inset 2px 2px 4px var(--neomorph-shadow-dark),
              inset -2px -2px 4px var(--neomorph-shadow-light);
}

.separator {
  color: var(--neomorph-text-muted);
  font-weight: 600;
}

.current {
  color: var(--neomorph-text);
  font-weight: 600;
  padding: 0.4rem 0.8rem;
}

.directory-view {
  background-color: var(--neomorph-bg);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 8px 8px 16px var(--neomorph-shadow-dark),
              -8px -8px 16px var(--neomorph-shadow-light);
}

.file-list {
  display: grid;
  gap: 1rem;
}

.file-item {
  border-radius: 16px;
  overflow: hidden;
}

.file-link {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  text-decoration: none;
  color: var(--neomorph-text);
  transition: all 0.3s ease;
  background-color: var(--neomorph-bg);
  box-shadow: 6px 6px 12px var(--neomorph-shadow-dark),
              -6px -6px 12px var(--neomorph-shadow-light);
  gap: 1rem;
}

.file-link:hover {
  box-shadow: 3px 3px 6px var(--neomorph-shadow-dark),
              -3px -3px 6px var(--neomorph-shadow-light);
  transform: translateX(8px);
}

.file-icon {
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background-color: var(--neomorph-bg);
  box-shadow: inset 3px 3px 6px var(--neomorph-shadow-dark),
              inset -3px -3px 6px var(--neomorph-shadow-light);
}

.file-name {
  font-weight: 600;
  font-size: 1.1rem;
  flex: 1;
}

.file-view {
  background-color: var(--neomorph-bg);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 8px 8px 16px var(--neomorph-shadow-dark),
              -8px -8px 16px var(--neomorph-shadow-light);
}

.markdown-content {
  line-height: 1.8;
  color: var(--neomorph-text);
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: var(--neomorph-text);
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
  font-weight: 600;
}

.markdown-content :deep(h1) {
  font-size: 2.2rem;
  padding-bottom: 0.75rem;
  border-bottom: 3px solid var(--neomorph-accent);
  background: linear-gradient(135deg, var(--neomorph-accent), #6ab0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.markdown-content :deep(h2) {
  font-size: 1.8rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--neomorph-accent-light);
}

.markdown-content :deep(h3) {
  font-size: 1.5rem;
}

.markdown-content :deep(p) {
  margin-bottom: 1.25rem;
}

.markdown-content :deep(a) {
  color: var(--neomorph-accent);
  text-decoration: none;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.markdown-content :deep(a:hover) {
  background-color: var(--neomorph-accent-light);
  box-shadow: inset 2px 2px 4px var(--neomorph-shadow-dark),
              inset -2px -2px 4px var(--neomorph-shadow-light);
}

.markdown-content :deep(code) {
  background-color: var(--neomorph-bg);
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  color: var(--neomorph-accent);
  box-shadow: inset 2px 2px 4px var(--neomorph-shadow-dark),
              inset -2px -2px 4px var(--neomorph-shadow-light);
}

.markdown-content :deep(pre) {
  background-color: var(--neomorph-bg);
  border-radius: 16px;
  padding: 1.5rem;
  overflow-x: auto;
  box-shadow: inset 4px 4px 8px var(--neomorph-shadow-dark),
              inset -4px -4px 8px var(--neomorph-shadow-light);
  margin: 1.5rem 0;
}

.markdown-content :deep(pre code) {
  background: none;
  box-shadow: none;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--neomorph-accent);
  margin: 1.5rem 0;
  padding: 1rem 1.5rem;
  color: var(--neomorph-text-muted);
  background-color: var(--neomorph-bg);
  border-radius: 0 12px 12px 0;
  box-shadow: inset 4px 4px 8px var(--neomorph-shadow-dark),
              inset -4px -4px 8px var(--neomorph-shadow-light);
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 4px 4px 8px var(--neomorph-shadow-dark),
              -4px -4px 8px var(--neomorph-shadow-light);
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 1rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--neomorph-shadow-dark);
}

.markdown-content :deep(th) {
  background: linear-gradient(135deg, var(--neomorph-accent), #6ab0ff);
  color: white;
  font-weight: 600;
}

.markdown-content :deep(tr:last-child td) {
  border-bottom: none;
}

.markdown-content :deep(img) {
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 6px 6px 12px var(--neomorph-shadow-dark),
              -6px -6px 12px var(--neomorph-shadow-light);
  margin: 1.5rem 0;
}

.not-found {
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--neomorph-bg);
  border-radius: 20px;
  box-shadow: 8px 8px 16px var(--neomorph-shadow-dark),
              -8px -8px 16px var(--neomorph-shadow-light);
}

.not-found h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--neomorph-accent), #6ab0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.not-found p {
  color: var(--neomorph-text-muted);
  margin-bottom: 2rem;
  font-size: 1.2rem;
}

.back-home {
  display: inline-block;
  padding: 1rem 2rem;
  color: var(--neomorph-accent);
  text-decoration: none;
  font-weight: 600;
  background-color: var(--neomorph-bg);
  box-shadow: 6px 6px 12px var(--neomorph-shadow-dark),
              -6px -6px 12px var(--neomorph-shadow-light);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.back-home:hover {
  box-shadow: 3px 3px 6px var(--neomorph-shadow-dark),
              -3px -3px 6px var(--neomorph-shadow-light);
  transform: translateY(-2px);
}
</style>
