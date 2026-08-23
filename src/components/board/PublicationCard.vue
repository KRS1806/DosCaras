<script setup lang="ts">
import { computed } from 'vue'
import type { Publicacion } from '@/models'
import { useAuthStore } from '@/stores/auth'
import { useFavoritosStore } from '@/stores/favoritos'
import { useNotifications } from '@/stores/notifications'
import { colorCategoria } from '@/utils/categoryColor'
import { resaltarTexto } from '@/utils/resaltarTexto'

const props = defineProps<{
  publicacion: Publicacion
  resaltar?: string
}>()

const auth = useAuthStore()
const favoritos = useFavoritosStore()
const notificaciones = useNotifications()

const esFavorito = computed(() => favoritos.esFavorito(props.publicacion.id))

const extractoLadoA = computed(() => {
  const texto = props.publicacion.ladoA.descripcion
  const MAX = 140
  return texto.length > MAX ? `${texto.slice(0, MAX).trimEnd()}…` : texto
})

const fecha = computed(() =>
  new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(props.publicacion.fechaCreacion)),
)

const tituloHtml = computed(() => resaltarTexto(props.publicacion.titulo, props.resaltar))
const extractoHtml = computed(() => resaltarTexto(extractoLadoA.value, props.resaltar))

function alternarFavorito() {
  favoritos.alternar(props.publicacion.id)
}

async function compartir() {
  const url = `${window.location.origin}/views/${props.publicacion.id}`

  if (navigator.share) {
    try {
      await navigator.share({ title: props.publicacion.titulo, url })
    } catch {
      // El usuario canceló el diálogo nativo de compartir; no es un error.
    }
    return
  }

  try {
    await navigator.clipboard.writeText(url)
    notificaciones.info('Enlace copiado')
  } catch {
    notificaciones.error('No se pudo copiar el enlace.')
  }
}
</script>

<template>
  <article class="card">
    <header class="card__header">
      <span
        class="card__badge"
        :style="{ backgroundColor: colorCategoria(publicacion.categoria.id) }"
      >
        {{ publicacion.categoria.nombre }}
      </span>

      <button
        v-if="auth.estaAutenticado"
        type="button"
        class="card__favorite"
        :class="{ 'card__favorite--activo': esFavorito }"
        :aria-pressed="esFavorito"
        :aria-label="esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'"
        @click="alternarFavorito"
      >
        {{ esFavorito ? '♥' : '♡' }}
      </button>
    </header>

    <RouterLink :to="`/views/${publicacion.id}`" class="card__titulo">
      <span v-html="tituloHtml"></span>
    </RouterLink>

    <RouterLink :to="`/authors/${publicacion.autor.id}`" class="card__autor">
      {{ publicacion.autor.nombre }}
    </RouterLink>

    <p class="card__extracto" v-html="extractoHtml"></p>

    <ul v-if="publicacion.hashtags.length" class="card__hashtags">
      <li v-for="hashtag in publicacion.hashtags" :key="hashtag">#{{ hashtag }}</li>
    </ul>

    <footer class="card__footer">
      <div class="card__likes">
        <span>Lado A: {{ publicacion.ladoA.likes }} ❤</span>
        <span>Lado B: {{ publicacion.ladoB.likes }} ❤</span>
      </div>
      <time class="card__fecha">{{ fecha }}</time>
    </footer>

    <button type="button" class="card__compartir" @click="compartir">Compartir</button>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.1rem;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card__badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
}

.card__favorite {
  background: transparent;
  border: none;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text);
}

.card__favorite--activo {
  color: #dc2626;
}

.card__titulo {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-heading);
  text-decoration: none;
}

.card__titulo:hover {
  text-decoration: underline;
}

.card__autor {
  font-size: 0.85rem;
  color: #7c3aed;
  font-weight: 600;
  text-decoration: none;
  width: fit-content;
}

.card__autor:hover {
  text-decoration: underline;
}

.card__extracto {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.85;
}

.card__hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.78rem;
  color: #6366f1;
}

.card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.8;
}

.card__likes {
  display: flex;
  gap: 0.75rem;
}

.card__compartir {
  margin-top: 0.3rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
