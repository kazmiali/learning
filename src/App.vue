<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <nav class="main-nav">
          <router-link to="/" class="nav-brand">
            <div class="brand-logo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="brand-name">Learning Notes</span>
          </router-link>
          <div class="nav-spacer"></div>
          <router-link to="/" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Home</span>
          </router-link>
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
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.main-nav {
  display: flex;
  align-items: center;
  height: 72px;
  gap: var(--spacing-lg);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--color-text-primary);
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.nav-brand:hover {
  text-decoration: none;
  opacity: 0.8;
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  border-radius: var(--radius-md);
  color: white;
  box-shadow: var(--shadow-sm);
}

.brand-name {
  letter-spacing: -0.02em;
}

.nav-spacer {
  flex-grow: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 500;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--color-accent);
  text-decoration: none;
  box-shadow: var(--shadow-inset);
}

.nav-link.router-link-exact-active {
  color: var(--color-accent);
  font-weight: 600;
  box-shadow: var(--shadow-inset);
}

.nav-link svg {
  transition: transform 0.15s ease;
}

.nav-link:hover svg {
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .main-nav {
    height: 64px;
  }
  
  .brand-name {
    display: none;
  }
  
  .nav-link span {
    display: none;
  }
}
</style>
