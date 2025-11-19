import { v4 as uuidv4 } from 'uuid'

export type ThreadMeta = {
  id: string
  title: string
  createdAt: string
}

const THREADS_KEY = 'browsr.threads'
const ACTIVE_THREAD_KEY = 'browsr.activeThread'

const defaultTitle = 'Untitled bot'

const loadList = (): ThreadMeta[] => {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = window.localStorage.getItem(THREADS_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as ThreadMeta[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
  } catch (error) {
    console.warn('[browsr] Failed to parse threads', error)
    return []
  }
}

const saveList = (threads: ThreadMeta[]) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads))
  } catch (error) {
    console.warn('[browsr] Failed to persist threads', error)
  }
}

export const ThreadStorage = {
  init(): { threads: ThreadMeta[]; activeId: string } {
    if (typeof window === 'undefined') {
      const initialId = uuidv4()
      return {
        threads: [{ id: initialId, title: defaultTitle, createdAt: new Date().toISOString() }],
        activeId: initialId,
      }
    }

    const storedThreads = loadList()
    let activeId = window.localStorage.getItem(ACTIVE_THREAD_KEY)

    if (!storedThreads.length) {
      const initialId = uuidv4()
      const initialThreads = [
        { id: initialId, title: defaultTitle, createdAt: new Date().toISOString() },
      ]
      saveList(initialThreads)
      window.localStorage.setItem(ACTIVE_THREAD_KEY, initialId)
      return { threads: initialThreads, activeId: initialId }
    }

    if (!activeId || !storedThreads.find((thread) => thread.id === activeId)) {
      activeId = storedThreads[0].id
      window.localStorage.setItem(ACTIVE_THREAD_KEY, activeId)
    }

    return { threads: storedThreads, activeId }
  },
  saveList: saveList,
  setActive(id: string) {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(ACTIVE_THREAD_KEY, id)
  },
  create(title?: string): ThreadMeta {
    return {
      id: uuidv4(),
      title: title && title.trim() ? title.trim() : defaultTitle,
      createdAt: new Date().toISOString(),
    }
  },
  defaultTitle,
}
