import { parseContract } from '../contracts/contractValidator'
import type {
  BacktestResponse,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  HistoryResponse,
  SectorRiskResponse,
  SensorsResponse,
} from '../contracts/generated'
import { ContractError } from '../transport/errors'
import { HttpClient, type HttpClientOptions } from '../transport/httpClient'
import type {
  BacktestEvent,
  DataRepository,
  DateRange,
  RequestOptions,
  Scenario,
} from './DataRepository'
import {
  assertBacktestEvent,
  assertDateRange,
  assertHours,
  assertScenario,
  assertSectorId,
} from './inputValidation'

export class ApiDataRepository implements DataRepository {
  readonly #http: HttpClient

  constructor(baseUrl: string, options?: HttpClientOptions) {
    this.#http = new HttpClient(baseUrl, options)
  }

  async getHealth(options?: RequestOptions): Promise<HealthResponse> {
    return parseContract(
      'health',
      await this.#http.request({ path: '/health', ...options }),
    )
  }

  async getSectors(
    scenario: Scenario,
    options?: RequestOptions,
  ): Promise<SectorRiskResponse> {
    assertScenario(scenario)
    const response = parseContract(
      'sectorRisk',
      await this.#http.request({
        path: '/api/sectors',
        query: { scenario },
        ...options,
      }),
    )

    if (response.scenario !== scenario) {
      throw new ContractError('sectorRisk:scenario')
    }

    return response
  }

  async getSectorHistory(
    sectorId: string,
    range?: DateRange,
    options?: RequestOptions,
  ): Promise<HistoryResponse> {
    assertSectorId(sectorId)
    assertDateRange(range)
    const response = parseContract(
      'history',
      await this.#http.request({
        path: `/api/sectors/${encodeURIComponent(sectorId)}/history`,
        query: { from: range?.from, to: range?.to },
        ...options,
      }),
    )

    if (
      response.sector_id !== sectorId ||
      (range?.from !== undefined && response.from !== range.from) ||
      (range?.to !== undefined && response.to !== range.to)
    ) {
      throw new ContractError('history:request-context')
    }

    return response
  }

  async getSectorSensors(
    sectorId: string,
    hours = 48,
    options?: RequestOptions,
  ): Promise<SensorsResponse> {
    assertSectorId(sectorId)
    assertHours(hours)
    const response = parseContract(
      'sensors',
      await this.#http.request({
        path: `/api/sectors/${encodeURIComponent(sectorId)}/sensors`,
        query: { hours },
        ...options,
      }),
    )

    if (response.sector_id !== sectorId || response.hours !== hours) {
      throw new ContractError('sensors:request-context')
    }

    return response
  }

  async getBacktest(
    event: BacktestEvent,
    options?: RequestOptions,
  ): Promise<BacktestResponse> {
    assertBacktestEvent(event)
    const response = parseContract(
      'backtest',
      await this.#http.request({
        path: '/api/backtest',
        query: { event },
        ...options,
      }),
    )

    if (response.event !== event) {
      throw new ContractError('backtest:event')
    }

    return response
  }

  async sendChat(
    request: ChatRequest,
    options?: RequestOptions,
  ): Promise<ChatResponse> {
    const validRequest = parseContract('chatRequest', request)

    return parseContract(
      'chatResponse',
      await this.#http.request({
        path: '/api/chat',
        method: 'POST',
        body: validRequest,
        ...options,
      }),
    )
  }
}
