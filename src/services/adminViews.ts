import { httpClient } from './httpClient'
import { mapearPublicacion } from './views'
import type { Publicacion } from '@/models'

export type EstadoFiltro = 'todas' | 'publicadas' | 'despublicadas'

// Shape real confirmado contra el código del backend (barroyo/doscarasapi):
// GET /admin/views usa listViewsForAdmin, que devuelve el mismo shape que
// GET /views ({ total, page, limit, views: [...] }), por eso se reutiliza
// mapearPublicacion. status acepta 'PUBLISHED' | 'UNPUBLISHED', opcional
// (omitirlo devuelve todas).
const ESTADO_API: Record<EstadoFiltro, 'PUBLISHED' | 'UNPUBLISHED' | undefined> = {
  todas: undefined,
  publicadas: 'PUBLISHED',
  despublicadas: 'UNPUBLISHED',
}

interface RespuestaVistasAdminApi {
  total: number
  page: number
  limit: number
  views: unknown[]
}

export interface ConsultaVistasAdmin {
  page: number
  limit: number
  estado: EstadoFiltro
}

export interface RespuestaVistasAdmin {
  data: Publicacion[]
  total: number
  page: number
  limit: number
}

export async function obtenerVistasAdmin(consulta: ConsultaVistasAdmin): Promise<RespuestaVistasAdmin> {
  const respuesta = await httpClient.get<RespuestaVistasAdminApi>('/admin/views', {
    params: {
      page: consulta.page,
      limit: consulta.limit,
      status: ESTADO_API[consulta.estado],
    },
  })

  return {
    data: respuesta.views.map(mapearPublicacion),
    total: respuesta.total,
    page: respuesta.page,
    limit: respuesta.limit,
  }
}
