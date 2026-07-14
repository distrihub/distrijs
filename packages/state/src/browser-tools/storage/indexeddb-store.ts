/**
 * IndexedDbStore — typed key/value store backed by a dedicated IndexedDB database.
 *
 * Each named store gets its own IDB database (`browser-tools-store-{name}`) so
 * adding a new store never requires version negotiation against an existing one.
 * Records have shape `{ id, data, createdAt, updatedAt }`; `id` is the IDB key.
 */

const DB_PREFIX = 'browser-tools-store-'
const STORE_NAME = 'records'

export interface StoreRecord<T = Record<string, unknown>> {
  id: string
  data: T
  createdAt: number
  updatedAt: number
}

export type StoreChangeOp = 'put' | 'delete' | 'clear'

export interface StoreChangeEvent {
  store: string
  op: StoreChangeOp
  id?: string
}

function requestAsPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

class MemoryAdapter<T> {
  private records = new Map<string, StoreRecord<T>>()
  async get(id: string) { return this.records.get(id) }
  async put(record: StoreRecord<T>) { this.records.set(record.id, record) }
  async delete(id: string) { this.records.delete(id) }
  async getAll() { return Array.from(this.records.values()) }
  async clear() { this.records.clear() }
}

export class IndexedDbStore<T = Record<string, unknown>> {
  private static instances = new Map<string, IndexedDbStore<unknown>>()

  static forName<T = Record<string, unknown>>(name: string): IndexedDbStore<T> {
    const key = name || 'default'
    let inst = this.instances.get(key) as IndexedDbStore<T> | undefined
    if (!inst) {
      inst = new IndexedDbStore<T>(key)
      this.instances.set(key, inst as IndexedDbStore<unknown>)
    }
    return inst
  }

  readonly name: string
  private readonly hasIndexedDb: boolean
  private readonly memory: MemoryAdapter<T>
  private dbPromise?: Promise<IDBDatabase>

  private constructor(name: string) {
    this.name = name
    this.hasIndexedDb = typeof indexedDB !== 'undefined'
    this.memory = new MemoryAdapter<T>()
    if (this.hasIndexedDb) this.dbPromise = this.openDatabase()
  }

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(`${DB_PREFIX}${this.name}`, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'))
    })
  }

  private async withStore<R>(
    mode: IDBTransactionMode,
    cb: (store: IDBObjectStore) => Promise<R> | R,
  ): Promise<R> {
    if (!this.hasIndexedDb || !this.dbPromise) throw new Error('IndexedDB not available')
    const db = await this.dbPromise
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    const result = await cb(store)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Transaction failed'))
    })
    return result
  }

  async get(id: string): Promise<StoreRecord<T> | undefined> {
    if (!this.hasIndexedDb || !this.dbPromise) return this.memory.get(id)
    return this.withStore('readonly', (s) =>
      requestAsPromise<StoreRecord<T> | undefined>(s.get(id)),
    )
  }

  async put(input: { id?: string; data: T }): Promise<StoreRecord<T>> {
    const id = input.id ?? generateId()
    const existing = await this.get(id)
    const now = Date.now()
    const record: StoreRecord<T> = {
      id,
      data: input.data,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    if (!this.hasIndexedDb || !this.dbPromise) {
      await this.memory.put(record)
    } else {
      await this.withStore('readwrite', (s) => { s.put(record) })
    }
    return record
  }

  async delete(id: string): Promise<void> {
    if (!this.hasIndexedDb || !this.dbPromise) return this.memory.delete(id)
    await this.withStore('readwrite', (s) => { s.delete(id) })
  }

  async list(): Promise<StoreRecord<T>[]> {
    let records: StoreRecord<T>[]
    if (!this.hasIndexedDb || !this.dbPromise) {
      records = await this.memory.getAll()
    } else {
      records = await this.withStore('readonly', (s) =>
        requestAsPromise<StoreRecord<T>[]>(s.getAll()),
      )
    }
    return records.sort((a, b) => a.createdAt - b.createdAt)
  }

  async clear(): Promise<void> {
    if (!this.hasIndexedDb || !this.dbPromise) return this.memory.clear()
    await this.withStore('readwrite', (s) => { s.clear() })
  }
}
