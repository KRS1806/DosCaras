import { httpClient } from './httpClient'
import { mapearPublicacion } from './views'
import type { Publicacion } from '@/models'

interface RespuestaBusquedaApi {
  views: unknown[]
}

export async function buscarPublicaciones(termino: string): Promise<Publicacion[]> {
  const respuesta = await httpClient.get<RespuestaBusquedaApi>('/search', {
    params: { q: termino },
  })
  return respuesta.views.map(mapearPublicacion)
}
