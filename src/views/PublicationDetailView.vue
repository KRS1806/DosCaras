<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { obtenerVista, despublicarVista, publicarVista } from '@/services/views'
import { reaccionar } from '@/services/reactions'
import { obtenerHilos, crearHilo, comentarEnHilo } from '@/services/threads'
import { registrarVisita } from '@/services/history'
import { NotFoundError, extraerMensajeError } from '@/services/httpClient'
import { useAuthStore } from '@/stores/auth'
import { useFavoritosStore } from '@/stores/favoritos'
import { useNotifications } from '@/stores/notifications'
import { colorCategoria } from '@/utils/categoryColor'
import { idVideoYoutube } from '@/utils/youtube'
import { compartirPublicacion } from '@/utils/compartir'
import type { HiloComentarios, Publicacion } from '@/models'

const ICONO_FUENTE: Record<string, string> = {
  enlace: '🔗',
  youtube: '▶️',
  documento: '📄',
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const favoritosStore = useFavoritosStore()
const notificaciones = useNotifications()

const id = computed(() => route.params.id as string)

const publicacion = ref<Publicacion | null>(null)
const cargando = ref(true)
const noEncontrada = ref(false)
const mensajeError = ref('')

const pestañaActiva = ref<'A' | 'B'>('A')

const hilos = ref<HiloComentarios[]>([])
const cargandoHilos = ref(false)
const hilosExpandidos = ref<Set<string>>(new Set())

const nuevoComentario = ref('')
const temaNuevoHilo = ref('')
const hiloDestino = ref('')
const enviandoComentario = ref(false)
const despublicando = ref(false)

const esFavorito = computed(() => (publicacion.value ? favoritosStore.esFavorito(publicacion.value.id) : false))
const esAutor = computed(() => publicacion.value && auth.usuario?.id === publicacion.value.autor.id)

function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(fecha))
}

async function cargarPublicacion() {
  cargando.value = true
  noEncontrada.value = false
  mensajeError.value = ''
  try {
    const pub = await obtenerVista(id.value)
    publicacion.value = pub
    registrarVisita({ id: pub.id, titulo: pub.titulo, categoria: pub.categoria.nombre })
  } catch (error) {
    if (error instanceof NotFoundError) {
      noEncontrada.value = true
    } else {
      mensajeError.value = extraerMensajeError(error, 'Esta publicación no existe o fue eliminada.')
    }
  } finally {
    cargando.value = false
  }
}

async function cargarHilos() {
  cargandoHilos.value = true
  try {
    hilos.value = await obtenerHilos(id.value)
  } catch {
    hilos.value = []
  } finally {
    cargandoHilos.value = false
  }
}

function alternarExpandido(hiloId: string) {
  if (hilosExpandidos.value.has(hiloId)) {
    hilosExpandidos.value.delete(hiloId)
  } else {
    hilosExpandidos.value.add(hiloId)
  }
}

async function reaccionarLado(lado: 'A' | 'B', tipo: 'like' | 'dislike') {
  if (!auth.estaAutenticado) {
    router.push('/login')
    return
  }
  if (!publicacion.value) {
    return
  }

  try {
    const resultado = await reaccionar(publicacion.value.id, lado, tipo)
    const destino = lado === 'A' ? publicacion.value.ladoA : publicacion.value.ladoB
    destino.likes = resultado.likes
    destino.dislikes = resultado.dislikes
    destino.miReaccion = resultado.miReaccion
  } catch (error) {
    notificaciones.error(extraerMensajeError(error, 'No se pudo registrar tu reacción.'))
  }
}

function alternarFavorito() {
  if (publicacion.value) {
    favoritosStore.alternar(publicacion.value.id)
  }
}

function compartir() {
  if (publicacion.value) {
    compartirPublicacion(publicacion.value.id, publicacion.value.titulo)
  }
}

