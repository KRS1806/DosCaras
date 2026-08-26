import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'
import PublicationFormView from '@/views/PublicationFormView.vue'
import SearchResultsView from '@/views/SearchResultsView.vue'
import ProfileView from '@/views/ProfileView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresRole?: 'superadmin'
    guestOnly?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/activate/:token',
      name: 'activate',
      component: () => import('@/views/ActivateView.vue'),
    },
    {
      path: '/categories/:id',
      name: 'category-detail',
      // TODO: reemplazar en plan 04
      component: PlaceholderView,
      props: { titulo: 'Página de categoría' },
    },
    {
      path: '/views/:id',
      name: 'view-detail',
      // TODO: reemplazar en plan 02
      component: PlaceholderView,
      props: { titulo: 'Detalle de publicación' },
    },
    {
      path: '/views/new',
      name: 'view-create',
      component: PublicationFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/views/:id/edit',
      name: 'view-edit',
      component: PublicationFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/search',
      name: 'search',
      component: SearchResultsView,
    },
    {
      path: '/authors/:id',
      name: 'author-profile',
      // TODO: reemplazar en plan 07
      component: PlaceholderView,
      props: { titulo: 'Perfil público de autor' },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      // TODO: reemplazar en plan 08
      component: PlaceholderView,
      props: { titulo: 'Panel superadmin: gestión de usuarios' },
      meta: { requiresAuth: true, requiresRole: 'superadmin' },
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      // TODO: reemplazar en plan 09
      component: PlaceholderView,
      props: { titulo: 'Panel superadmin: gestión de categorías' },
      meta: { requiresAuth: true, requiresRole: 'superadmin' },
    },
    {
      path: '/admin/moderation',
      name: 'admin-moderation',
      // TODO: reemplazar en plan 10
      component: PlaceholderView,
      props: { titulo: 'Panel superadmin: moderación de contenido' },
      meta: { requiresAuth: true, requiresRole: 'superadmin' },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/ForbiddenView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.guestOnly && auth.estaAutenticado) {
    return { path: '/' }
  }

  if (to.meta.requiresAuth && !auth.estaAutenticado) {
    return { path: '/login' }
  }

  if (to.meta.requiresRole === 'superadmin' && !auth.esSuperadmin) {
    return { path: '/403' }
  }

  return true
})

export default router
