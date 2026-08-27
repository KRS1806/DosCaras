<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CacheService } from '@/services/cacheService'
import { obtenerCategorias } from '@/services/categories'
import { buscarHashtags } from '@/services/hashtags'
import { obtenerVista, crearVista, actualizarVista, type PublicacionPayload } from '@/services/views'
import { notificarErrorNoManejado, ForbiddenError, type ErrorDeValidacion } from '@/services/httpClient'
import { useNotifications } from '@/stores/notifications'
import type { Categoria, Hashtag } from '@/models'
import LadoFormSection from '@/components/publication/LadoFormSection.vue'

const DRAFT_KEY = 'lasdoscaras_draft'
const MIN_DESCRIPCION = 100

const MAPA_CAMPOS_SERVIDOR: Record<string, string> = {
  categoryId: 'categoriaId',
  side: 'ladoA',
  counterpart: 'ladoB',
  hashtags: 'hashtags',
}

const route = useRoute()
const router = useRouter()
const notificaciones = useNotifications()

const idRuta = computed(() => route.params.id as string | undefined)
const esEdicion = computed(() => idRuta.value !== undefined)

const cargandoInicial = ref(esEdicion.value)
const accesoDenegado = ref(false)

const categoriaId = ref('')
const hashtags = ref<string[]>([])

function ladoVacio(): PublicacionPayload['ladoA'] {
  return { titulo: '', descripcion: '', fuentes: [] }
}

const ladoA = reactive(ladoVacio())
const ladoB = reactive(ladoVacio())

const categorias = ref<Categoria[]>([])

const hashtagBorrador = ref('')
const sugerenciasHashtags = ref<Hashtag[]>([])
let debounceHashtag: ReturnType<typeof setTimeout> | undefined

watch(hashtagBorrador, (valor) => {
  if (debounceHashtag) {
    clearTimeout(debounceHashtag)
  }
  const termino = valor.trim()
  if (!termino) {
    sugerenciasHashtags.value = []
    return
  }
  debounceHashtag = setTimeout(async () => {
    try {
      sugerenciasHashtags.value = await buscarHashtags(termino)
    } catch {
      sugerenciasHashtags.value = []
    }
  }, 300)
})

