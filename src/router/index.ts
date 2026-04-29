import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/install',
    name: 'install',
    component: () => import('@/pages/InstallPage.vue'),
  },
  {
    path: '/migrate',
    name: 'migrate',
    component: () => import('@/pages/MigratePage.vue'),
  },
  {
    path: '/support',
    redirect: '/chat',
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('@/pages/SupportChatPage.vue'),
  },
  {
    path: '/monitor',
    name: 'monitor',
    component: () => import('@/pages/MonitorPage.vue'),
  },
  {
    path: '/feedback-admin',
    name: 'feedbackAdmin',
    component: () => import('@/pages/FeedbackAdminPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

export default router
