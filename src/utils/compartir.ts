import { useNotifications } from '@/stores/notifications'

export async function compartirPublicacion(id: string, titulo: string): Promise<void> {
  const notificaciones = useNotifications()
  const url = `${window.location.origin}/views/${id}`

  if (navigator.share) {
    try {
      await navigator.share({ title: titulo, url })
    } catch {
      // El usuario canceló el diálogo nativo de compartir; no es un error.
    }
    return
  }

  try {
    await navigator.clipboard.writeText(url)
    notificaciones.info('Enlace copiado')
  } catch {
    notificaciones.error('No se pudo copiar el enlace.')
  }
}
