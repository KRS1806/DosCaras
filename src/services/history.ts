import { CacheService } from './cacheService'

const KEY = 'lasdoscaras_history'
const MAX_ENTRADAS = 20

export interface EntradaHistorial {
  id: string
  titulo: string
  categoria: string
  fechaVisita: string
}

export function obtenerHistorial(): EntradaHistorial[] {
  const entradas = CacheService.get<EntradaHistorial[]>(KEY) ?? []
  return entradas.slice(0, MAX_ENTRADAS)
}

export function limpiarHistorial(): void {
  CacheService.remove(KEY)
}
