import { httpClient } from './httpClient'
import { CacheService } from './cacheService'
import type { Hashtag } from '@/models'

const KEY = 'lasdoscaras_hashtags'
const TTL_MS = 30 * 60 * 1000

interface HashtagApi {
  id: string
  name: string
}

interface RespuestaHashtags {
  hashtags: HashtagApi[]
}

function mapearHashtag(hashtag: HashtagApi): Hashtag {
  return {
    id: hashtag.id,
    nombre: hashtag.name,
  }
}

export function invalidarHashtagsCache(): void {
  CacheService.remove(KEY)
}

export async function buscarHashtags(termino: string): Promise<Hashtag[]> {
  const respuesta = await httpClient.get<RespuestaHashtags>('/hashtags', { params: { q: termino } })
  return respuesta.hashtags.map(mapearHashtag)
}

export async function obtenerHashtags(): Promise<Hashtag[]> {
  return CacheService.obtenerConRevalidacion(KEY, TTL_MS, async () => {
    const respuesta = await httpClient.get<RespuestaHashtags>('/hashtags')
    return respuesta.hashtags.map(mapearHashtag)
  })
}
