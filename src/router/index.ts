import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import DocView from '../views/DocView.vue';

const isProduction = import.meta.env.MODE === 'production';
const routerBase = isProduction ? '/learning/' : '/';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: {
      title: 'Home',
      description: 'Explore our comprehensive documentation library'
    }
  },
  {
    path: '/:path(.*)*',
    name: 'Doc',
    component: DocView,
    meta: {
      title: 'Documentation',
      description: 'View documentation content'
    }
  },
];

const router = createRouter({
  history: createWebHistory(routerBase),
  routes,
});

export default router;
