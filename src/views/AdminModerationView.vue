<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { obtenerVistasAdmin, type EstadoFiltro } from '@/services/adminViews'
import { despublicarVista, publicarVista } from '@/services/views'
import { extraerMensajeError } from '@/services/httpClient'
import { useNotifications } from '@/stores/notifications'
import type { Publicacion } from '@/models'

const LIMITE = 20

const FILTROS: Array<{ valor: EstadoFiltro; etiqueta: string }> = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'publicadas', etiqueta: 'Publicadas' },
  { valor: 'despublicadas', etiqueta: 'Despublicadas' },
]

const notificaciones = useNotifications()

const publicaciones = ref<Publicacion[]>([])
const total = ref(0)
const pagina = ref(1)
const filtro = ref<EstadoFiltro>('todas')
const cargando = ref(false)
const mensajeError = ref('')
const idEnProceso = ref<string | null>(null)

const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))

async function cargar() {
  cargando.value = true
  mensajeError.value = ''
  try {
    const respuesta = await obtenerVistasAdmin({ page: pagina.value, limit: LIMITE, estado: filtro.value })
    publicaciones.value = respuesta.data
    total.value = respuesta.total
  } catch (error) {
    publicaciones.value = []
    mensajeError.value = extraerMensajeError(error, 'No se pudieron cargar las publicaciones.')
  } finally {
    cargando.value = false
  }
}

watch(filtro, () => {
  pagina.value = 1
  cargar()
})

function irAPagina(nueva: number) {
  if (nueva < 1 || nueva > totalPaginas.value) {
    return
  }
  pagina.value = nueva
  cargar()
}

async function alternarPublicacion(publicacion: Publicacion) {
  const despublicar = publicacion.publicado
  const confirmado = window.confirm(
    despublicar ? '¿Seguro que deseas despublicar esta publicación?' : '¿Seguro que deseas republicar esta publicación?',
  )
  if (!confirmado) {
    return
  }

  idEnProceso.value = publicacion.id
  try {
    if (despublicar) {
      await despublicarVista(publicacion.id)
    } else {
      await publicarVista(publicacion.id)
    }
    notificaciones.success(despublicar ? 'Publicación despublicada.' : 'Publicación republicada.')
    // Se recarga la página actual (no toda la app) para que la fila
    // desaparezca si ya no coincide con el filtro de estado activo.
    await cargar()
  } catch (error) {
    notificaciones.error(extraerMensajeError(error, 'No se pudo completar la acción.'))
  } finally {
    idEnProceso.value = null
  }
}

function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(fecha))
}

onMounted(cargar)
</script>

<template>
  <div class="admin-moderacion">
    <h1>Moderación de contenido</h1>

    <div class="filtros">
      <button
        v-for="opcion in FILTROS"
        :key="opcion.valor"
        type="button"
        :class="['btn', { 'btn--activo': filtro === opcion.valor }]"
        @click="filtro = opcion.valor"
      >
        {{ opcion.etiqueta }}
      </button>
    </div>

    <p v-if="cargando">Cargando publicaciones…</p>

    <div v-else-if="mensajeError" class="estado">
      <p>{{ mensajeError }}</p>
      <button type="button" class="btn" @click="cargar">Reintentar</button>
    </div>

    <div v-else-if="publicaciones.length === 0" class="estado">
      <p>No se encontraron publicaciones.</p>
    </div>

    <template v-else>
      <div class="tabla-wrapper">
        <table class="tabla">
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Likes / Dislikes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pub in publicaciones" :key="pub.id">
              <td>{{ pub.titulo }}</td>
              <td>{{ pub.autor.nombre }}</td>
              <td>{{ pub.categoria.nombre }}</td>
              <td>{{ formatearFecha(pub.fechaCreacion) }}</td>
              <td>
                <span :class="['badge', pub.publicado ? 'badge--activo' : 'badge--baneado']">
                  {{ pub.publicado ? 'Publicada' : 'Despublicada' }}
                </span>
              </td>
              <td>{{ pub.ladoA.likes + pub.ladoB.likes }} / {{ pub.ladoA.dislikes + pub.ladoB.dislikes }}</td>
              <td>
                <div class="acciones-fila">
                  <RouterLink :to="`/views/${pub.id}`" class="btn">Ver detalle</RouterLink>
                  <button
                    type="button"
                    class="btn"
                    :disabled="idEnProceso === pub.id"
                    @click="alternarPublicacion(pub)"
                  >
                    {{ pub.publicado ? 'Despublicar' : 'Republicar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="totalPaginas > 1" class="paginacion" aria-label="Paginación de publicaciones">
        <button type="button" :disabled="pagina === 1" @click="irAPagina(pagina - 1)">Anterior</button>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <button type="button" :disabled="pagina === totalPaginas" @click="irAPagina(pagina + 1)">Siguiente</button>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.admin-moderacion {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

h1 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--color-heading);
}

.filtros {
  display: flex;
  gap: 0.5rem;
}

.tabla-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.tabla th,
.tabla td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.tabla th {
  background: var(--color-background-soft);
  color: var(--color-heading);
  font-weight: 700;
}

.tabla tbody tr:last-child td {
  border-bottom: none;
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge--activo {
  background: rgba(22, 163, 74, 0.15);
  color: #16a34a;
}

.badge--baneado {
  background: rgba(220, 38, 38, 0.15);
  color: #dc2626;
}

.acciones-fila {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.btn--activo {
  border-color: #7c3aed;
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 0.9rem;
}

.paginacion button {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.paginacion button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text);
  opacity: 0.85;
}
</style>
