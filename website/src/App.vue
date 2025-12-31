<template>
  <div id="app">
    <header>
      <nav>
        <router-link to="/" class="nav-brand">Documentation</router-link>
        <div class="nav-spacer"></div>
        <router-link to="/">Home</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8f9fa;
}

#app {
  color: #2c3e50;
}

header {
  background-color: white;
  border-bottom: 1px solid #e1e5e9;
  padding: 0 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

nav {
  display: flex;
  align-items: center;
  height: 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-brand {
  font-weight: 600;
  font-size: 1.2rem;
  color: #2c3e50;
  text-decoration: none;
}

.nav-spacer {
  flex-grow: 1;
}

nav a {
  font-weight: 500;
  color: #6c757d;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
}

nav a:hover {
  color: #2c3e50;
  background-color: #f8f9fa;
}

nav a.router-link-exact-active {
  color: #42b983;
  font-weight: 600;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  border-bottom: 2px solid #42b983;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  margin-bottom: 0.5rem;
}

li a {
  display: block;
  padding: 0.75rem 1rem;
  color: #2c3e50;
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.2s, transform 0.1s;
}

li a:hover {
  background-color: #e8f5e8;
  transform: translateX(4px);
}
</style>