async function enviarComentario() {
  const texto = nuevoComentario.value.trim()
  if (!texto || !publicacion.value) {
    return
  }

  enviandoComentario.value = true
  try {
    if (hiloDestino.value) {
      await comentarEnHilo(publicacion.value.id, hiloDestino.value, texto)
    } else {
      await crearHilo(publicacion.value.id, texto, temaNuevoHilo.value)
      temaNuevoHilo.value = ''
    }
    nuevoComentario.value = ''
    await cargarHilos()
    notificaciones.success('Comentario publicado.')
  } catch (error) {
    notificaciones.error(extraerMensajeError(error, 'No se pudo publicar tu comentario.'))
  } finally {
    enviandoComentario.value = false
  }
}

async function despublicar() {
  if (!publicacion.value) {
    return
  }
  if (!window.confirm('¿Seguro que deseas despublicar esta publicación?')) {
    return
  }

  despublicando.value = true
  try {
    await despublicarVista(publicacion.value.id)
    publicacion.value.publicado = false
    notificaciones.success('Publicación despublicada.')
  } catch (error) {
    notificaciones.error(extraerMensajeError(error, 'No se pudo despublicar la publicación.'))
  } finally {
    despublicando.value = false
  }
}

async function publicar() {
  if (!publicacion.value) {
    return
  }
  if (!window.confirm('¿Seguro que deseas republicar esta publicación?')) {
    return
  }

  despublicando.value = true
  try {
    await publicarVista(publicacion.value.id)
    publicacion.value.publicado = true
    notificaciones.success('Publicación republicada.')
  } catch (error) {
    notificaciones.error(extraerMensajeError(error, 'No se pudo republicar la publicación.'))
  } finally {
    despublicando.value = false
  }
}

onMounted(async () => {
  await cargarPublicacion()
  if (publicacion.value) {
    cargarHilos()
  }
})
</script>

