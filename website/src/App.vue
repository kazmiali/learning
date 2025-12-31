<template>
  <div id="app">
    <header class="neomorph-header">
      <nav>
        <router-link to="/" class="nav-brand neomorph-brand">
          <span class="brand-icon">📚</span>
          <span>Documentation</span>
        </router-link>
        <div class="nav-spacer"></div>
        <router-link to="/" class="neomorph-nav-link">Home</router-link>
      </nav>
    </header>
    <main class="neomorph-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style>
body {
  background-color: var(--neomorph-bg);
}

#app {
  color: var(--neomorph-text);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.neomorph-header {
  background-color: var(--neomorph-bg);
  box-shadow: 0 4px 8px var(--neomorph-shadow-dark),
              0 -4px 8px var(--neomorph-shadow-light);
}

nav {
  display: flex;
  align-items: center;
  height: 70px;
  max-width: 1400px;
  margin: 0 auto;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.3rem;
  color: var(--neomorph-text);
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.neomorph-brand {
  background-color: var(--neomorph-bg);
  box-shadow: 5px 5px 10px var(--neomorph-shadow-dark),
              -5px -5px 10px var(--neomorph-shadow-light);
}

.neomorph-brand:hover {
  box-shadow: 3px 3px 6px var(--neomorph-shadow-dark),
              -3px -3px 6px var(--neomorph-shadow-light);
  transform: translateY(-2px);
}

.brand-icon {
  font-size: 1.5rem;
}

.nav-spacer {
  flex-grow: 1;
}

.neomorph-nav-link {
  font-weight: 500;
  color: var(--neomorph-text);
  text-decoration: none;
  padding: 12px 28px;
  border-radius: 12px;
  transition: all 0.3s ease;
  background-color: var(--neomorph-bg);
  box-shadow: 5px 5px 10px var(--neomorph-shadow-dark),
              -5px -5px 10px var(--neomorph-shadow-light);
}

.neomorph-nav-link:hover {
  box-shadow: 3px 3px 6px var(--neomorph-shadow-dark),
              -3px -3px 6px var(--neomorph-shadow-light);
  color: var(--neomorph-accent);
  transform: translateY(-2px);
}

.neomorph-nav-link.router-link-exact-active {
  box-shadow: inset 3px 3px 6px var(--neomorph-shadow-dark),
              inset -3px -3px 6px var(--neomorph-shadow-light);
  color: var(--neomorph-accent);
  font-weight: 600;
}

main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  flex: 1;
  width: 100%;
}

h1 {
  color: var(--neomorph-text);
  border-bottom: none;
  background: linear-gradient(135deg, var(--neomorph-accent), #6ab0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2rem;
  padding-bottom: 0.5rem;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  margin-bottom: 1rem;
}

li a {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: var(--neomorph-text);
  text-decoration: none;
  border-radius: 16px;
  transition: all 0.3s ease;
  background-color: var(--neomorph-bg);
  box-shadow: 6px 6px 12px var(--neomorph-shadow-dark),
              -6px -6px 12px var(--neomorph-shadow-light);
  font-weight: 500;
}

li a:hover {
  box-shadow: 3px 3px 6px var(--neomorph-shadow-dark),
              -3px -3px 6px var(--neomorph-shadow-light);
  color: var(--neomorph-accent);
  transform: translateX(8px);
}
</style>
