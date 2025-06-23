import { createRouter, createWebHistory } from '@ionic/vue-router';
import Dashboard from '../views/dashboard.vue';
import Map from '../views/map.vue';
import Search from '../views/search.vue';

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    component: Dashboard
  },
  {
    path: '/map',
    component: Map
  },
  {
    path: '/search',
    component: Search
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
