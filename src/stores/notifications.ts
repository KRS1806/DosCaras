import { defineStore } from 'pinia'

export type TipoNotificacion = 'success' | 'error' | 'warning' | 'info'

export interface Notificacion {
  id: number
  tipo: TipoNotificacion
  mensaje: string
}

const MAX_VISIBLES = 4

// Duración de autocierre por tipo (ms): error se mantiene más tiempo visible.
const DURACION_MS: Record<TipoNotificacion, number> = {
  error: 4500,
  warning: 3500,
  success: 3000,
  info: 3000,
}

let siguienteId = 1

export const useNotifications = defineStore('notifications', {
  state: () => ({
    items: [] as Notificacion[],
  }),
  actions: {
    notificar(tipo: TipoNotificacion, mensaje: string) {
      const id = siguienteId++
      this.items.push({ id, tipo, mensaje })
      if (this.items.length > MAX_VISIBLES) {
        this.items.shift()
      }
      setTimeout(() => this.descartar(id), DURACION_MS[tipo])
    },
    success(mensaje: string) {
      this.notificar('success', mensaje)
    },
    error(mensaje: string) {
      this.notificar('error', mensaje)
    },
    warning(mensaje: string) {
      this.notificar('warning', mensaje)
    },
    info(mensaje: string) {
      this.notificar('info', mensaje)
    },
    descartar(id: number) {
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
