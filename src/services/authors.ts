import { httpClient } from './httpClient'

export interface PerfilAutor {
  id: string
  nombre: string
  fechaRegistro: string
}

interface AutorApi {
  id: string
  name: string
  createdAt: string
}

function mapearAutor(autor: AutorApi): PerfilAutor {
  return {
    id: autor.id,
    nombre: autor.name,
    fechaRegistro: autor.createdAt,
  }
}

export async function obtenerAutor(id: string): Promise<PerfilAutor> {
  const respuesta = await httpClient.get<{ author: AutorApi }>(`/authors/${id}`)
  return mapearAutor(respuesta.author)
}
