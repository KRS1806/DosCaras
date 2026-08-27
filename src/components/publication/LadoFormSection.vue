<script setup lang="ts">
import type { FuentePayload, LadoPayload } from '@/services/views'
import { idVideoYoutube } from '@/utils/youtube'

defineProps<{
  etiqueta: string
  error?: string
}>()

const modelo = defineModel<LadoPayload>({ required: true })

const OPCIONES_TIPO: Array<{ valor: FuentePayload['tipo']; etiqueta: string }> = [
  { valor: 'enlace', etiqueta: 'Enlace' },
  { valor: 'youtube', etiqueta: 'YouTube' },
  { valor: 'documento', etiqueta: 'Documento' },
]

function agregarFuente() {
  modelo.value.fuentes.push({ tipo: 'enlace', url: '', titulo: '' })
}

function quitarFuente(indice: number) {
  modelo.value.fuentes.splice(indice, 1)
}

</script>

<template>
  <fieldset class="lado">
    <legend>{{ etiqueta }}</legend>

    <div class="campo">
      <label>Título</label>
      <input v-model="modelo.titulo" type="text" required />
    </div>

    <div class="campo">
      <label>Argumento (opcional)</label>
      <textarea v-model="modelo.descripcion" rows="5"></textarea>
      <span class="contador">{{ modelo.descripcion.length }} caracteres</span>
    </div>

    <div class="fuentes">
      <div class="fuentes__encabezado">
        <h4>Fuentes</h4>
        <button type="button" class="btn btn--ghost" @click="agregarFuente">Agregar fuente</button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div v-for="(fuente, indice) in modelo.fuentes" :key="indice" class="fuente">
        <select v-model="fuente.tipo">
          <option v-for="opcion in OPCIONES_TIPO" :key="opcion.valor" :value="opcion.valor">
            {{ opcion.etiqueta }}
          </option>
        </select>
        <input v-model="fuente.url" type="url" placeholder="URL" required />
        <input v-model="fuente.titulo" type="text" placeholder="Título de la fuente (opcional)" />
        <button type="button" class="btn btn--icono" aria-label="Quitar fuente" @click="quitarFuente(indice)">
          ×
        </button>

        <iframe
          v-if="idVideoYoutube(fuente.url)"
          class="fuente__embed"
          :src="`https://www.youtube.com/embed/${idVideoYoutube(fuente.url)}`"
          title="Vista previa de YouTube"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
.lado {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

legend {
  font-weight: 700;
  color: var(--color-heading);
  padding: 0 0.3rem;
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
select,
textarea {
  padding: 0.55rem 0.7rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
  font-family: inherit;
}

.contador {
  font-size: 0.78rem;
  color: var(--color-text);
  opacity: 0.7;
}

.fuentes__encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fuentes__encabezado h4 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-heading);
}

.fuente {
  display: grid;
  grid-template-columns: 130px 1fr 1fr auto;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.6rem;
}

.fuente__embed {
  grid-column: 1 / -1;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: none;
  border-radius: 8px;
}

.btn {
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn--icono {
  padding: 0.4rem 0.6rem;
  font-size: 1rem;
  line-height: 1;
}

.error {
  margin: 0;
  color: #dc2626;
  font-size: 0.82rem;
}

@media (max-width: 640px) {
  .fuente {
    grid-template-columns: 1fr;
  }
}
</style>
