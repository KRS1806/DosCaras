import { httpClient } from './httpClient'
import type { Fuente, Lado, Publicacion } from '@/models'

export type OrdenTablero = 'recientes' | 'likes_a' | 'likes_b'

export interface ConsultaVistas {
  page: number
  limit: number
  category?: string
  hashtag?: string
  sort?: OrdenTablero
  autor?: 'me'
}

const ORDEN_API: Record<OrdenTablero, 'recent' | 'likes'> = {
  recientes: 'recent',
  likes_a: 'likes',
  likes_b: 'likes',
}

interface RespuestaVistasApi {
  total: number
  page: number
  limit: number
  views: unknown[]
}

export interface RespuestaVistas {
  data: Publicacion[]
  total: number
  page: number
  limit: number
}

const TIPO_FUENTE_DESDE_API: Record<string, Fuente['tipo']> = {
  LINK: 'enlace',
  YOUTUBE: 'youtube',
  DOCUMENT: 'documento',
}

const TIPO_FUENTE_A_API: Record<Fuente['tipo'], string> = {
  enlace: 'LINK',
  youtube: 'YOUTUBE',
  documento: 'DOCUMENT',
}

interface FuenteApi {
  id?: string
  type: string
  url: string
  label?: string | null
}

function mapearFuente(fuente: FuenteApi): Fuente {
  return {
    id: fuente.id ?? crypto.randomUUID(),
    tipo: TIPO_FUENTE_DESDE_API[fuente.type] ?? 'enlace',
    url: fuente.url,
    titulo: fuente.label ?? '',
  }
}

interface LadoApi {
  type: 'SIDE' | 'COUNTERPART'
  title: string
  description?: string
  sources?: FuenteApi[]
  likeCount?: number
  dislikeCount?: number
}

function ladoVacio(): Lado {
  return { titulo: '', descripcion: '', likes: 0, dislikes: 0, fuentes: [] }
}

function mapearLado(lado: LadoApi): Lado {
  return {
    titulo: lado.title,
    descripcion: lado.description ?? '',
    likes: lado.likeCount ?? 0,
    dislikes: lado.dislikeCount ?? 0,
    fuentes: (lado.sources ?? []).map(mapearFuente),
  }
}

export function mapearPublicacion(raw: unknown): Publicacion {
  const item = raw as {
    id: string
    author: { id: string; name: string }
    category: { id: string; name: string; deletedAt?: string | null }
    sides: LadoApi[]
    hashtags?: Array<{ name: string } | string>
    status: string
    createdAt: string
  }

  const ladoSide = item.sides.find((lado) => lado.type === 'SIDE')
  const ladoCounterpart = item.sides.find((lado) => lado.type === 'COUNTERPART')

  const ladoA = ladoSide ? mapearLado(ladoSide) : ladoVacio()
  const ladoB = ladoCounterpart ? mapearLado(ladoCounterpart) : ladoVacio()

  return {
    id: item.id,
    titulo: ladoA.titulo,
    descripcion: ladoA.descripcion,
    autor: { id: item.author.id, nombre: item.author.name },
    ladoA,
    ladoB,
    categoria: {
      id: item.category.id,
      nombre: item.category.name,
      descripcion: '',
      activo: (item.category.deletedAt ?? null) === null,
    },
    hashtags: (item.hashtags ?? []).map((tag) => (typeof tag === 'string' ? tag : tag.name)),
    publicado: item.status === 'PUBLISHED',
    fechaCreacion: item.createdAt,
  }
}

export async function obtenerVistas(consulta: ConsultaVistas): Promise<RespuestaVistas> {
  const respuesta = await httpClient.get<RespuestaVistasApi>('/views', {
    params: {
      page: consulta.page,
      limit: consulta.limit,
      category: consulta.category,
      hashtag: consulta.hashtag,
      sort: consulta.sort ? ORDEN_API[consulta.sort] : undefined,
      autor: consulta.autor,
    },
  })

  return {
    data: respuesta.views.map(mapearPublicacion),
    total: respuesta.total,
    page: respuesta.page,
    limit: respuesta.limit,
  }
}

export async function obtenerVista(id: string): Promise<Publicacion> {
  const respuesta = await httpClient.get<{ view: unknown }>(`/views/${id}`)
  return mapearPublicacion(respuesta.view)
}

export interface FuentePayload {
  tipo: Fuente['tipo']
  url: string
  titulo: string
}

export interface LadoPayload {
  titulo: string
  descripcion: string
  fuentes: FuentePayload[]
}

export interface PublicacionPayload {
  categoriaId: string
  hashtags: string[]
  ladoA: LadoPayload
  ladoB: LadoPayload
}

function mapearFuentePayload(fuente: FuentePayload) {
  const wire: { type: string; url: string; label?: string } = {
    type: TIPO_FUENTE_A_API[fuente.tipo],
    url: fuente.url,
  }
  if (fuente.titulo.trim()) {
    wire.label = fuente.titulo.trim()
  }
  return wire
}

function mapearLadoPayload(lado: LadoPayload) {
  return {
    title: lado.titulo,
    description: lado.descripcion,
    sources: lado.fuentes.map(mapearFuentePayload),
  }
}

function mapearPublicacionPayload(payload: PublicacionPayload) {
  return {
    categoryId: payload.categoriaId,
    hashtags: payload.hashtags,
    side: mapearLadoPayload(payload.ladoA),
    counterpart: mapearLadoPayload(payload.ladoB),
  }
}

export async function crearVista(payload: PublicacionPayload): Promise<Publicacion> {
  const respuesta = await httpClient.post<{ view: unknown }>('/views', mapearPublicacionPayload(payload))
  return mapearPublicacion(respuesta.view)
}

export async function actualizarVista(id: string, payload: PublicacionPayload): Promise<Publicacion> {
  const respuesta = await httpClient.put<{ view: unknown }>(`/views/${id}`, mapearPublicacionPayload(payload))
  return mapearPublicacion(respuesta.view)
}

export function agregarFavorito(id: string) {
  return httpClient.post<void>(`/views/${id}/favorite`)
}

export function quitarFavorito(id: string) {
  return httpClient.delete<void>(`/views/${id}/favorite`)
}
