const persistentKeys = ['sector', 'scenario'] as const

export function getPersistentSearch(search: string): string {
  const source = new URLSearchParams(search)
  const persistent = new URLSearchParams()

  for (const key of persistentKeys) {
    const value = source.get(key)

    if (value !== null) {
      persistent.set(key, value)
    }
  }

  const result = persistent.toString()
  return result ? `?${result}` : ''
}
