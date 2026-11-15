import { parseContract } from '../contracts/contractValidator'
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
import { ContractError } from '../transport/errors'
import { HttpClient, type HttpClientOptions } from '../transport/httpClient'
import type {
  BacktestEvent,
  DataRepository,
  DateRange,
  DecisionList,
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
import { DecisionEvents, sortDecisions } from './decisionEvents'

interface TokenResponse {
  token: string
  expires_at: string
}

export class ApiDataRepository implements DataRepository {
  readonly #http: HttpClient
  readonly #events = new DecisionEvents()
  #token: { value: string; expiresAt: number } | null = null

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

  /** Token de la app (el mismo que usa PowerSync) para poder escribir. */
  async authorization(options?: RequestOptions): Promise<string> {
    if (this.#token && this.#token.expiresAt - Date.now() > 60_000) {
      return `Bearer ${this.#token.value}`
    }
    const response = (await this.#http.request({
      path: '/api/powersync/token',
      ...options,
    })) as Partial<TokenResponse>
    if (!response.token || !response.expires_at) {
      throw new ContractError('powersync:token')
    }
    this.#token = {
      value: response.token,
      expiresAt: Date.parse(response.expires_at),
    }
    return `Bearer ${response.token}`
  }

  async saveDecision(decision: Decision, options?: RequestOptions): Promise<void> {
    const valid = parseContract('decision', decision)
    await this.#http.request({
      path: `/api/decisions/${encodeURIComponent(valid.id)}`,
      method: 'PUT',
      body: valid,
      headers: { Authorization: await this.authorization(options) },
      ...options,
    })
    this.#events.emit()
  }

  async deleteDecision(id: string, options?: RequestOptions): Promise<void> {
    await this.#http.request({
      path: `/api/decisions/${encodeURIComponent(id)}`,
      method: 'DELETE',
      headers: { Authorization: await this.authorization(options) },
      ...options,
    })
    this.#events.emit()
  }

  async listDecisions(
    communityId: string,
    sectorId?: string,
    options?: RequestOptions,
  ): Promise<DecisionList> {
    if (sectorId !== undefined) {
      assertSectorId(sectorId)
    }
    const response = (await this.#http.request({
      path: '/api/decisions',
      query: { community_id: communityId, sector_id: sectorId },
      ...options,
    })) as { decisions?: unknown }
    if (!Array.isArray(response.decisions)) {
      throw new ContractError('decisions:list')
    }
    return {
      decisions: sortDecisions(
        response.decisions.map((item) => parseContract('decision', item)),
      ),
      pendingIds: [],
    }
  }

  onDecisionsChange(listener: () => void): () => void {
    return this.#events.subscribe(listener)
  }
}
