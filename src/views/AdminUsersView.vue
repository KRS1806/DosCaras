<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { obtenerUsuarios, banearUsuario, desbanearUsuario } from '@/services/adminUsers'
import { extraerMensajeError } from '@/services/httpClient'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/stores/notifications'
import type { Usuario } from '@/models'

const LIMITE = 20
const DEBOUNCE_MS = 300

const auth = useAuthStore()
const notificaciones = useNotifications()

const usuarios = ref<Usuario[]>([])
const total = ref(0)
const pagina = ref(1)
const busqueda = ref('')
const cargando = ref(false)
const mensajeError = ref('')
const idEnProceso = ref<string | null>(null)

const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE)))

async function cargarUsuarios() {
  cargando.value = true
  mensajeError.value = ''
  try {
    const respuesta = await obtenerUsuarios({
      page: pagina.value,
      limit: LIMITE,
      search: busqueda.value.trim() || undefined,
    })
    usuarios.value = respuesta.data
    total.value = respuesta.total
  } catch (error) {
    usuarios.value = []
    mensajeError.value = extraerMensajeError(error, 'No se pudo cargar la lista de usuarios.')
  } finally {
    cargando.value = false
  }
}

let debounceId: ReturnType<typeof setTimeout> | undefined

watch(busqueda, () => {
  if (debounceId) {
    clearTimeout(debounceId)
  }
  debounceId = setTimeout(() => {
    pagina.value = 1
    cargarUsuarios()
  }, DEBOUNCE_MS)
})

function irAPagina(nueva: number) {
  if (nueva < 1 || nueva > totalPaginas.value) {
    return
  }
  pagina.value = nueva
  cargarUsuarios()
}

async function alternarBaneo(usuario: Usuario) {
  const banear = usuario.estado === 'activo'
  const confirmado = window.confirm(
    banear ? `¿Seguro que deseas banear a ${usuario.nombre}?` : `¿Seguro que deseas desbanear a ${usuario.nombre}?`,
  )
  if (!confirmado) {
    return
  }

  idEnProceso.value = usuario.id
  try {
    const actualizado = banear ? await banearUsuario(usuario.id) : await desbanearUsuario(usuario.id)
    const indice = usuarios.value.findIndex((u) => u.id === usuario.id)
    if (indice !== -1) {
      usuarios.value[indice] = actualizado
    }
    notificaciones.success(banear ? 'Usuario baneado.' : 'Usuario desbaneado.')
  } catch (error) {
    notificaciones.error(extraerMensajeError(error, 'No se pudo completar la acción.'))
  } finally {
    idEnProceso.value = null
  }
}

function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(new Date(fecha))
}

onMounted(cargarUsuarios)
</script>

<template>
  <div class="admin-usuarios">
    <h1>Gestión de usuarios</h1>

    <input
      v-model="busqueda"
      type="search"
      class="buscador"
      placeholder="Buscar por nombre o correo…"
      aria-label="Buscar usuarios"
    />

    <p v-if="cargando">Cargando usuarios…</p>

    <div v-else-if="mensajeError" class="estado">
      <p>{{ mensajeError }}</p>
      <button type="button" class="btn" @click="cargarUsuarios">Reintentar</button>
    </div>

    <div v-else-if="usuarios.length === 0" class="estado">
      <p>No se encontraron usuarios.</p>
    </div>

    <template v-else>
      <div class="tabla-wrapper">
        <table class="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha de registro</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.id">
              <td>{{ usuario.nombre }}</td>
              <td>{{ usuario.email }}</td>
              <td>{{ usuario.rol === 'superadmin' ? 'Superadministrador' : 'Usuario' }}</td>
              <td>
                <span :class="['badge', usuario.estado === 'activo' ? 'badge--activo' : 'badge--baneado']">
                  {{ usuario.estado === 'activo' ? 'Activo' : 'Baneado' }}
                </span>
              </td>
              <td>{{ formatearFecha(usuario.fechaRegistro) }}</td>
              <td>
                <button
                  v-if="usuario.id !== auth.usuario?.id"
                  type="button"
                  class="btn"
                  :disabled="idEnProceso === usuario.id"
                  @click="alternarBaneo(usuario)"
                >
                  {{ usuario.estado === 'activo' ? 'Banear' : 'Desbanear' }}
                </button>
                <span v-else class="nota">No puedes banearte a ti mismo</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="totalPaginas > 1" class="paginacion" aria-label="Paginación de usuarios">
        <button type="button" :disabled="pagina === 1" @click="irAPagina(pagina - 1)">Anterior</button>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <button type="button" :disabled="pagina === totalPaginas" @click="irAPagina(pagina + 1)">Siguiente</button>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.admin-usuarios {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

h1 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--color-heading);
}

.buscador {
  max-width: 360px;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nota {
  font-size: 0.78rem;
  color: var(--color-text);
  opacity: 0.65;
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
