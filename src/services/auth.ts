import http from './http'
import { setToken, clearToken } from './authState'

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface RegisterUser {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: string
}

export interface RegisterResponse {
  user: RegisterUser
  activationToken: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string | number
    username: string
    email: string
  }
}

export function register(payload: RegisterPayload) {
  return http.post<RegisterResponse>('/auth/register', payload)
}

export function activate(token: string) {
  return http.get<{ user: RegisterUser }>(`/auth/activate/${token}`)
}

export async function login(payload: LoginPayload) {
  const response = await http.post<LoginResponse>('/auth/login', payload)
  setToken(response.data.token)
  return response
}

export function logout() {
  clearToken()
}