<template>
  <div class="detalle">
    <p v-if="cargando">Cargando publicación…</p>

    <div v-else-if="noEncontrada" class="estado">
      <p>Esta publicación no existe o fue eliminada.</p>
      <RouterLink to="/" class="btn btn--solido">Volver al tablero</RouterLink>
    </div>

    <div v-else-if="mensajeError" class="estado">
      <p>{{ mensajeError }}</p>
      <button type="button" class="btn" @click="cargarPublicacion">Reintentar</button>
    </div>

    <template v-else-if="publicacion">
      <header class="encabezado">
        <div class="encabezado__meta">
          <span class="badge" :style="{ backgroundColor: colorCategoria(publicacion.categoria.id) }">
            {{ publicacion.categoria.nombre }}
          </span>
          <span v-if="!publicacion.publicado" class="badge badge--despublicada">Despublicada</span>
        </div>

        <h1>{{ publicacion.titulo }}</h1>

        <div class="encabezado__info">
          <RouterLink :to="`/authors/${publicacion.autor.id}`" class="autor">
            {{ publicacion.autor.nombre }}
          </RouterLink>
          <time>{{ formatearFecha(publicacion.fechaCreacion) }}</time>
        </div>

        <ul v-if="publicacion.hashtags.length" class="hashtags">
          <li v-for="tag in publicacion.hashtags" :key="tag">#{{ tag }}</li>
        </ul>

        <div class="encabezado__acciones">
          <button
            v-if="auth.estaAutenticado"
            type="button"
            class="btn"
            :class="{ 'btn--favorito-activo': esFavorito }"
            @click="alternarFavorito"
          >
            {{ esFavorito ? '♥ En favoritos' : '♡ Agregar a favoritos' }}
          </button>
          <button type="button" class="btn" @click="compartir">Compartir</button>
          <RouterLink v-if="esAutor" :to="`/views/${publicacion.id}/edit`" class="btn">Editar</RouterLink>
          <button v-if="auth.esSuperadmin && publicacion.publicado" type="button" class="btn" :disabled="despublicando" @click="despublicar">
            {{ despublicando ? 'Despublicando…' : 'Despublicar' }}
          </button>
          <button v-else-if="auth.esSuperadmin" type="button" class="btn" :disabled="despublicando" @click="publicar">
            {{ despublicando ? 'Publicando…' : 'Publicar' }}
          </button>
        </div>
      </header>

      <nav class="tabs">
        <button type="button" :class="{ tab: true, 'tab--activa': pestañaActiva === 'A' }" @click="pestañaActiva = 'A'">
          Postura
        </button>
        <button type="button" :class="{ tab: true, 'tab--activa': pestañaActiva === 'B' }" @click="pestañaActiva = 'B'">
          Contrapostura
        </button>
      </nav>

      <section class="lado">
        <template v-if="pestañaActiva === 'A'">
          <h2>{{ publicacion.ladoA.titulo }}</h2>
          <p class="lado__texto">{{ publicacion.ladoA.descripcion }}</p>
        </template>
        <template v-else>
          <h2>{{ publicacion.ladoB.titulo }}</h2>
          <p class="lado__texto">{{ publicacion.ladoB.descripcion }}</p>
        </template>

        <div class="reacciones">
          <button
            type="button"
            class="btn-reaccion"
            :class="{ 'btn-reaccion--activo': (pestañaActiva === 'A' ? publicacion.ladoA : publicacion.ladoB).miReaccion === 'like' }"
            :disabled="!auth.estaAutenticado"
            :title="!auth.estaAutenticado ? 'Inicia sesión para reaccionar' : ''"
            @click="reaccionarLado(pestañaActiva, 'like')"
          >
            👍 {{ (pestañaActiva === 'A' ? publicacion.ladoA : publicacion.ladoB).likes }}
          </button>
          <button
            type="button"
            class="btn-reaccion"
            :class="{ 'btn-reaccion--activo': (pestañaActiva === 'A' ? publicacion.ladoA : publicacion.ladoB).miReaccion === 'dislike' }"
            :disabled="!auth.estaAutenticado"
            :title="!auth.estaAutenticado ? 'Inicia sesión para reaccionar' : ''"
            @click="reaccionarLado(pestañaActiva, 'dislike')"
          >
            👎 {{ (pestañaActiva === 'A' ? publicacion.ladoA : publicacion.ladoB).dislikes }}
          </button>
        </div>

        <h3>Fuentes</h3>
        <ul class="fuentes">
          <li v-for="fuente in (pestañaActiva === 'A' ? publicacion.ladoA : publicacion.ladoB).fuentes" :key="fuente.id">
            <div class="fuente__fila">
              <span>{{ ICONO_FUENTE[fuente.tipo] }}</span>
              <a :href="fuente.url" target="_blank" rel="noopener noreferrer">{{ fuente.titulo || fuente.url }}</a>
            </div>
            <iframe
              v-if="idVideoYoutube(fuente.url)"
              class="fuente__embed"
              :src="`https://www.youtube.com/embed/${idVideoYoutube(fuente.url)}`"
              title="Vista previa de YouTube"
              allowfullscreen
            ></iframe>
          </li>
        </ul>
      </section>

      <section class="comentarios">
        <h2>Comentarios</h2>

        <p v-if="cargandoHilos">Cargando comentarios…</p>
        <p v-else-if="hilos.length === 0">Todavía no hay comentarios en esta publicación.</p>

        <ul v-else class="hilos">
          <li v-for="hilo in hilos" :key="hilo.id" class="hilo">
            <button type="button" class="hilo__encabezado" @click="alternarExpandido(hilo.id)">
              <span>{{ hilo.tema ?? 'Hilo sin título' }}</span>
              <span class="hilo__contador">{{ hilo.comentarios.length }} comentario(s)</span>
            </button>

            <ul v-if="hilosExpandidos.has(hilo.id)" class="comentarios-lista">
              <li v-for="comentario in hilo.comentarios" :key="comentario.id" class="comentario">
                <p class="comentario__autor">{{ comentario.autor.nombre }}</p>
                <p class="comentario__texto">{{ comentario.texto }}</p>
                <ul v-if="comentario.respuestas.length" class="comentarios-lista comentarios-lista--anidada">
                  <li v-for="respuesta in comentario.respuestas" :key="respuesta.id" class="comentario">
                    <p class="comentario__autor">{{ respuesta.autor.nombre }}</p>
                    <p class="comentario__texto">{{ respuesta.texto }}</p>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>

        <div v-if="auth.estaAutenticado" class="formulario-comentario">
          <select v-model="hiloDestino">
            <option value="">Crear un nuevo hilo</option>
            <option v-for="hilo in hilos" :key="hilo.id" :value="hilo.id">
              {{ hilo.tema ?? 'Hilo sin título' }}
            </option>
          </select>
          <input
            v-if="!hiloDestino"
            v-model="temaNuevoHilo"
            type="text"
            placeholder="Tema del hilo (opcional)"
          />
          <textarea v-model="nuevoComentario" rows="3" placeholder="Escribe tu comentario…"></textarea>
          <button type="button" class="btn btn--solido" :disabled="enviandoComentario || !nuevoComentario.trim()" @click="enviarComentario">
            {{ enviandoComentario ? 'Enviando…' : 'Comentar' }}
          </button>
        </div>
        <p v-else class="nota">Inicia sesión para comentar.</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.detalle {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 860px;
  margin: 0 auto;
}

