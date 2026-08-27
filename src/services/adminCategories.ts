import { httpClient } from './httpClient'
import { invalidarCategoriasCache } from './categories'
import type { Categoria } from '@/models'

interface CategoriaApi {
  id: string
  name: string
  deletedAt: string | null
}

function mapearCategoria(categoria: CategoriaApi): Categoria {
  return {
    id: categoria.id,
    nombre: categoria.name,
    descripcion: '',
    activo: categoria.deletedAt === null,
  }
}

export async function obtenerTodasCategorias(): Promise<Categoria[]> {
  const respuesta = await httpClient.get<{ categories: CategoriaApi[] }>('/admin/categories')
  return respuesta.categories.map(mapearCategoria)
}

export async function crearCategoria(nombre: string): Promise<Categoria> {
  const respuesta = await httpClient.post<{ category: CategoriaApi }>('/admin/categories', { name: nombre })
  invalidarCategoriasCache()
  return mapearCategoria(respuesta.category)
}

export async function actualizarCategoria(id: string, nombre: string): Promise<Categoria> {
  const respuesta = await httpClient.put<{ category: CategoriaApi }>(`/admin/categories/${id}`, { name: nombre })
  invalidarCategoriasCache()
  return mapearCategoria(respuesta.category)
}

export async function eliminarCategoria(id: string): Promise<void> {
  await httpClient.delete<void>(`/admin/categories/${id}`)
  invalidarCategoriasCache()
}
