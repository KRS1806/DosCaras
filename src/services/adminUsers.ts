import { httpClient } from './httpClient'
import { mapearUsuario, type UsuarioApi } from './auth'
import type { Usuario } from '@/models'

interface RespuestaUsuariosApi {
  total: number
  page: number
  limit: number
  users: UsuarioApi[]
}

export interface ConsultaUsuarios {
  page: number
  limit: number
  search?: string
}

export interface RespuestaUsuarios {
  data: Usuario[]
  total: number
  page: number
  limit: number
}

export async function obtenerUsuarios(consulta: ConsultaUsuarios): Promise<RespuestaUsuarios> {
  const respuesta = await httpClient.get<RespuestaUsuariosApi>('/admin/users', {
    params: {
      page: consulta.page,
      limit: consulta.limit,
      search: consulta.search,
    },
  })

  return {
    data: respuesta.users.map(mapearUsuario),
    total: respuesta.total,
    page: respuesta.page,
    limit: respuesta.limit,
  }
}

export async function banearUsuario(id: string): Promise<Usuario> {
  const respuesta = await httpClient.patch<{ user: UsuarioApi }>(`/admin/users/${id}/ban`)
  return mapearUsuario(respuesta.user)
}

export async function desbanearUsuario(id: string): Promise<Usuario> {
  const respuesta = await httpClient.patch<{ user: UsuarioApi }>(`/admin/users/${id}/unban`)
  return mapearUsuario(respuesta.user)
}
