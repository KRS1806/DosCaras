interface EntradaCache<T> {
  value: T
  timestamp: number
}

function set<T>(key: string, value: T): void {
  const entrada: EntradaCache<T> = { value, timestamp: Date.now() }
  localStorage.setItem(key, JSON.stringify(entrada))
}

function get<T>(key: string, ttlMs?: number): T | null {
  const raw = localStorage.getItem(key)
  if (!raw) {
    return null
  }

  try {
    const entrada: EntradaCache<T> = JSON.parse(raw)
    if (ttlMs !== undefined && Date.now() - entrada.timestamp > ttlMs) {
      return null
    }
    return entrada.value
  } catch {
    return null
  }
}

function remove(key: string): void {
  localStorage.removeItem(key)
}

function clear(key: string): void {
  localStorage.removeItem(key)
}

async function obtenerConRevalidacion<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const vigente = get<T>(key, ttlMs)
  if (vigente) {
    return vigente
  }

  const obsoleta = get<T>(key)
  if (obsoleta) {
    fetcher()
      .then((valor) => set(key, valor))
      .catch(() => {})
    return obsoleta
  }

  const valor = await fetcher()
  set(key, valor)
  return valor
}

export const CacheService = { set, get, remove, clear, obtenerConRevalidacion }
