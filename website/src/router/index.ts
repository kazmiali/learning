import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DocView from '../views/DocView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/:path(.*)*',
    name: 'Doc',
    component: DocView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
