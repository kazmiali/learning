<template>
  <div>
    <h1>Documentation Topics</h1>
    <div v-if="docs && docs.children && docs.children.length > 0">
      <ul>
        <li v-for="item in docs.children" :key="item.name">
          <router-link :to="`/${item.name}`">{{ item.name }}</router-link>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>No documentation found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import docs from '../docs.json';

const docsData = ref(docs);

onMounted(() => {
  console.log('HomeView mounted with docs:', docs);
});
</script>
