<script setup lang="ts">
import { ref } from 'vue'
import type { Categoria, Hashtag } from '@/models'
import type { OrdenTablero } from '@/services/views'

const props = defineProps<{
  categoria: string | null
  hashtags: string[]
  orden: OrdenTablero
  categorias: Categoria[]
  hashtagsDisponibles: Hashtag[]
}>()

const emit = defineEmits<{
  'cambiar-categoria': [categoria: string | null]
  'agregar-hashtag': [hashtag: string]
  'quitar-hashtag': [hashtag: string]
  'cambiar-orden': [orden: OrdenTablero]
}>()

const hashtagSeleccionado = ref('')

const OPCIONES_ORDEN: Array<{ valor: OrdenTablero; etiqueta: string }> = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'likes_a', etiqueta: 'Más likes Lado A' },
  { valor: 'likes_b', etiqueta: 'Más likes Lado B' },
]

function onCategoriaChange(event: Event) {
  const valor = (event.target as HTMLSelectElement).value
  emit('cambiar-categoria', valor || null)
}

function onOrdenChange(event: Event) {
  emit('cambiar-orden', (event.target as HTMLSelectElement).value as OrdenTablero)
}

function agregarHashtag() {
  const valor = hashtagSeleccionado.value
  if (valor && !props.hashtags.includes(valor)) {
    emit('agregar-hashtag', valor)
  }
  hashtagSeleccionado.value = ''
}
</script>

<template>
  <aside class="filter-panel">
    <div class="filter-panel__field">
      <label for="filtro-categoria">Categoría</label>
      <select id="filtro-categoria" :value="categoria ?? ''" @change="onCategoriaChange">
        <option value="">Todas las categorías</option>
        <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
      </select>
    </div>

    <div class="filter-panel__field">
      <label for="filtro-hashtag">Hashtag</label>
      <select id="filtro-hashtag" v-model="hashtagSeleccionado" @change="agregarHashtag">
        <option value="">Agregar hashtag…</option>
        <option v-for="tag in hashtagsDisponibles" :key="tag.id" :value="tag.nombre">#{{ tag.nombre }}</option>
      </select>

      <ul v-if="hashtags.length" class="filter-panel__chips">
        <li v-for="tag in hashtags" :key="tag" class="chip">
          #{{ tag }}
          <button type="button" :aria-label="`Quitar hashtag ${tag}`" @click="emit('quitar-hashtag', tag)">×</button>
        </li>
      </ul>
    </div>

    <div class="filter-panel__field">
      <label for="filtro-orden">Ordenar por</label>
      <select id="filtro-orden" :value="orden" @change="onOrdenChange">
        <option v-for="opcion in OPCIONES_ORDEN" :key="opcion.valor" :value="opcion.valor">
          {{ opcion.etiqueta }}
        </option>
      </select>
    </div>
  </aside>
</template>

<style scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-soft);
}

.filter-panel__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-heading);
}

select {
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
}

.filter-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.4rem 0 0;
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
  padding: 0;
}

@media (max-width: 768px) {
  .filter-panel {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .filter-panel__field {
    flex: 1 1 160px;
  }
}
</style>
