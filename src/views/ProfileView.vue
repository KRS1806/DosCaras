<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { obtenerPerfilActual } from '@/services/auth'
import { obtenerVistas, obtenerVista } from '@/services/views'
import { obtenerMisFavoritosIds } from '@/services/users'
import { obtenerHistorial, limpiarHistorial, type EntradaHistorial } from '@/services/history'
import { extraerMensajeError } from '@/services/httpClient'
import { useAuthStore } from '@/stores/auth'
import { useFavoritosStore } from '@/stores/favoritos'
import { useNotifications } from '@/stores/notifications'
import type { Publicacion, Usuario } from '@/models'
import PublicationCard from '@/components/board/PublicationCard.vue'

const router = useRouter()
const auth = useAuthStore()
const favoritosStore = useFavoritosStore()
const notificaciones = useNotifications()

const perfil = ref<Usuario | null>(null)
const cargandoPerfil = ref(true)

const pestañaActiva = ref<'publicaciones' | 'favoritos' | 'historial'>('publicaciones')

const misPublicaciones = ref<Publicacion[]>([])
const cargandoPublicaciones = ref(false)
const errorPublicaciones = ref('')

const misFavoritos = ref<Publicacion[]>([])
const cargandoFavoritos = ref(false)
const errorFavoritos = ref('')
const misFavoritosVisibles = computed(() => misFavoritos.value.filter((p) => favoritosStore.esFavorito(p.id)))

const historial = ref<EntradaHistorial[]>([])

function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(fecha))
}

async function cargarPerfil() {
  cargandoPerfil.value = true
  try {
    perfil.value = await obtenerPerfilActual()
    if (auth.token) {
      auth.iniciarSesion(auth.token, perfil.value)
    }
  } catch (error) {
    notificaciones.error(extraerMensajeError(error, 'No se pudo cargar tu perfil.'))
  } finally {
    cargandoPerfil.value = false
  }
}

async function cargarMisPublicaciones() {
  cargandoPublicaciones.value = true
  errorPublicaciones.value = ''
  try {
    const respuesta = await obtenerVistas({ page: 1, limit: 50, autor: 'me' })
    misPublicaciones.value = respuesta.data
  } catch (error) {
    errorPublicaciones.value = extraerMensajeError(error, 'No se pudieron cargar tus publicaciones.')
  } finally {
    cargandoPublicaciones.value = false
  }
}

async function cargarMisFavoritos() {
  cargandoFavoritos.value = true
  errorFavoritos.value = ''
  try {
    const ids = await obtenerMisFavoritosIds()
    favoritosStore.sincronizarIds(ids)
    misFavoritos.value = await Promise.all(ids.map((id) => obtenerVista(id)))
  } catch (error) {
    errorFavoritos.value = extraerMensajeError(error, 'No se pudieron cargar tus favoritos.')
  } finally {
    cargandoFavoritos.value = false
  }
}

function limpiarHistorialClick() {
  limpiarHistorial()
  historial.value = []
}

function cerrarSesionClick() {
  auth.cerrarSesion()
  favoritosStore.recargarDesdeCache()
  router.push('/')
}

onMounted(() => {
  cargarPerfil()
  cargarMisPublicaciones()
  cargarMisFavoritos()
  historial.value = obtenerHistorial()
})
</script>

