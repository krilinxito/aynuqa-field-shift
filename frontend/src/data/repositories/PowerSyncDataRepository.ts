import type { PowerSyncDatabase } from '@powersync/web'

import {
  parseContract,
  type ContractName,
  type ContractTypes,
} from '../contracts/contractValidator'
import type {
  BacktestResponse,
  ChatRequest,
  ChatResponse,
  Decision,
  HealthResponse,
  HistoryResponse,
  SectorRiskResponse,
  SensorsResponse,
} from '../contracts/generated'
import type {
  BacktestEvent,
  DataRepository,
  DateRange,
  DecisionList,
  RequestOptions,
  Scenario,
} from './DataRepository'
import { ApiDataRepository } from './ApiDataRepository'
import {
  assertBacktestEvent,
  assertDateRange,
  assertHours,
  assertScenario,
  assertSectorId,
} from './inputValidation'
import { rowToDecision, type DecisionRow } from '../powersync/decisionRows'
import { sortDecisions } from './decisionEvents'

/** Cuánto se espera al SQLite antes de pedir también a la API. */
const LOCAL_WAIT_MS = 400

interface SnapshotRow {
  payload: string
}
export class PowerSyncDataRepository implements DataRepository {
  constructor(
    private readonly database: PowerSyncDatabase,
    private readonly api: ApiDataRepository,
  ) {}

  async #read<K extends ContractName>(
    contract: K,
    dataset: string,
    cacheKey: string,
  ): Promise<ContractTypes[K] | null> {
    try {
      const row = await this.database.getOptional<SnapshotRow>(
        'SELECT payload FROM offline_snapshots WHERE dataset = ? AND cache_key = ? LIMIT 1',
        [dataset, cacheKey],
      )
      return row ? parseContract(contract, JSON.parse(row.payload) as unknown) : null
    } catch {
      return null
    }
  }

  /**
   * Lo guardado en el celular primero, sin hacer esperar a la persona: si el
   * SQLite (WASM) todavía está arrancando en la primera visita, a los 400 ms
   * se pide también a la API y gana lo que llegue antes. Si el SQLite ya
   * tiene el dato, no se gastan datos móviles en la API.
   */
  async #first<T>(local: () => Promise<T | null>, remote: () => Promise<T>): Promise<T> {
    const fromLocal = local().then((value) => {
      if (value === null) throw new Error('Sin dato guardado.')
      return value
    })
    let fromRemote: Promise<T> | null = null
    const startRemote = () => (fromRemote ??= remote())
    const remoteAfterWait = new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => startRemote().then(resolve, reject), LOCAL_WAIT_MS)
      // Si lo guardado no existe, no hay que esperar.
      fromLocal.catch(() => {
        clearTimeout(timer)
        startRemote().then(resolve, reject)
      })
      // Si lo guardado llegó a tiempo, la API nunca se llama.
      fromLocal.then(() => clearTimeout(timer), () => undefined)
    })
    try {
      return await Promise.any([fromLocal, remoteAfterWait])
    } catch {
      return startRemote()
    }
  }

  async getHealth(options?: RequestOptions): Promise<HealthResponse> {
    return this.#first(
      () => this.#read('health', 'health', 'global'),
      () => this.api.getHealth(options),
    )
  }

  async getSectors(
    scenario: Scenario,
    options?: RequestOptions,
  ): Promise<SectorRiskResponse> {
    assertScenario(scenario)
    return this.#first(
      () => this.#read('sectorRisk', 'sectors', scenario),
      () => this.api.getSectors(scenario, options),
    )
  }

  async getSectorHistory(
    sectorId: string,
    range?: DateRange,
    options?: RequestOptions,
  ): Promise<HistoryResponse> {
    assertSectorId(sectorId)
    assertDateRange(range)
    const local = await this.#read('history', 'history', sectorId)
    if (!local) return this.api.getSectorHistory(sectorId, range, options)

    const value = structuredClone(local)
    value.from = range?.from ?? value.from
    value.to = range?.to ?? value.to
    value.series = value.series.filter(
      (point) => point.date >= value.from && point.date <= value.to,
    )
    return parseContract('history', value)
  }

  async getSectorSensors(
    sectorId: string,
    hours = 48,
    options?: RequestOptions,
  ): Promise<SensorsResponse> {
    assertSectorId(sectorId)
    assertHours(hours)
    const local = await this.#read('sensors', 'sensors', sectorId)
    if (!local || hours > local.hours) {
      return this.api.getSectorSensors(sectorId, hours, options)
    }

    const value = structuredClone(local)
    const latest = Date.parse(value.readings.at(-1)?.ts ?? '')
    const threshold = latest - hours * 60 * 60 * 1000
    value.hours = hours
    value.readings = value.readings.filter(
      (reading) => Date.parse(reading.ts) >= threshold,
    )
    return parseContract('sensors', value)
  }

  async getBacktest(
    event: BacktestEvent,
    options?: RequestOptions,
  ): Promise<BacktestResponse> {
    assertBacktestEvent(event)
    return this.#first(
      () => this.#read('backtest', 'backtest', event),
      () => this.api.getBacktest(event, options),
    )
  }

  sendChat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    return this.api.sendChat(request, options)
  }

  /** Se guarda en el SQLite del celular; PowerSync la sube cuando hay señal. */
  async saveDecision(decision: Decision): Promise<void> {
    const valid = parseContract('decision', decision)
    const values = [
      valid.community_id,
      valid.sector_id,
      valid.scenario,
      valid.action,
      valid.recommended_action,
      valid.follows_recommendation ? 1 : 0,
      valid.note,
      valid.decided_at,
    ]
    await this.database.writeTransaction(async (tx) => {
      const existing = await tx.getOptional<{ id: string }>(
        'SELECT id FROM decisions WHERE id = ?',
        [valid.id],
      )
      if (existing) {
        await tx.execute(
          `UPDATE decisions SET community_id = ?, sector_id = ?, scenario = ?, action = ?,
             recommended_action = ?, follows_recommendation = ?, note = ?, decided_at = ?
           WHERE id = ?`,
          [...values, valid.id],
        )
      } else {
        await tx.execute(
          `INSERT INTO decisions (id, community_id, sector_id, scenario, action,
             recommended_action, follows_recommendation, note, decided_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [valid.id, ...values],
        )
      }
    })
  }

  async deleteDecision(id: string): Promise<void> {
    await this.database.execute('DELETE FROM decisions WHERE id = ?', [id])
  }

  async listDecisions(communityId: string, sectorId?: string): Promise<DecisionList> {
    if (sectorId !== undefined) {
      assertSectorId(sectorId)
    }
    const rows = await this.database.getAll<DecisionRow>(
      sectorId === undefined
        ? 'SELECT * FROM decisions WHERE community_id = ?'
        : 'SELECT * FROM decisions WHERE community_id = ? AND sector_id = ?',
      sectorId === undefined ? [communityId] : [communityId, sectorId],
    )
    const pending = await this.database.getAll<{ data: string }>(
      'SELECT data FROM ps_crud',
    )
    const pendingIds = pending.flatMap((item) => {
      try {
        const parsed = JSON.parse(item.data) as { type?: string; id?: string }
        return parsed.type === 'decisions' && parsed.id ? [parsed.id] : []
      } catch {
        return []
      }
    })
    return { decisions: sortDecisions(rows.map(rowToDecision)), pendingIds }
  }

  onDecisionsChange(listener: () => void): () => void {
    return this.database.onChange(
      { onChange: listener },
      { tables: ['decisions', 'ps_crud'], throttleMs: 300 },
    )
  }
}
