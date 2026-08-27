import { httpClient } from './httpClient'
import { CacheService } from './cacheService'
import type { Categoria } from '@/models'

const KEY = 'lasdoscaras_categories'
const TTL_MS = 60 * 60 * 1000

interface CategoriaApi {
  id: string
  name: string
  deletedAt: string | null
}

interface RespuestaCategorias {
  categories: CategoriaApi[]
}

function mapearCategoria(categoria: CategoriaApi): Categoria {
  return {
    id: categoria.id,
    nombre: categoria.name,
    descripcion: '',
    activo: categoria.deletedAt === null,
  }
}

export async function obtenerCategoria(id: string): Promise<Categoria> {
  const respuesta = await httpClient.get<{ category: CategoriaApi }>(`/categories/${id}`)
  return mapearCategoria(respuesta.category)
}

export function invalidarCategoriasCache(): void {
  CacheService.remove(KEY)
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  return CacheService.obtenerConRevalidacion(KEY, TTL_MS, async () => {
    const respuesta = await httpClient.get<RespuestaCategorias>('/categories')
    return respuesta.categories.map(mapearCategoria)
  })
}