<template>
  <div class="perfil">
    <p v-if="cargandoPerfil">Cargando perfil…</p>

    <section v-else-if="perfil" class="datos-usuario">
      <h1>Mi perfil</h1>
      <dl>
        <div class="dato">
          <dt>Nombre</dt>
          <dd>{{ perfil.nombre }}</dd>
        </div>
        <div class="dato">
          <dt>Correo</dt>
          <dd>{{ perfil.email }}</dd>
        </div>
        <div class="dato">
          <dt>Rol</dt>
          <dd>{{ perfil.rol === 'superadmin' ? 'Superadministrador' : 'Usuario' }}</dd>
        </div>
        <div class="dato">
          <dt>Fecha de registro</dt>
          <dd>{{ formatearFecha(perfil.fechaRegistro) }}</dd>
        </div>
      </dl>
      <button type="button" class="btn" @click="cerrarSesionClick">Cerrar sesión</button>
    </section>

    <nav class="tabs">
      <button
        type="button"
        :class="{ tab: true, 'tab--activa': pestañaActiva === 'publicaciones' }"
        @click="pestañaActiva = 'publicaciones'"
      >
        Mis Publicaciones
      </button>
      <button
        type="button"
        :class="{ tab: true, 'tab--activa': pestañaActiva === 'favoritos' }"
        @click="pestañaActiva = 'favoritos'"
      >
        Mis Favoritos
      </button>
      <button
        type="button"
        :class="{ tab: true, 'tab--activa': pestañaActiva === 'historial' }"
        @click="pestañaActiva = 'historial'"
      >
        Historial
      </button>
    </nav>

    <section v-if="pestañaActiva === 'publicaciones'">
      <p v-if="cargandoPublicaciones">Cargando publicaciones…</p>
      <p v-else-if="errorPublicaciones" class="error">{{ errorPublicaciones }}</p>
      <p v-else-if="misPublicaciones.length === 0">Todavía no has creado ninguna publicación.</p>
      <ul v-else class="lista-publicaciones">
        <li v-for="pub in misPublicaciones" :key="pub.id" class="fila-publicacion">
          <div class="fila-publicacion__info">
            <p class="fila-publicacion__titulo">{{ pub.titulo }}</p>
            <span v-if="!pub.publicado" class="badge-despublicada">Despublicada por un administrador</span>
          </div>
          <div class="fila-publicacion__acciones">
            <RouterLink :to="`/views/${pub.id}`">Ver detalle</RouterLink>
            <RouterLink :to="`/views/${pub.id}/edit`">Editar</RouterLink>
          </div>
        </li>
      </ul>
    </section>

    <section v-else-if="pestañaActiva === 'favoritos'">
      <p v-if="cargandoFavoritos">Cargando favoritos…</p>
      <p v-else-if="errorFavoritos" class="error">{{ errorFavoritos }}</p>
      <p v-else-if="misFavoritosVisibles.length === 0">Todavía no tienes publicaciones favoritas.</p>
      <div v-else class="grid-favoritos">
        <PublicationCard v-for="pub in misFavoritosVisibles" :key="pub.id" :publicacion="pub" />
      </div>
    </section>

    <section v-else>
      <div v-if="historial.length === 0" class="estado">
        <p>Aún no has visitado ninguna publicación.</p>
      </div>
      <template v-else>
        <button type="button" class="btn" @click="limpiarHistorialClick">Limpiar historial</button>
        <ul class="lista-historial">
          <li v-for="entrada in historial" :key="`${entrada.id}-${entrada.fechaVisita}`">
            <span class="lista-historial__titulo">{{ entrada.titulo }}</span>
            <span class="lista-historial__categoria">{{ entrada.categoria }}</span>
            <time>{{ formatearFecha(entrada.fechaVisita) }}</time>
          </li>
        </ul>
      </template>
    </section>
  </div>
</template>

<style scoped>
.perfil {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h1 {
  margin: 0 0 0.75rem;
  font-size: 1.4rem;
  color: var(--color-heading);
}

.datos-usuario {
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0 0 1rem;
}

.dato dt {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text);
  opacity: 0.7;
}

.dato dd {
  margin: 0.15rem 0 0;
  font-size: 0.95rem;
  color: var(--color-heading);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.tab {
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab--activa {
  color: #7c3aed;
  border-bottom-color: #7c3aed;
}

.lista-publicaciones {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.fila-publicacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.fila-publicacion__titulo {
  margin: 0;
  font-weight: 600;
  color: var(--color-heading);
}

.badge-despublicada {
  display: inline-block;
  margin-top: 0.3rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
  font-size: 0.72rem;
  font-weight: 700;
}

.fila-publicacion__acciones {
  display: flex;
  gap: 0.75rem;
  font-size: 0.85rem;
  white-space: nowrap;
}

.fila-publicacion__acciones a {
  color: #7c3aed;
  font-weight: 600;
  text-decoration: none;
}

.fila-publicacion__acciones a:hover {
  text-decoration: underline;
}

.grid-favoritos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.lista-historial {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.lista-historial li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0.9rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  font-size: 0.85rem;
}

.lista-historial__titulo {
  font-weight: 600;
  color: var(--color-heading);
}

.lista-historial__categoria {
  color: var(--color-text);
  opacity: 0.75;
}

.error {
  color: #dc2626;
}

.estado {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text);
  opacity: 0.85;
}

.btn {
  padding: 0.55rem 1rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 768px) {
  dl {
    grid-template-columns: 1fr;
  }

  .grid-favoritos {
    grid-template-columns: 1fr;
  }

  .fila-publicacion {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
