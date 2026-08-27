import { httpClient } from './httpClient'
import { obtenerMisFavoritosIds } from './users'
import { useAuthStore } from '@/stores/auth'
import { useFavoritosStore } from '@/stores/favoritos'
import type { Usuario } from '@/models'

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface UsuarioApi {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: string
}

export interface RegisterResponse {
  user: UsuarioApi
  activationToken: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: UsuarioApi
}

export function mapearUsuario(usuario: UsuarioApi): Usuario {
  return {
    id: usuario.id,
    nombre: usuario.name,
    email: usuario.email,
    rol: usuario.role.toLowerCase() === 'superadmin' ? 'superadmin' : 'user',
    estado: usuario.status.toLowerCase() === 'suspended' ? 'baneado' : 'activo',
    fechaRegistro: usuario.createdAt,
  }
}

export function register(payload: RegisterPayload) {
  return httpClient.post<RegisterResponse>('/auth/register', payload)
}

export function activate(token: string) {
  return httpClient.get<{ user: UsuarioApi }>(`/auth/activate/${token}`)
}

export async function login(payload: LoginPayload) {
  const response = await httpClient.post<LoginResponse>('/auth/login', payload)
  useAuthStore().iniciarSesion(response.token, mapearUsuario(response.user))
  sincronizarFavoritosTrasLogin()
  return response
}

function sincronizarFavoritosTrasLogin(): void {
  obtenerMisFavoritosIds()
    .then((ids) => useFavoritosStore().sincronizarIds(ids))
    .catch(() => {})
}

export function logout() {
  useAuthStore().cerrarSesion()
}

export async function obtenerPerfilActual(): Promise<Usuario> {
  const respuesta = await httpClient.get<{ user: UsuarioApi }>('/auth/me')
  return mapearUsuario(respuesta.user)
}
