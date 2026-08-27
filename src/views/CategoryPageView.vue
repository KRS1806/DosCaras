<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { obtenerCategoria } from '@/services/categories'
import { obtenerHashtags } from '@/services/hashtags'
import { obtenerVistas, type OrdenTablero } from '@/services/views'
import { NotFoundError, extraerMensajeError } from '@/services/httpClient'
import type { Categoria, Hashtag, Publicacion } from '@/models'
import PublicationCard from '@/components/board/PublicationCard.vue'
import FilterPanel from '@/components/board/FilterPanel.vue'

const LIMITE = 12

interface FiltrosCategoria {
  hashtags: string[]
  sort: OrdenTablero
}

const route = useRoute()
const router = useRouter()

const categoriaId = computed(() => route.params.id as string)

function esOrdenValido(valor: unknown): valor is OrdenTablero {
  return valor === 'recientes' || valor === 'likes_a' || valor === 'likes_b'
}

function filtrosDesdeQuery(): FiltrosCategoria {
  const { hashtag, sort } = route.query
  return {
    hashtags: typeof hashtag === 'string' && hashtag.length > 0 ? hashtag.split(',') : [],
    sort: esOrdenValido(sort) ? sort : 'recientes',
  }
}

const filtros = reactive<FiltrosCategoria>(filtrosDesdeQuery())

const categoria = ref<Categoria | null>(null)
const cargandoCategoria = ref(true)
const noEncontrada = ref(false)
const errorCategoria = ref('')

const hashtagsDisponibles = ref<Hashtag[]>([])

const publicaciones = ref<Publicacion[]>([])
const total = ref(0)
const pagina = ref(1)
const totalPaginas = ref(1)
const cargando = ref(false)
const mensajeError = ref('')

function sincronizarUrl() {
  const query: Record<string, string> = { sort: filtros.sort }
  if (filtros.hashtags.length) {
    query.hashtag = filtros.hashtags.join(',')
  }
  router.replace({ query })
}

async function cargarPublicaciones() {
  cargando.value = true
  mensajeError.value = ''
  try {
    const respuesta = await obtenerVistas({
      page: pagina.value,
      limit: LIMITE,
      category: categoriaId.value,
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
  cargarPublicaciones()
}

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

async function cargarCategoria() {
  cargandoCategoria.value = true
  noEncontrada.value = false
  errorCategoria.value = ''
  try {
    categoria.value = await obtenerCategoria(categoriaId.value)
  } catch (error) {
    if (error instanceof NotFoundError) {
      noEncontrada.value = true
    } else {
      errorCategoria.value = extraerMensajeError(error, 'No se pudo cargar la categoría.')
    }
  } finally {
    cargandoCategoria.value = false
  }

  if (categoria.value) {
    obtenerHashtags()
      .then((tags) => {
        hashtagsDisponibles.value = tags
      })
      .catch(() => {})
    sincronizarUrl()
    cargarPublicaciones()
  }
}

onMounted(cargarCategoria)
</script>

<template>
  <div class="pagina-categoria">
    <p v-if="cargandoCategoria">Cargando categoría…</p>

    <div v-else-if="noEncontrada" class="pagina-error">
      <p class="pagina-error__codigo">404</p>
      <h1>Esta categoría no existe.</h1>
      <RouterLink to="/" class="pagina-error__boton">Volver al tablero principal</RouterLink>
    </div>

    <div v-else-if="errorCategoria" class="board__estado">
      <p>{{ errorCategoria }}</p>
      <button type="button" class="board__reintentar" @click="cargarCategoria">Reintentar</button>
    </div>

    <template v-else-if="categoria">
      <nav class="breadcrumb" aria-label="Miga de pan">
        <RouterLink to="/">Inicio</RouterLink>
        <span>›</span>
        <span>Categorías</span>
        <span>›</span>
        <span>{{ categoria.nombre }}</span>
      </nav>

      <header class="encabezado">
        <h1>{{ categoria.nombre }}</h1>
        <p class="conteo">{{ total }} publicación(es) en esta categoría</p>
      </header>

      <div class="board">
        <FilterPanel
          class="board__filters"
          :categoria="categoriaId"
          :hashtags="filtros.hashtags"
          :orden="filtros.sort"
          :categorias="[]"
          :hashtags-disponibles="hashtagsDisponibles"
          :mostrar-categoria="false"
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
  </div>
</template>

<style scoped>
.pagina-categoria {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.breadcrumb {
  display: flex;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.75;
}

.breadcrumb a {
  color: #7c3aed;
  text-decoration: none;
  font-weight: 600;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.encabezado h1 {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  color: var(--color-heading);
}

.conteo {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.75;
}

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

.pagina-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 4rem 1rem;
  text-align: center;
}

.pagina-error__codigo {
  margin: 0;
  font-size: 3.5rem;
  font-weight: 800;
  color: #7c3aed;
}

.pagina-error h1 {
  margin: 0 0 1rem;
  font-size: 1.4rem;
  color: var(--color-heading);
}

.pagina-error__boton {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  color: white;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
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
