<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { obtenerTodasCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from '@/services/adminCategories'
import { extraerMensajeError, notificarErrorNoManejado } from '@/services/httpClient'
import { useNotifications } from '@/stores/notifications'
import type { Categoria } from '@/models'

const notificaciones = useNotifications()

const categorias = ref<Categoria[]>([])
const cargando = ref(true)
const mensajeError = ref('')

const mostrandoFormulario = ref(false)
const editandoId = ref<string | null>(null)
const nombreFormulario = ref('')
const errorFormulario = ref('')
const guardando = ref(false)

const idEliminando = ref<string | null>(null)

async function cargarCategorias() {
  cargando.value = true
  mensajeError.value = ''
  try {
    categorias.value = await obtenerTodasCategorias()
  } catch (error) {
    mensajeError.value = extraerMensajeError(error, 'No se pudieron cargar las categorías.')
  } finally {
    cargando.value = false
  }
}

function abrirCrear() {
  editandoId.value = null
  nombreFormulario.value = ''
  errorFormulario.value = ''
  mostrandoFormulario.value = true
}

function abrirEditar(categoria: Categoria) {
  editandoId.value = categoria.id
  nombreFormulario.value = categoria.nombre
  errorFormulario.value = ''
  mostrandoFormulario.value = true
}

function cerrarFormulario() {
  mostrandoFormulario.value = false
}

function nombreDuplicado(nombre: string): boolean {
  const limpio = nombre.trim().toLowerCase()
  return categorias.value.some((cat) => cat.id !== editandoId.value && cat.nombre.trim().toLowerCase() === limpio)
}

async function guardarCategoria() {
  const nombre = nombreFormulario.value.trim()
  errorFormulario.value = ''

  if (!nombre) {
    errorFormulario.value = 'El nombre es obligatorio.'
    return
  }
  if (nombreDuplicado(nombre)) {
    errorFormulario.value = 'Ya existe una categoría con ese nombre.'
    return
  }

  guardando.value = true
  try {
    if (editandoId.value) {
      const actualizada = await actualizarCategoria(editandoId.value, nombre)
      const indice = categorias.value.findIndex((cat) => cat.id === editandoId.value)
      if (indice !== -1) {
        categorias.value[indice] = actualizada
      }
      notificaciones.success('Categoría actualizada.')
    } else {
      categorias.value.push(await crearCategoria(nombre))
      notificaciones.success('Categoría creada.')
    }
    mostrandoFormulario.value = false
  } catch (error) {
    errorFormulario.value = extraerMensajeError(error, 'No se pudo guardar la categoría.')
  } finally {
    guardando.value = false
  }
}

async function desactivar(categoria: Categoria) {
  const confirmado = window.confirm(
    `¿Seguro que deseas eliminar la categoría "${categoria.nombre}"? Esta acción no se puede revertir desde el panel.`,
  )
  if (!confirmado) {
    return
  }

  idEliminando.value = categoria.id
  try {
    await eliminarCategoria(categoria.id)
    categoria.activo = false
    notificaciones.success('Categoría eliminada.')
  } catch (error) {
    notificarErrorNoManejado(error, 'No se pudo eliminar la categoría.')
  } finally {
    idEliminando.value = null
  }
}

onMounted(cargarCategorias)
</script>

<template>
  <div class="admin-categorias">
    <div class="encabezado">
      <h1>Gestión de categorías</h1>
      <button type="button" class="btn btn--solido" @click="abrirCrear">Nueva categoría</button>
    </div>

    <div v-if="mostrandoFormulario" class="formulario">
      <h2>{{ editandoId ? 'Editar categoría' : 'Nueva categoría' }}</h2>
      <div class="campo">
        <label for="nombre-categoria">Nombre</label>
        <input id="nombre-categoria" v-model="nombreFormulario" type="text" required />
        <span v-if="errorFormulario" class="error">{{ errorFormulario }}</span>
      </div>
      <div class="acciones-formulario">
        <button type="button" class="btn" @click="cerrarFormulario">Cancelar</button>
        <button type="button" class="btn btn--solido" :disabled="guardando" @click="guardarCategoria">
          {{ guardando ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </div>

    <p v-if="cargando">Cargando categorías…</p>

    <div v-else-if="mensajeError" class="estado">
      <p>{{ mensajeError }}</p>
      <button type="button" class="btn" @click="cargarCategorias">Reintentar</button>
    </div>

    <div v-else-if="categorias.length === 0" class="estado">
      <p>No hay categorías creadas.</p>
    </div>

    <div v-else class="tabla-wrapper">
      <table class="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="categoria in categorias" :key="categoria.id">
            <td>{{ categoria.nombre }}</td>
            <td>
              <span :class="['badge', categoria.activo ? 'badge--activo' : 'badge--baneado']">
                {{ categoria.activo ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td>
              <div class="acciones-fila">
                <button type="button" class="btn" @click="abrirEditar(categoria)">Editar</button>
                <button
                  v-if="categoria.activo"
                  type="button"
                  class="btn"
                  :disabled="idEliminando === categoria.id"
                  @click="desactivar(categoria)"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.admin-categorias {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h1 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--color-heading);
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  max-width: 420px;
}

.formulario h2 {
  margin: 0;
  font-size: 1.05rem;
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

input {
  padding: 0.55rem 0.7rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
}

.error {
  font-size: 0.8rem;
  color: #dc2626;
}

.acciones-formulario {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
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
}

.btn--solido {
  border-color: transparent;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
}

.btn:disabled {
  opacity: 0.6;
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
