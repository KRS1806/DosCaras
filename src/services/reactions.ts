import { httpClient } from './httpClient'
import type { Lado } from '@/models'

// Shape real confirmado contra el código del backend (barroyo/doscarasapi):
// POST /views/:id/sides/a|b/like|dislike devuelve { likeCount, dislikeCount,
// myReaction }. La reacción reemplaza cualquier reacción previa del usuario
// en ese lado (es idempotente, no hay "quitar reacción").
interface ReaccionApi {
  likeCount: number
  dislikeCount: number
  myReaction: 'LIKE' | 'DISLIKE' | null
}

type EstadoReaccion = Pick<Lado, 'likes' | 'dislikes' | 'miReaccion'>

function mapearReaccion(resultado: ReaccionApi): EstadoReaccion {
  return {
    likes: resultado.likeCount,
    dislikes: resultado.dislikeCount,
    miReaccion: resultado.myReaction === 'LIKE' ? 'like' : resultado.myReaction === 'DISLIKE' ? 'dislike' : null,
  }
}

export async function reaccionar(
  vistaId: string,
  lado: 'A' | 'B',
  tipo: 'like' | 'dislike',
): Promise<EstadoReaccion> {
  const segmento = lado === 'A' ? 'a' : 'b'
  const resultado = await httpClient.post<ReaccionApi>(`/views/${vistaId}/sides/${segmento}/${tipo}`)
  return mapearReaccion(resultado)
}
