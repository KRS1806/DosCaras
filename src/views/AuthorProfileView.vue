<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { obtenerAutor, type PerfilAutor } from '@/services/authors'
import { obtenerVistas } from '@/services/views'
import { extraerMensajeError, NotFoundError } from '@/services/httpClient'
import type { Publicacion } from '@/models'
import PublicationCard from '@/components/board/PublicationCard.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const LIMITE = 100

const route = useRoute()

const cargando = ref(true)
const autorNoEncontrado = ref(false)
const mensajeError = ref('')

const autor = ref<PerfilAutor | null>(null)
const publicaciones = ref<Publicacion[]>([])

function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(fecha))
}

async function cargarPerfilAutor(id: string) {
  cargando.value = true
  autorNoEncontrado.value = false
  mensajeError.value = ''
  autor.value = null
  publicaciones.value = []

  try {
    autor.value = await obtenerAutor(id)
  } catch (error) {
    if (error instanceof NotFoundError) {
      autorNoEncontrado.value = true
    } else {
      mensajeError.value = extraerMensajeError(error, 'No se pudo cargar el perfil del autor.')
    }
    cargando.value = false
    return
  }

  try {
    const respuesta = await obtenerVistas({ page: 1, limit: LIMITE, autorId: id })
    publicaciones.value = respuesta.data
  } catch (error) {
    mensajeError.value = extraerMensajeError(error, 'No se pudieron cargar las publicaciones del autor.')
  } finally {
    cargando.value = false
  }
}

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') {
      cargarPerfilAutor(id)
    }
  },
)

onMounted(() => {
  const id = route.params.id
  if (typeof id === 'string') {
    cargarPerfilAutor(id)
  }
})
</script>

<template>
  <NotFoundView v-if="autorNoEncontrado" />

  <div v-else class="perfil-autor">
    <div v-if="cargando" class="perfil-autor__skeleton">
      <div class="skeleton-encabezado" />
      <div class="perfil-autor__grid">
        <div v-for="n in 4" :key="n" class="skeleton-card" />
      </div>
    </div>

    <template v-else>
      <p v-if="mensajeError" class="perfil-autor__error">{{ mensajeError }}</p>

      <template v-else-if="autor">
        <header class="perfil-autor__encabezado">
          <h1>{{ autor.nombre }}</h1>
          <p class="perfil-autor__fecha">Miembro desde {{ formatearFecha(autor.fechaRegistro) }}</p>
        </header>

        <p v-if="publicaciones.length === 0" class="perfil-autor__vacio">
          Este autor todavía no tiene publicaciones.
        </p>

        <div v-else class="perfil-autor__grid">
          <PublicationCard v-for="publicacion in publicaciones" :key="publicacion.id" :publicacion="publicacion" />
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.perfil-autor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.perfil-autor__encabezado {
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.perfil-autor__encabezado h1 {
  margin: 0 0 0.35rem;
  font-size: 1.4rem;
  color: var(--color-heading);
}

.perfil-autor__fecha {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.75;
}

.perfil-autor__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.perfil-autor__vacio,
.perfil-autor__error {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text);
  opacity: 0.85;
}

.perfil-autor__error {
  color: #dc2626;
  opacity: 1;
}

.skeleton-encabezado {
  height: 84px;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  background: linear-gradient(
    100deg,
    var(--color-background-soft) 30%,
    var(--color-background-mute) 50%,
    var(--color-background-soft) 70%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.4s ease-in-out infinite;
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

@media (max-width: 768px) {
  .perfil-autor__grid {
    grid-template-columns: 1fr;
  }
}
</style>
