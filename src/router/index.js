import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('../layout/index.vue'),
    // 如果有子页面可以放在 children 里面
  },
  {
    path: '/filePreview/:file_id',
    component: () => import('../components/FilePreviewPanel/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
