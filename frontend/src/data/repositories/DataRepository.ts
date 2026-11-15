import type {
  BacktestResponse,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  HistoryResponse,
  SectorRiskResponse,
  SensorsResponse,
} from '../contracts/generated'

export type Scenario = SectorRiskResponse['scenario']
export type BacktestEvent = BacktestResponse['event']
export type AnalysisSection = 'history' | 'backtest' | 'twins' | 'sensors'

export interface DateRange {
  from?: string
  to?: string
}

export interface RequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

export interface DataRepository {
  getHealth(options?: RequestOptions): Promise<HealthResponse>
  getSectors(
    scenario: Scenario,
    options?: RequestOptions,
  ): Promise<SectorRiskResponse>
  getSectorHistory(
    sectorId: string,
    range?: DateRange,
    options?: RequestOptions,
  ): Promise<HistoryResponse>
  getSectorSensors(
    sectorId: string,
    hours?: number,
    options?: RequestOptions,
  ): Promise<SensorsResponse>
  getBacktest(
    event: BacktestEvent,
    options?: RequestOptions,
  ): Promise<BacktestResponse>
  sendChat(
    request: ChatRequest,
    options?: RequestOptions,
  ): Promise<ChatResponse>
}
