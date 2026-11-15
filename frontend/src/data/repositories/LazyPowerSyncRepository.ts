import type {
  BacktestResponse,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  HistoryResponse,
  SectorRiskResponse,
  SensorsResponse,
} from '../contracts/generated'
import type { ApiDataRepository } from './ApiDataRepository'
import type {
  BacktestEvent,
  DataRepository,
  DateRange,
  Decision,
  DecisionList,
  RequestOptions,
  Scenario,
} from './DataRepository'

/** Si el celular no queda libre antes, PowerSync se carga igual a los 4 s. */
const IDLE_TIMEOUT_MS = 4_000

function whenIdle(callback: () => void): void {
  if (typeof window === 'undefined') return
  const schedule = () => {
    // Safari no tiene requestIdleCallback.
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS })
    } else {
      setTimeout(callback, 1_500)
    }
  }
  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })
}

/**
 * PowerSync (SDK + SQLite en WASM) pesa más que toda la app: se carga aparte,
 * cuando el celular queda libre después del primer dibujo, para no competir
 * por la señal. Mientras tanto las lecturas van a la API; ya cargado, lee lo
 * guardado en el celular. Sin señal, lo carga enseguida y lee lo guardado.
 * Las decisiones siempre esperan a PowerSync: se guardan en el SQLite del
 * celular aunque no haya señal.
 */
export class LazyPowerSyncRepository implements DataRepository {
  #loading: Promise<DataRepository> | null = null
  #repository: DataRepository | null = null

  constructor(
    private readonly api: ApiDataRepository,
    private readonly load: () => Promise<DataRepository>,
  ) {
    whenIdle(() => {
      // Si no carga (navegador sin WASM), la app sigue con la API.
      this.preload().catch(() => undefined)
    })
  }

  /** Carga PowerSync ahora (una sola vez). */
  preload(): Promise<DataRepository> {
    this.#loading ??= this.load().then((repository) => {
      this.#repository = repository
      return repository
    })
    return this.#loading
  }

  async #read<T>(
    local: (repository: DataRepository) => Promise<T>,
    remote: () => Promise<T>,
  ): Promise<T> {
    if (this.#repository) return local(this.#repository)

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false
    if (isOffline) {
      try {
        return await local(await this.preload())
      } catch {
        return remote()
      }
    }

    try {
      return await remote()
    } catch (error) {
      // Mala señal: lo guardado en el celular sirve igual.
      try {
        return await local(await this.preload())
      } catch {
        throw error
      }
    }
  }

  getHealth(options?: RequestOptions): Promise<HealthResponse> {
    return this.#read((r) => r.getHealth(options), () => this.api.getHealth(options))
  }

  getSectors(scenario: Scenario, options?: RequestOptions): Promise<SectorRiskResponse> {
    return this.#read(
      (r) => r.getSectors(scenario, options),
      () => this.api.getSectors(scenario, options),
    )
  }

  getSectorHistory(
    sectorId: string,
    range?: DateRange,
    options?: RequestOptions,
  ): Promise<HistoryResponse> {
    return this.#read(
      (r) => r.getSectorHistory(sectorId, range, options),
      () => this.api.getSectorHistory(sectorId, range, options),
    )
  }

  getSectorSensors(
    sectorId: string,
    hours?: number,
    options?: RequestOptions,
  ): Promise<SensorsResponse> {
    return this.#read(
      (r) => r.getSectorSensors(sectorId, hours, options),
      () => this.api.getSectorSensors(sectorId, hours, options),
    )
  }

  getBacktest(event: BacktestEvent, options?: RequestOptions): Promise<BacktestResponse> {
    return this.#read(
      (r) => r.getBacktest(event, options),
      () => this.api.getBacktest(event, options),
    )
  }

  sendChat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    return this.api.sendChat(request, options)
  }

  async saveDecision(decision: Decision, options?: RequestOptions): Promise<void> {
    return (await this.preload()).saveDecision(decision, options)
  }

  async deleteDecision(id: string, options?: RequestOptions): Promise<void> {
    return (await this.preload()).deleteDecision(id, options)
  }

  async listDecisions(
    communityId: string,
    sectorId?: string,
    options?: RequestOptions,
  ): Promise<DecisionList> {
    return (await this.preload()).listDecisions(communityId, sectorId, options)
  }

  onDecisionsChange(listener: () => void): () => void {
    let unsubscribe: (() => void) | null = null
    let cancelled = false
    void this.preload().then((repository) => {
      if (!cancelled) {
        unsubscribe = repository.onDecisionsChange(listener)
        // Ya cargó: avisar para que se lea lo guardado.
        listener()
      }
    }, () => undefined)
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }
}
