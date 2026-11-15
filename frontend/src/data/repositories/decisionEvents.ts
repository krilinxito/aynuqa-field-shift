/** Pequeño emisor para avisar que cambiaron las decisiones. */
export class DecisionEvents {
  readonly #listeners = new Set<() => void>()

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  emit(): void {
    this.#listeners.forEach((listener) => listener())
  }
}

export function sortDecisions<T extends { decided_at: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.decided_at.localeCompare(a.decided_at))
}
