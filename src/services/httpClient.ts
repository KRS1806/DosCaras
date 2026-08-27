import axios, { type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/stores/notifications'

export class NotFoundError extends Error {
  constructor(message = 'Recurso no encontrado.') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'No tenés permisos para realizar esta acción.') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class NetworkError extends Error {
  manejado = true

  constructor(message = 'No hay conexión a internet. Verificá tu conexión e intentá nuevamente.') {
    super(message)
    this.name = 'NetworkError'
  }
}

export interface ErrorDeValidacion {
  message: string
  campos?: Record<string, string[]>
}

const cliente = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

cliente.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

function esErrorDeRed(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response
}

function marcarManejado(error: Error): Error {
  Object.assign(error, { manejado: true })
  return error
}

function esManejado(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'manejado' in error && (error as { manejado?: boolean }).manejado === true
}

async function manejarError(error: unknown): Promise<never> {
  if (!axios.isAxiosError(error)) {
    throw error
  }

  const notificaciones = useNotifications()

  if (esErrorDeRed(error)) {
    notificaciones.error('No hay conexión a internet. Verificá tu conexión e intentá nuevamente.')
    throw new NetworkError()
  }

  const status = error.response?.status
  const data = error.response?.data as
    | { error?: string; details?: { fieldErrors?: Record<string, string[]> } }
    | undefined
  const mensaje = data?.error

  switch (status) {
    case 400:
      throw {
        message: mensaje ?? 'Los datos enviados no son válidos.',
        campos: data?.details?.fieldErrors,
      } as ErrorDeValidacion
    case 401: {
      const auth = useAuthStore()
      if (!auth.token) {
        notificaciones.error('Credenciales inválidas.')
        throw new Error('Credenciales inválidas.')
      }
      auth.cerrarSesion()
      notificaciones.error('Su sesión ha expirado.')
      const { default: router } = await import('@/router')
      router.push('/login')
      throw marcarManejado(new Error(mensaje ?? 'Su sesión ha expirado.'))
    }
    case 403:
      throw new ForbiddenError(mensaje)
    case 404:
      throw new NotFoundError(mensaje)
    case 409:
      throw {
        message: mensaje ?? 'La solicitud entra en conflicto con el estado actual del recurso.',
        campos: data?.details?.fieldErrors,
      } as ErrorDeValidacion
    case 422:
      throw {
        message: mensaje ?? 'No se pudo procesar la solicitud.',
        campos: data?.details?.fieldErrors,
      } as ErrorDeValidacion
    case 500:
    case 502:
    case 503:
      console.error('Error del servidor:', error)
      notificaciones.error('Ocurrió un error en el servidor. Intente más tarde.')
      throw marcarManejado(new Error('Ocurrió un error en el servidor. Intente más tarde.'))
    default:
      console.error('Error inesperado en la solicitud HTTP:', error)
      throw error
  }
}

async function solicitar<T>(config: AxiosRequestConfig, permitirReintento = true): Promise<T> {
  try {
    const response = await cliente.request<T>(config)
    return response.data
  } catch (error) {
    if (config.method?.toLowerCase() === 'get' && permitirReintento && esErrorDeRed(error)) {
      return solicitar<T>(config, false)
    }
    return manejarError(error)
  }
}

export const httpClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) => solicitar<T>({ ...config, url, method: 'get' }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    solicitar<T>({ ...config, url, data, method: 'post' }),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    solicitar<T>({ ...config, url, data, method: 'put' }),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    solicitar<T>({ ...config, url, data, method: 'patch' }),
  delete: <T>(url: string, config?: AxiosRequestConfig) => solicitar<T>({ ...config, url, method: 'delete' }),
}

export function extraerMensajeError(error: unknown, mensajePorDefecto: string): string {
  if (error instanceof NotFoundError || error instanceof Error) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const mensaje = (error as { message?: unknown }).message
    if (typeof mensaje === 'string') {
      return mensaje
    }
  }
  return mensajePorDefecto
}

export function notificarErrorNoManejado(error: unknown, mensajePorDefecto: string): void {
  if (esManejado(error)) {
    return
  }
  useNotifications().error(extraerMensajeError(error, mensajePorDefecto))
}
