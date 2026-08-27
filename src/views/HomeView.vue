<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CacheService } from '@/services/cacheService'
import { obtenerCategorias } from '@/services/categories'
import { obtenerHashtags } from '@/services/hashtags'
import { obtenerVistas, type OrdenTablero } from '@/services/views'
import { extraerMensajeError } from '@/services/httpClient'
import type { Categoria, Hashtag, Publicacion } from '@/models'
import PublicationCard from '@/components/board/PublicationCard.vue'
import FilterPanel from '@/components/board/FilterPanel.vue'

const FILTERS_KEY = 'lasdoscaras_filters'
const LIMITE = 12

interface FiltrosTablero {
  categoria: string | null
  hashtags: string[]
  sort: OrdenTablero
}

const route = useRoute()
const router = useRouter()

function filtrosPorDefecto(): FiltrosTablero {
  return { categoria: null, hashtags: [], sort: 'recientes' }
}

function esOrdenValido(valor: unknown): valor is OrdenTablero {
  return valor === 'recientes' || valor === 'likes_a' || valor === 'likes_b'
}

function filtrosDesdeQuery(): FiltrosTablero | null {
  const { category, hashtag, sort } = route.query
  if (!category && !hashtag && !sort) {
    return null
  }
  return {
    categoria: typeof category === 'string' ? category : null,
    hashtags: typeof hashtag === 'string' && hashtag.length > 0 ? hashtag.split(',') : [],
    sort: esOrdenValido(sort) ? sort : 'recientes',
  }
}

const filtros = reactive<FiltrosTablero>(
  filtrosDesdeQuery() ?? CacheService.get<FiltrosTablero>(FILTERS_KEY) ?? filtrosPorDefecto(),
)

const categorias = ref<Categoria[]>([])
const hashtagsDisponibles = ref<Hashtag[]>([])

const publicaciones = ref<Publicacion[]>([])
const total = ref(0)
const pagina = ref(1)
const cargando = ref(false)
const mensajeError = ref('')

function sincronizarUrl() {
  const query: Record<string, string> = { sort: filtros.sort }
  if (filtros.categoria) {
    query.category = filtros.categoria
  }
  if (filtros.hashtags.length) {
    query.hashtag = filtros.hashtags.join(',')
  }
  router.replace({ query })
  CacheService.set(FILTERS_KEY, filtros)
}

async function cargarPublicaciones() {
  cargando.value = true
  mensajeError.value = ''
  try {
    const respuesta = await obtenerVistas({
      page: pagina.value,
      limit: LIMITE,
      category: filtros.categoria ?? undefined,
      hashtag: filtros.hashtags.length ? filtros.hashtags.join(',') : undefined,
      sort: filtros.sort,
    })
    publicaciones.value = respuesta.data
    total.value = respuesta.total
  } catch (error) {
    publicaciones.value = []
    total.value = 0
    mensajeError.value = extraerMensajeError(error, 'No se pudieron cargar las publicaciones.')
  } finally {
    cargando.value = false
  }
}

async function cargarCatalogos() {
  const [cats, tags] = await Promise.allSettled([obtenerCategorias(), obtenerHashtags()])
  if (cats.status === 'fulfilled') {
    categorias.value = cats.value
  }
  if (tags.status === 'fulfilled') {
    hashtagsDisponibles.value = tags.value
  }
}

function cambiarCategoria(categoria: string | null) {
  filtros.categoria = categoria
}

function agregarHashtag(hashtag: string) {
  filtros.hashtags = [hashtag]
}

function quitarHashtag(hashtag: string) {
  filtros.hashtags = filtros.hashtags.filter((tag) => tag !== hashtag)
}

function cambiarOrden(orden: OrdenTablero) {
  filtros.sort = orden
}

function irAPagina(nueva: number) {
  if (nueva < 1 || nueva > totalPaginas.value) {
    return
  }
  pagina.value = nueva
}

const totalPaginas = ref(1)
watch(total, () => {
  totalPaginas.value = Math.max(1, Math.ceil(total.value / LIMITE))
})

watch(
  filtros,
  () => {
    pagina.value = 1
    sincronizarUrl()
    cargarPublicaciones()
  },
  { deep: true },
)

watch(pagina, () => {
  cargarPublicaciones()
})

onMounted(() => {
  sincronizarUrl()
  cargarCatalogos()
  cargarPublicaciones()
})
</script>

<template>
  <div class="board">
    <FilterPanel
      class="board__filters"
      :categoria="filtros.categoria"
      :hashtags="filtros.hashtags"
      :orden="filtros.sort"
      :categorias="categorias"
      :hashtags-disponibles="hashtagsDisponibles"
      @cambiar-categoria="cambiarCategoria"
      @agregar-hashtag="agregarHashtag"
      @quitar-hashtag="quitarHashtag"
      @cambiar-orden="cambiarOrden"
    />

    <section class="board__resultados">
      <div v-if="cargando" class="board__skeleton-grid">
        <div v-for="n in LIMITE" :key="n" class="skeleton-card" />
      </div>

      <div v-else-if="mensajeError" class="board__estado">
        <p>{{ mensajeError }}</p>
        <button type="button" class="board__reintentar" @click="cargarPublicaciones">Reintentar</button>
      </div>

      <div v-else-if="publicaciones.length === 0" class="board__estado">
        <p>No se encontraron publicaciones con estos filtros.</p>
      </div>

      <template v-else>
        <div class="board__grid">
          <PublicationCard v-for="publicacion in publicaciones" :key="publicacion.id" :publicacion="publicacion" />
        </div>

        <nav v-if="totalPaginas > 1" class="board__paginacion" aria-label="Paginación de publicaciones">
          <button type="button" :disabled="pagina === 1" @click="irAPagina(pagina - 1)">Anterior</button>
          <span>Página {{ pagina }} de {{ totalPaginas }}</span>
          <button type="button" :disabled="pagina === totalPaginas" @click="irAPagina(pagina + 1)">Siguiente</button>
        </nav>
      </template>
    </section>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.5rem;
  align-items: flex-start;
}

.board__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.board__skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.skeleton-card {
  height: 220px;
  border-radius: 14px;
  background: linear-gradient(
    100deg,
    var(--color-background-soft) 30%,
    var(--color-background-mute) 50%,
    var(--color-background-soft) 70%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.4s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.board__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text);
  opacity: 0.85;
}

.board__reintentar {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.board__paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}

.board__paginacion button {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.board__paginacion button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .board {
    grid-template-columns: 1fr;
  }

  .board__grid,
  .board__skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
