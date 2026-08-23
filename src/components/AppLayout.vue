<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CacheService } from '@/services/cacheService'
import { useAuthStore } from '@/stores/auth'
import { useFavoritosStore } from '@/stores/favoritos'
import { obtenerCategorias } from '@/services/categories'
import { obtenerHashtags } from '@/services/hashtags'
import type { Categoria, Hashtag } from '@/models'
import NotificationCenter from '@/components/NotificationCenter.vue'

const THEME_KEY = 'lasdoscaras_theme'
const DEBOUNCE_MS = 300

type Tema = 'light' | 'dark'

const router = useRouter()
const auth = useAuthStore()
const favoritos = useFavoritosStore()

function temaActual(): Tema {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

const tema = ref<Tema>(temaActual())

function alternarTema() {
  const siguiente: Tema = tema.value === 'dark' ? 'light' : 'dark'
  tema.value = siguiente
  document.documentElement.setAttribute('data-theme', siguiente)
  CacheService.set(THEME_KEY, siguiente)
}

function cerrarSesion() {
  auth.cerrarSesion()
  favoritos.recargarDesdeCache()
  router.push('/')
}

const categorias = ref<Categoria[]>([])
const categoriaSeleccionada = ref('')

async function cargarCategorias() {
  try {
    categorias.value = await obtenerCategorias()
  } catch {
    categorias.value = []
  }
}

function irACategoria(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  categoriaSeleccionada.value = ''
  if (id) {
    router.push(`/categories/${id}`)
  }
}

const hashtagsDisponibles = ref<Hashtag[]>([])

async function cargarHashtags() {
  try {
    hashtagsDisponibles.value = await obtenerHashtags()
  } catch {
    hashtagsDisponibles.value = []
  }
}

const terminoBusqueda = ref('')
const terminoDebounced = ref('')
let debounceId: ReturnType<typeof setTimeout> | undefined

watch(terminoBusqueda, (valor) => {
  if (debounceId) {
    clearTimeout(debounceId)
  }
  debounceId = setTimeout(() => {
    terminoDebounced.value = valor.trim()
  }, DEBOUNCE_MS)
})

const sugerencias = computed(() => {
  if (!terminoDebounced.value) {
    return []
  }
  const termino = terminoDebounced.value.toLowerCase()
  return hashtagsDisponibles.value.filter((tag) => tag.nombre.toLowerCase().includes(termino)).slice(0, 5)
})

function buscar() {
  const termino = terminoBusqueda.value.trim()
  if (!termino) {
    return
  }
  router.push({ path: '/search', query: { q: termino } })
}

function buscarSugerencia(nombre: string) {
  terminoBusqueda.value = nombre
  buscar()
}

onMounted(() => {
  cargarCategorias()
  cargarHashtags()
})
</script>

<template>
  <header class="app-navbar">
    <RouterLink to="/" class="brand">DosCaras</RouterLink>

    <select
      class="categories-select"
      aria-label="Categorías"
      :value="categoriaSeleccionada"
      @change="irACategoria"
    >
      <option value="">Categorías</option>
      <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
    </select>

    <div class="search-box">
      <input
        v-model="terminoBusqueda"
        type="search"
        class="search-box__input"
        placeholder="Buscar publicaciones…"
        aria-label="Buscar publicaciones"
        @keydown.enter="buscar"
      />
      <ul v-if="sugerencias.length" class="search-box__suggestions">
        <li v-for="tag in sugerencias" :key="tag.id">
          <button type="button" @click="buscarSugerencia(tag.nombre)">#{{ tag.nombre }}</button>
        </li>
      </ul>
    </div>

    <div class="app-navbar__actions">
      <button
        type="button"
        class="theme-toggle"
        :aria-label="tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
        @click="alternarTema"
      >
        {{ tema === 'dark' ? '☀️' : '🌙' }}
      </button>

      <template v-if="!auth.estaAutenticado">
        <RouterLink to="/login" class="nav-btn nav-btn--ghost">Iniciar sesión</RouterLink>
        <RouterLink to="/register" class="nav-btn nav-btn--solid">Registro</RouterLink>
      </template>
      <template v-else>
        <RouterLink to="/views/new" class="nav-btn nav-btn--ghost">Nueva publicación</RouterLink>
        <RouterLink to="/profile" class="nav-btn nav-btn--ghost">{{ auth.usuario?.nombre ?? 'Perfil' }}</RouterLink>
        <button type="button" class="nav-btn nav-btn--solid" @click="cerrarSesion">Salir</button>
      </template>
    </div>
  </header>

  <main class="app-content">
    <RouterView />
  </main>

  <NotificationCenter />
</template>

<style scoped>
.app-navbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.categories-select {
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.85rem;
}

.search-box {
  position: relative;
  flex: 1 1 220px;
  max-width: 340px;
}

.search-box__input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
}

.search-box__suggestions {
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  right: 0;
  z-index: 20;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  box-shadow: 0 12px 30px -15px rgba(0, 0, 0, 0.35);
}

.search-box__suggestions button {
  width: 100%;
  text-align: left;
  padding: 0.4rem 0.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
}

.search-box__suggestions button:hover {
  background: rgba(124, 58, 237, 0.12);
}

.brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-heading);
  text-decoration: none;
}

.app-navbar__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.theme-toggle {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.35rem 0.55rem;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.nav-btn {
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: 1.5px solid transparent;
}

.nav-btn--ghost {
  color: var(--color-text);
  border-color: var(--color-border);
  background: transparent;
}

.nav-btn--solid {
  color: white;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
}

.app-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem;
}
</style>
