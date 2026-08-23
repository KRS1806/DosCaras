import { httpClient } from './httpClient'

interface RespuestaFavoritosApi {
  favorites: string[]
}

export async function obtenerMisFavoritosIds(): Promise<string[]> {
  const respuesta = await httpClient.get<RespuestaFavoritosApi>('/users/me/favorites')
  return respuesta.favorites
}
