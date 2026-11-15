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

export type { Decision }

export interface DecisionList {
  /** De la más nueva a la más vieja. */
  decisions: Decision[]
  /** Guardadas en el celular que todavía no subieron (sin señal). */
  pendingIds: string[]
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
  /** Lo que decidió la comunidad. Con PowerSync se guarda aunque no haya señal. */
  saveDecision(decision: Decision, options?: RequestOptions): Promise<void>
  deleteDecision(id: string, options?: RequestOptions): Promise<void>
  listDecisions(
    communityId: string,
    sectorId?: string,
    options?: RequestOptions,
  ): Promise<DecisionList>
  /** Avisa cuando cambian las decisiones (guardado, borrado o sincronización). */
  onDecisionsChange(listener: () => void): () => void
}
