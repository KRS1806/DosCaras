<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buscarPublicaciones } from '@/services/search'
import { extraerMensajeError } from '@/services/httpClient'
import type { Publicacion } from '@/models'
import PublicationCard from '@/components/board/PublicationCard.vue'

const route = useRoute()
const router = useRouter()

const termino = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))
const terminoInput = ref(termino.value)

const publicaciones = ref<Publicacion[]>([])
const cargando = ref(false)
const mensajeError = ref('')

async function buscar() {
  if (!termino.value) {
    publicaciones.value = []
    mensajeError.value = ''
    return
  }

  cargando.value = true
  mensajeError.value = ''
  try {
    publicaciones.value = await buscarPublicaciones(termino.value)
  } catch (error) {
    publicaciones.value = []
    mensajeError.value = extraerMensajeError(error, 'No se pudieron obtener los resultados.')
  } finally {
    cargando.value = false
  }
}

function actualizarBusqueda() {
  const nuevoTermino = terminoInput.value.trim()
  router.push({ path: '/search', query: nuevoTermino ? { q: nuevoTermino } : {} })
}

watch(
  termino,
  (valor) => {
    terminoInput.value = valor
    buscar()
  },
  { immediate: true },
)
</script>

<template>
  <div class="resultados">
    <form class="buscador" @submit.prevent="actualizarBusqueda">
      <input
        v-model="terminoInput"
        type="search"
        placeholder="Buscar publicaciones…"
        aria-label="Buscar publicaciones"
      />
      <button type="submit" class="btn btn--solido">Buscar</button>
    </form>

    <div v-if="!termino" class="estado">
      <p>Escribe un término para buscar publicaciones.</p>
    </div>

    <template v-else>
      <h1>Resultados para: "{{ termino }}"</h1>

      <div v-if="cargando" class="grid-skeleton">
        <div v-for="n in 6" :key="n" class="skeleton-card" />
      </div>

      <div v-else-if="mensajeError" class="estado">
        <p>{{ mensajeError }}</p>
        <button type="button" class="btn" @click="buscar">Reintentar</button>
      </div>

      <div v-else-if="publicaciones.length === 0" class="estado">
        <p>No se encontraron publicaciones para "{{ termino }}".</p>
        <p class="sugerencia">Intenta con un término más general.</p>
      </div>

      <template v-else>
        <p class="total">{{ publicaciones.length }} resultado(s) encontrado(s)</p>
        <div class="grid">
          <PublicationCard
            v-for="publicacion in publicaciones"
            :key="publicacion.id"
            :publicacion="publicacion"
            :resaltar="termino"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.resultados {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.buscador {
  display: flex;
  gap: 0.6rem;
  max-width: 480px;
}

.buscador input {
  flex: 1;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
}

h1 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--color-heading);
}

.total {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.75;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.grid-skeleton {
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

.sugerencia {
  font-size: 0.85rem;
  opacity: 0.75;
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

.btn--solido {
  border-color: transparent;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
}

@media (max-width: 768px) {
  .grid,
  .grid-skeleton {
    grid-template-columns: 1fr;
  }
}
</style>