.encabezado {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.encabezado__meta {
  display: flex;
  gap: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge--despublicada {
  background: #dc2626;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
  color: var(--color-heading);
}

.encabezado__info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.8;
}

.autor {
  color: #7c3aed;
  font-weight: 600;
  text-decoration: none;
}

.autor:hover {
  text-decoration: underline;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8rem;
  color: #6366f1;
}

.encabezado__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.4rem;
}

.btn {
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.btn--solido {
  border-color: transparent;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
}

.btn--favorito-activo {
  border-color: #dc2626;
  color: #dc2626;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.lado {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.lado h2 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--color-heading);
}

.lado__texto {
  margin: 0;
  color: var(--color-text);
  line-height: 1.6;
  white-space: pre-wrap;
}

.reacciones {
  display: flex;
  gap: 0.6rem;
}

.btn-reaccion {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-reaccion--activo {
  border-color: #7c3aed;
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
}

.btn-reaccion:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lado h3 {
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  color: var(--color-heading);
}

.fuentes {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.fuente__fila {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.fuente__fila a {
  color: #7c3aed;
  text-decoration: none;
  word-break: break-all;
}

.fuente__fila a:hover {
  text-decoration: underline;
}

.fuente__embed {
  margin-top: 0.5rem;
  width: 100%;
  max-width: 480px;
  aspect-ratio: 16 / 9;
  border: none;
  border-radius: 8px;
}

.comentarios h2 {
  margin: 0 0 0.75rem;
  font-size: 1.15rem;
  color: var(--color-heading);
}

.hilos {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
}

.hilo {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
}

.hilo__encabezado {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  background: var(--color-background-soft);
  border: none;
  color: var(--color-heading);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.hilo__contador {
  font-size: 0.78rem;
  font-weight: 400;
  opacity: 0.7;
}

.comentarios-lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0.75rem 1rem;
  list-style: none;
}

.comentarios-lista--anidada {
  padding: 0.5rem 0 0 1.25rem;
  border-left: 2px solid var(--color-border);
}

.comentario__autor {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-heading);
}

.comentario__texto {
  margin: 0.15rem 0 0;
  font-size: 0.88rem;
  color: var(--color-text);
}

.formulario-comentario {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 480px;
}

.formulario-comentario select,
.formulario-comentario input,
.formulario-comentario textarea {
  padding: 0.55rem 0.7rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
  font-family: inherit;
}

.formulario-comentario .btn {
  align-self: flex-end;
}

.nota {
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.75;
}

.estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}
</style>
