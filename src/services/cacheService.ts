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

export const CacheService = { set, get, remove, clear }
