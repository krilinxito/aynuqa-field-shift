import type { BacktestEvent, DateRange, Scenario } from '../repositories/DataRepository'

export const cacheKeys = {
  health: () => 'health',
  sectors: (scenario: Scenario) => `sectors:${scenario}`,
  history: (sectorId: string, range?: DateRange) =>
    `history:${sectorId}:${range?.from ?? ''}:${range?.to ?? ''}`,
  sensors: (sectorId: string, hours = 48) =>
    `sensors:${sectorId}:${hours}`,
  backtest: (event: BacktestEvent) => `backtest:${event}`,
  chat: (requestKey: string) => `chat:${requestKey}`,
} as const