function agregarHashtag(nombre: string) {
  const limpio = nombre.trim().replace(/^#/, '')
  if (limpio && !hashtags.value.includes(limpio)) {
    hashtags.value.push(limpio)
  }
  hashtagBorrador.value = ''
  sugerenciasHashtags.value = []
}

function onHashtagKeydown(evento: KeyboardEvent) {
  if (evento.key === 'Enter' || evento.key === ',') {
    evento.preventDefault()
    agregarHashtag(hashtagBorrador.value)
  }
}

function quitarHashtag(nombre: string) {
  hashtags.value = hashtags.value.filter((tag) => tag !== nombre)
}

const erroresCliente = ref<string[]>([])
const erroresServidor = ref<Record<string, string>>({})
const mensajeErrorServidor = ref('')
const enviando = ref(false)

function snapshot() {
  return { categoriaId: categoriaId.value, hashtags: hashtags.value, ladoA, ladoB }
}

let snapshotInicial = ''

function guardarSnapshotInicial() {
  snapshotInicial = JSON.stringify(snapshot())
}

function haCambiado(): boolean {
  return JSON.stringify(snapshot()) !== snapshotInicial
}

function validar(): boolean {
  const problemas: string[] = []

  if (!categoriaId.value) {
    problemas.push('Selecciona una categoría.')
  }

  for (const [nombre, lado] of [
    ['Lado A', ladoA],
    ['Lado B', ladoB],
  ] as const) {
    if (!lado.titulo.trim()) {
      problemas.push(`El título de ${nombre} es obligatorio.`)
    }
    if (lado.descripcion.trim().length < MIN_DESCRIPCION) {
      problemas.push(`El argumento de ${nombre} debe tener al menos ${MIN_DESCRIPCION} caracteres.`)
    }
    if (lado.fuentes.length === 0) {
      problemas.push(`Agrega al menos una fuente en ${nombre}.`)
    } else if (lado.fuentes.some((fuente) => !fuente.url.trim())) {
      problemas.push(`Completa la URL de todas las fuentes de ${nombre}.`)
    }
  }

  erroresCliente.value = problemas
  return problemas.length === 0
}

function mapearErroresServidor(campos?: Record<string, string[]>): Record<string, string> {
  if (!campos) {
    return {}
  }
  const resultado: Record<string, string> = {}
  for (const [clave, mensajes] of Object.entries(campos)) {
    const claveInterna = MAPA_CAMPOS_SERVIDOR[clave] ?? clave
    resultado[claveInterna] = mensajes[0] ?? 'Valor inválido.'
  }
  return resultado
}

function ofrecerRestaurarBorrador() {
  const borrador = CacheService.get<ReturnType<typeof snapshot>>(DRAFT_KEY)
  if (!borrador) {
    return
  }
  if (window.confirm('Se encontró un borrador guardado. ¿Deseas restaurarlo?')) {
    categoriaId.value = borrador.categoriaId
    hashtags.value = borrador.hashtags
    Object.assign(ladoA, borrador.ladoA)
    Object.assign(ladoB, borrador.ladoB)
  } else {
    CacheService.remove(DRAFT_KEY)
  }
}

watch(
  [categoriaId, hashtags, ladoA, ladoB],
  () => {
    if (!esEdicion.value) {
      CacheService.set(DRAFT_KEY, snapshot())
    }
  },
  { deep: true },
)

async function enviar() {
  // Si el usuario escribió un hashtag pero no presionó Enter/coma antes de
  // publicar, se agrega igual en vez de perderse.
  agregarHashtag(hashtagBorrador.value)

  erroresServidor.value = {}
  mensajeErrorServidor.value = ''

  if (!validar()) {
    return
  }

  const payload: PublicacionPayload = {
    categoriaId: categoriaId.value,
    hashtags: hashtags.value,
    ladoA: { titulo: ladoA.titulo.trim(), descripcion: ladoA.descripcion.trim(), fuentes: ladoA.fuentes },
    ladoB: { titulo: ladoB.titulo.trim(), descripcion: ladoB.descripcion.trim(), fuentes: ladoB.fuentes },
  }

  enviando.value = true
  try {
    if (esEdicion.value && idRuta.value) {
      await actualizarVista(idRuta.value, payload)
      notificaciones.success('Publicación actualizada.')
    } else {
      await crearVista(payload)
      notificaciones.success('Publicación creada.')
      CacheService.remove(DRAFT_KEY)
    }
    router.push('/')
  } catch (error) {
    if (error && typeof error === 'object' && 'campos' in error) {
      const errorValidacion = error as ErrorDeValidacion
      mensajeErrorServidor.value = errorValidacion.message
      erroresServidor.value = mapearErroresServidor(errorValidacion.campos)
    } else {
      notificarErrorNoManejado(error, 'No se pudo guardar la publicación.')
    }
  } finally {
    enviando.value = false
  }
}

function cancelar() {
  if (haCambiado() && !window.confirm('Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?')) {
    return
  }
  router.back()
}

onMounted(async () => {
  const [cats] = await Promise.allSettled([obtenerCategorias()])
  if (cats.status === 'fulfilled') {
    categorias.value = cats.value
  }

  if (esEdicion.value && idRuta.value) {
    try {
      const publicacion = await obtenerVista(idRuta.value)
      categoriaId.value = publicacion.categoria.id
      hashtags.value = [...publicacion.hashtags]
      Object.assign(ladoA, {
        titulo: publicacion.ladoA.titulo,
        descripcion: publicacion.ladoA.descripcion,
        fuentes: publicacion.ladoA.fuentes.map((fuente) => ({
          tipo: fuente.tipo,
          url: fuente.url,
          titulo: fuente.titulo,
        })),
      })
      Object.assign(ladoB, {
        titulo: publicacion.ladoB.titulo,
        descripcion: publicacion.ladoB.descripcion,
        fuentes: publicacion.ladoB.fuentes.map((fuente) => ({
          tipo: fuente.tipo,
          url: fuente.url,
          titulo: fuente.titulo,
        })),
      })
      guardarSnapshotInicial()
    } catch (error) {
      if (error instanceof ForbiddenError) {
        accesoDenegado.value = true
      } else {
        notificarErrorNoManejado(error, 'No se pudo cargar la publicación.')
        router.push('/')
      }
    } finally {
      cargandoInicial.value = false
    }
  } else {
    ofrecerRestaurarBorrador()
    guardarSnapshotInicial()
  }
})
</script>

<template>
  <div class="formulario-vista">
    <p v-if="cargandoInicial">Cargando publicación…</p>

    <div v-else-if="accesoDenegado" class="acceso-denegado">
      <p>No tienes permiso para editar esta publicación.</p>
      <RouterLink to="/" class="btn btn--solido">Volver al tablero</RouterLink>
    </div>

    <form v-else class="formulario" @submit.prevent="enviar">
      <h1>{{ esEdicion ? 'Editar publicación' : 'Nueva publicación' }}</h1>

      <div class="campo">
        <label for="categoria">Categoría</label>
        <select id="categoria" v-model="categoriaId" required>
          <option value="" disabled>Selecciona una categoría</option>
          <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
        </select>
        <span v-if="erroresServidor.categoriaId" class="error">{{ erroresServidor.categoriaId }}</span>
      </div>

      <div class="campo">
        <label for="hashtags">Hashtags</label>
        <div class="hashtags">
          <ul class="hashtags__chips">
            <li v-for="tag in hashtags" :key="tag" class="chip">
              #{{ tag }}
              <button type="button" :aria-label="`Quitar hashtag ${tag}`" @click="quitarHashtag(tag)">×</button>
            </li>
          </ul>
          <input
            id="hashtags"
            v-model="hashtagBorrador"
            type="text"
            placeholder="Escribe y presiona Enter o coma"
            @keydown="onHashtagKeydown"
          />
          <ul v-if="sugerenciasHashtags.length" class="hashtags__sugerencias">
            <li v-for="sugerencia in sugerenciasHashtags" :key="sugerencia.id">
              <button type="button" @click="agregarHashtag(sugerencia.nombre)">#{{ sugerencia.nombre }}</button>
            </li>
          </ul>
        </div>
      </div>

      <LadoFormSection v-model="ladoA" etiqueta="Postura (Lado A)" :error="erroresServidor.ladoA" />
      <LadoFormSection v-model="ladoB" etiqueta="Contrapostura (Lado B)" :error="erroresServidor.ladoB" />

      <div v-if="erroresCliente.length || mensajeErrorServidor" class="resumen-errores">
        <p v-if="mensajeErrorServidor">{{ mensajeErrorServidor }}</p>
        <ul v-if="erroresCliente.length">
          <li v-for="problema in erroresCliente" :key="problema">{{ problema }}</li>
        </ul>
      </div>

      <div class="acciones">
        <button type="button" class="btn" @click="cancelar">Cancelar</button>
        <button type="submit" class="btn btn--solido" :disabled="enviando">
          {{ enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Publicar' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.formulario-vista {
  max-width: 760px;
  margin: 0 auto;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

h1 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--color-heading);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading);
}

input,
select {
  padding: 0.55rem 0.7rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
}

.contador {
  font-size: 0.78rem;
  color: var(--color-text);
  opacity: 0.7;
}

.contador--invalido {
  color: #dc2626;
  opacity: 1;
}

.error {
  font-size: 0.8rem;
  color: #dc2626;
}

.hashtags {
  position: relative;
}

.hashtags__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0 0 0.5rem;
  padding: 0;
  list-style: none;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
  font-size: 0.78rem;
  font-weight: 600;
}

.chip button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
}

.hashtags__sugerencias {
  position: absolute;
  z-index: 10;
  margin: 0.25rem 0 0;
  padding: 0.35rem;
  list-style: none;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  box-shadow: 0 12px 30px -15px rgba(0, 0, 0, 0.35);
}

.hashtags__sugerencias button {
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

.resumen-errores {
  padding: 0.8rem 1rem;
  border-radius: 10px;
  border: 1px solid #dc2626;
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  font-size: 0.85rem;
}

.resumen-errores ul {
  margin: 0.4rem 0 0;
  padding-left: 1.1rem;
}

.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn {
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn--solido {
  border-color: transparent;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
  text-decoration: none;
  display: inline-block;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.acceso-denegado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}
</style>
