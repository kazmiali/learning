<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <nav class="main-nav">
          <router-link to="/" class="nav-brand">
            <span class="brand-icon">📚</span>
            <span class="brand-name">Documentation</span>
          </router-link>
          <div class="nav-spacer"></div>
          <router-link to="/" class="nav-link">Home</router-link>
        </nav>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const defaultTitle = 'Documentation';
const defaultDescription = 'Documentation website with comprehensive guides and resources';

function updatePageMeta(title: string, description?: string) {
  document.title = title ? `${title} | Documentation` : defaultTitle;
  
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description || defaultDescription);
  }
  
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', title || defaultTitle);
  }
  
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', description || defaultDescription);
  }
  
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', title || defaultTitle);
  }
  
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescription) {
    twitterDescription.setAttribute('content', description || defaultDescription);
  }
}

onMounted(() => {
  updatePageMeta(route.meta.title as string, route.meta.description as string);
});

watch(() => route.meta, (newMeta) => {
  updatePageMeta(newMeta.title as string, newMeta.description as string);
}, { deep: true });
</script>

<style>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
}

.main-nav {
  display: flex;
  align-items: center;
  height: 64px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-text-heading);
  text-decoration: none;
}

.nav-brand:hover {
  text-decoration: none;
  color: var(--color-primary);
}

.brand-icon {
  font-size: 1.5rem;
}

.nav-spacer {
  flex-grow: 1;
}

.nav-link {
  font-weight: 500;
  color: var(--color-text-body);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.nav-link:hover {
  background-color: var(--color-background-mute);
  color: var(--color-text-heading);
  text-decoration: none;
}

.nav-link.router-link-exact-active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}
</style>
