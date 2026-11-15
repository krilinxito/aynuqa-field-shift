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
  HealthResponse,
  HistoryResponse,
  SectorRiskResponse,
  SensorsResponse,
} from '../contracts/generated'
import type {
  BacktestEvent,
  DataRepository,
  DateRange,
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

  async getHealth(options?: RequestOptions): Promise<HealthResponse> {
    return (await this.#read('health', 'health', 'global')) ?? this.api.getHealth(options)
  }

  async getSectors(
    scenario: Scenario,
    options?: RequestOptions,
  ): Promise<SectorRiskResponse> {
    assertScenario(scenario)
    return (
      (await this.#read('sectorRisk', 'sectors', scenario)) ??
      this.api.getSectors(scenario, options)
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
    return (
      (await this.#read('backtest', 'backtest', event)) ??
      this.api.getBacktest(event, options)
    )
  }

  sendChat(request: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    return this.api.sendChat(request, options)
  }
}
