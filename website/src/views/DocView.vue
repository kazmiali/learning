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
      markdownContent.value = marked(markdown);
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
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  font-size: 0.9rem;
}

.breadcrumbs a {
  color: #42b983;
  text-decoration: none;
}

.breadcrumbs a:hover {
  text-decoration: underline;
}

.separator {
  margin: 0 0.5rem;
  color: #6c757d;
}

.current {
  color: #2c3e50;
  font-weight: 500;
}

.directory-view {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.file-list {
  display: grid;
  gap: 0.5rem;
}

.file-item {
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  overflow: hidden;
}

.file-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #2c3e50;
  transition: background-color 0.2s;
}

.file-link:hover {
  background-color: #f8f9fa;
}

.file-icon {
  margin-right: 0.75rem;
  font-size: 1.2rem;
}

.file-name {
  font-weight: 500;
}

.file-view {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: #2c3e50;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.markdown-content :deep(h1) {
  border-bottom: 2px solid #42b983;
  padding-bottom: 0.5rem;
}

.markdown-content :deep(code) {
  background-color: #f1f3f4;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background-color: #f8f9fa;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #42b983;
  margin: 1rem 0;
  padding-left: 1rem;
  color: #6c757d;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #e1e5e9;
  padding: 0.5rem 1rem;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f8f9fa;
  font-weight: 600;
}

.not-found {
  text-align: center;
  padding: 3rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.back-home {
  display: inline-block;
  margin-top: 1rem;
  color: #42b983;
  text-decoration: none;
  font-weight: 500;
}

.back-home:hover {
  text-decoration: underline;
}
</style>
