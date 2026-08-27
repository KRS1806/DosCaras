import { CacheService } from './cacheService'

const KEY = 'lasdoscaras_history'
const MAX_ENTRADAS = 20

export interface EntradaHistorial {
  id: string
  titulo: string
  categoria: string
  fechaVista: string
}

export function obtenerHistorial(): EntradaHistorial[] {
  const entradas = CacheService.get<EntradaHistorial[]>(KEY) ?? []
  return entradas.slice(0, MAX_ENTRADAS)
}

export function limpiarHistorial(): void {
  CacheService.remove(KEY)
}

export function registrarVisita(entrada: Omit<EntradaHistorial, 'fechaVista'>): void {
  const entradas = CacheService.get<EntradaHistorial[]>(KEY) ?? []
  const sinDuplicado = entradas.filter((existente) => existente.id !== entrada.id)
  const nueva: EntradaHistorial = { ...entrada, fechaVista: new Date().toISOString() }
  CacheService.set(KEY, [nueva, ...sinDuplicado].slice(0, MAX_ENTRADAS))
}
