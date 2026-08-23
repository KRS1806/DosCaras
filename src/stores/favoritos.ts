import { defineStore } from 'pinia'
import { CacheService } from '@/services/cacheService'
import { agregarFavorito, quitarFavorito } from '@/services/views'
import { useNotifications } from './notifications'

const KEY = 'lasdoscaras_favorites'

export const useFavoritosStore = defineStore('favoritos', {
  state: () => ({
    ids: new Set<string>(CacheService.get<string[]>(KEY) ?? []),
  }),
  actions: {
    esFavorito(id: string): boolean {
      return this.ids.has(id)
    },
    async alternar(id: string) {
      const notificaciones = useNotifications()
      const eraFavorito = this.ids.has(id)

      if (eraFavorito) {
        this.ids.delete(id)
      } else {
        this.ids.add(id)
      }
      CacheService.set(KEY, Array.from(this.ids))

      try {
        if (eraFavorito) {
          await quitarFavorito(id)
        } else {
          await agregarFavorito(id)
        }
      } catch {
        if (eraFavorito) {
          this.ids.add(id)
        } else {
          this.ids.delete(id)
        }
        CacheService.set(KEY, Array.from(this.ids))
        notificaciones.error('No se pudo actualizar el favorito. Intenta de nuevo.')
      }
    },
    recargarDesdeCache() {
      this.ids = new Set(CacheService.get<string[]>(KEY) ?? [])
    },
    // Sincroniza con la lista de IDs que devuelve el servidor (perfil), y
    // solo escribe la caché si realmente cambió.
    sincronizarIds(idsServidor: string[]) {
      const actuales = Array.from(this.ids).sort()
      const nuevos = [...idsServidor].sort()
      if (JSON.stringify(actuales) === JSON.stringify(nuevos)) {
        return
      }
      this.ids = new Set(idsServidor)
      CacheService.set(KEY, idsServidor)
    },
  },
})
