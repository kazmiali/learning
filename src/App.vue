<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <nav class="main-nav">
          <router-link to="/" class="nav-brand">
            <div class="brand-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="brand-name">LEARNING<span class="brand-accent">NOTES</span></span>
          </router-link>
          <div class="nav-spacer"></div>
          <div class="nav-actions">
            <router-link to="/" class="nav-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>HOME</span>
            </router-link>
            <button @click="toggleTheme" class="theme-toggle" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
              <svg v-if="isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2.5"/>
                <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
    <main>
      <router-view />
    </main>
    <footer class="app-footer">
      <div class="container">
        <div class="footer-content">
          <p class="footer-text">BUILT WITH <span class="footer-heart">♥</span> FOR LEARNING</p>
          <div class="footer-decoration"></div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isDark = ref(false);

const defaultTitle = 'Documentation';
const defaultDescription = 'Documentation website with comprehensive guides and resources';

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    isDark.value = savedTheme === 'dark';
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
}

function toggleTheme() {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  applyTheme();
}

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
  initTheme();
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
  background-color: var(--color-surface);
  border-bottom: var(--border-brutal);
}

.main-nav {
  display: flex;
  align-items: center;
  height: 80px;
  gap: var(--spacing-lg);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-weight: 900;
  font-size: 1.25rem;
  color: var(--color-text-primary);
  text-decoration: none;
  transition: transform 0.15s ease;
}

.nav-brand:hover {
  text-decoration: none;
  transform: rotate(-1deg);
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-accent);
  border: var(--border-brutal);
  box-shadow: var(--shadow-brutal-sm);
  color: #1a1a1a;
}

.brand-name {
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.brand-accent {
  color: var(--color-accent);
}

.nav-spacer {
  flex-grow: 1;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface);
  border: var(--border-brutal-thin);
  box-shadow: var(--shadow-brutal-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.15s ease;
}

.nav-link:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-brutal);
  text-decoration: none;
  background-color: var(--color-yellow);
  color: #1a1a1a;
}

.nav-link:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.nav-link.router-link-exact-active {
  background-color: var(--color-accent);
  color: #1a1a1a;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: var(--color-surface);
  border: var(--border-brutal-thin);
  box-shadow: var(--shadow-brutal-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.theme-toggle:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-brutal);
  background-color: var(--color-purple);
  color: white;
}

.theme-toggle:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

/* Footer */
.app-footer {
  background-color: var(--color-surface);
  border-top: var(--border-brutal);
  padding: var(--spacing-xl) 0;
  margin-top: auto;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.footer-text {
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  margin: 0;
}

.footer-heart {
  color: var(--color-accent);
}

.footer-decoration {
  flex: 1;
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    var(--color-border) 0px,
    var(--color-border) 8px,
    transparent 8px,
    transparent 16px
  );
  max-width: 200px;
}

@media (max-width: 640px) {
  .main-nav {
    height: 70px;
    gap: var(--spacing-sm);
  }
  
  .brand-name {
    display: none;
  }
  
  .nav-link span {
    display: none;
  }
  
  .nav-link {
    padding: var(--spacing-sm);
  }
  
  .footer-decoration {
    display: none;
  }
}
</style>
