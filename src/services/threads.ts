import { httpClient } from './httpClient'
import type { Comentario, HiloComentarios } from '@/models'

// Shape real confirmado contra el código del backend (barroyo/doscarasapi).
// No existe moderación de comentarios (ni campo de estado ni servicio de IA).
interface ComentarioApi {
  id: string
  content: string
  user: { id: string; name: string }
  createdAt: string
  replies?: ComentarioApi[]
}

interface HiloApi {
  id: string
  title: string | null
  comments: ComentarioApi[]
}

function mapearComentario(raw: ComentarioApi): Comentario {
  return {
    id: raw.id,
    texto: raw.content,
    autor: { id: raw.user.id, nombre: raw.user.name },
    fechaCreacion: raw.createdAt,
    respuestas: (raw.replies ?? []).map(mapearComentario),
  }
}

function mapearHilo(raw: HiloApi): HiloComentarios {
  return {
    id: raw.id,
    tema: raw.title,
    comentarios: raw.comments.map(mapearComentario),
  }
}

export async function obtenerHilos(vistaId: string): Promise<HiloComentarios[]> {
  const respuesta = await httpClient.get<{ threads: HiloApi[] }>(`/views/${vistaId}/threads`)
  return respuesta.threads.map(mapearHilo)
}

export function crearHilo(vistaId: string, contenido: string, titulo?: string) {
  return httpClient.post<{ thread: HiloApi }>(`/views/${vistaId}/threads`, {
    title: titulo?.trim() || undefined,
    content: contenido,
  })
}

export function comentarEnHilo(vistaId: string, hiloId: string, contenido: string) {
  return httpClient.post<{ comment: ComentarioApi }>(`/views/${vistaId}/threads/${hiloId}/comments`, {
    content: contenido,
  })
}
