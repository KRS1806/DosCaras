import { defineStore } from 'pinia'
import { CacheService } from '@/services/cacheService'
import type { Usuario } from '@/models'

const AUTH_KEY = 'lasdoscaras_auth'
const FAVORITES_KEY = 'lasdoscaras_favorites'

interface AuthPersistido {
  token: string
  usuario: Usuario
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    usuario: null as Usuario | null,
  }),
  getters: {
    estaAutenticado: (state) => state.token !== null,
    esSuperadmin: (state) => state.usuario?.rol === 'superadmin',
  },
  actions: {
    iniciarSesion(token: string, usuario: Usuario) {
      this.token = token
      this.usuario = usuario
      CacheService.set<AuthPersistido>(AUTH_KEY, { token, usuario })
    },
    cerrarSesion() {
      this.token = null
      this.usuario = null
      CacheService.remove(AUTH_KEY)
      CacheService.remove(FAVORITES_KEY)
    },
    restaurarSesion() {
      const persistido = CacheService.get<AuthPersistido>(AUTH_KEY)
      if (persistido) {
        this.token = persistido.token
        this.usuario = persistido.usuario
      }
    },
  },
})
