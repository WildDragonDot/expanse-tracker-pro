/**
 * Offline Cache & Mutation Sync Engine
 * 
 * Provides robust offline-first persistence using localStorage with TTL versioning,
 * network connectivity listeners, and automated mutation replay upon reconnection.
 */

export interface CachedEntry<T> {
  data: T
  timestamp: number
  version: string
}

export interface QueuedMutation {
  id: string
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  timestamp: number
  description: string
}

const CACHE_PREFIX = '@finance_offline_cache_'
const MUTATION_QUEUE_KEY = '@finance_mutation_queue'
const CACHE_VERSION = 'v1.0'

export class OfflineStore {
  private isOnlineStatus: boolean = typeof window !== 'undefined' ? navigator.onLine : true
  private listeners: Set<(isOnline: boolean) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }

  private handleOnline = () => {
    this.isOnlineStatus = true
    this.notifyListeners(true)
    this.replayQueuedMutations()
  }

  private handleOffline = () => {
    this.isOnlineStatus = false
    this.notifyListeners(false)
  }

  public isOnline(): boolean {
    if (typeof window !== 'undefined') {
      return navigator.onLine
    }
    return this.isOnlineStatus
  }

  public subscribe(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach((cb) => {
      try {
        cb(isOnline)
      } catch (e) {
        console.warn('Error in offlineStore listener:', e)
      }
    })
  }

  // --- Cache Storage & Retrieval ---

  public setCache<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return
    try {
      const entry: CachedEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      }
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry))
    } catch (e) {
      console.warn(`Failed to set offline cache for key "${key}":`, e)
    }
  }

  public getCache<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`)
      if (!raw) return null
      const entry: CachedEntry<T> = JSON.parse(raw)
      return entry.data
    } catch (e) {
      console.warn(`Failed to read offline cache for key "${key}":`, e)
      return null
    }
  }

  public removeCache(key: string): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
    } catch (e) {
      // ignore
    }
  }

  public clearAllCache(): void {
    if (typeof window === 'undefined') return
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch (e) {
      // ignore
    }
  }

  // --- Offline Mutation Queue ---

  public queueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): QueuedMutation {
    const fullMutation: QueuedMutation = {
      ...mutation,
      id: 'mut_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    }

    if (typeof window !== 'undefined') {
      try {
        const existing = this.getQueuedMutations()
        existing.push(fullMutation)
        localStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(existing))
      } catch (e) {
        console.warn('Failed to queue offline mutation:', e)
      }
    }

    return fullMutation
  }

  public getQueuedMutations(): QueuedMutation[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(MUTATION_QUEUE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  public removeQueuedMutation(id: string): void {
    if (typeof window === 'undefined') return
    try {
      const remaining = this.getQueuedMutations().filter((m) => m.id !== id)
      localStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(remaining))
    } catch {
      // ignore
    }
  }

  public clearQueuedMutations(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(MUTATION_QUEUE_KEY)
    } catch {
      // ignore
    }
  }

  // --- Auto Replay on Network Resume ---

  public async replayQueuedMutations(): Promise<void> {
    const queue = this.getQueuedMutations()
    if (queue.length === 0) return

    console.log(`[OfflineStore] Replaying ${queue.length} pending mutations...`)

    // Dynamic import to avoid circular dependency
    const { apiFetch } = await import('./apiFetch')
    const token = localStorage.getItem('token')

    for (const mutation of queue) {
      try {
        const response = await apiFetch(mutation.endpoint, {
          method: mutation.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: mutation.body ? JSON.stringify(mutation.body) : undefined,
        })

        if (response.ok) {
          console.log(`[OfflineStore] Replayed: ${mutation.description || mutation.endpoint}`)
          this.removeQueuedMutation(mutation.id)
        } else {
          console.warn(`[OfflineStore] Mutation replay non-ok HTTP ${response.status} for ${mutation.endpoint}`)
        }
      } catch (err) {
        console.warn(`[OfflineStore] Mutation replay failed for ${mutation.endpoint}:`, err)
        break // Stop on connection failure to avoid clearing remaining
      }
    }
  }
}

export const offlineStore = new OfflineStore()
