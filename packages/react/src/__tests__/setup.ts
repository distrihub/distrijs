import '@testing-library/jest-dom/vitest'

// Node 25+ ships its own experimental `localStorage` global. Without
// `--localstorage-file` it is undefined, and it shadows jsdom's, so tests
// that call `localStorage.clear()` throw. Fall back to an in-memory Storage.
if (typeof globalThis.localStorage?.clear !== 'function') {
  const data = new Map<string, string>()
  const storage: Storage = {
    get length() { return data.size },
    clear: () => data.clear(),
    getItem: key => (data.has(key) ? data.get(key)! : null),
    key: index => Array.from(data.keys())[index] ?? null,
    removeItem: key => { data.delete(key) },
    setItem: (key, value) => { data.set(key, String(value)) },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true })
}
