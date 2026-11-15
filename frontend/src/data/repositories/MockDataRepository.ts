import { contractFixtures } from '../contracts/contractFixtures'
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
import { FixtureMissingError } from '../transport/errors'
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

const DECISIONS_KEY = 'aynuqa:decisions'

function readDecisions(): Decision[] {
  try {
    const raw = localStorage.getItem(DECISIONS_KEY)
    return raw ? (JSON.parse(raw) as Decision[]) : []
  } catch {
    return []
  }
}

function writeDecisions(list: Decision[]): void {
  try {
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(list))
  } catch {
    // Sin almacenamiento: la decisión no se recuerda, pero nada se rompe.
  }
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function checkSignal(options?: RequestOptions): void {
  options?.signal?.throwIfAborted()
}

export class MockDataRepository implements DataRepository {
  readonly #events = new DecisionEvents()

  async getHealth(options?: RequestOptions): Promise<HealthResponse> {
    checkSignal(options)
    await Promise.resolve()
    return clone(parseContract('health', contractFixtures.health))
  }

  async getSectors(
    scenario: Scenario,
    options?: RequestOptions,
  ): Promise<SectorRiskResponse> {
    checkSignal(options)
    await Promise.resolve()
    assertScenario(scenario)
    const fixture =
      scenario === 'nino'
        ? contractFixtures.sectorsNino
        : contractFixtures.sectorsNormal

    return clone(parseContract('sectorRisk', fixture))
  }

  async getSectorHistory(
    sectorId: string,
    range?: DateRange,
    options?: RequestOptions,
  ): Promise<HistoryResponse> {
    checkSignal(options)
    await Promise.resolve()
    assertSectorId(sectorId)
    assertDateRange(range)

    if (sectorId !== 'S1') {
      throw new FixtureMissingError(`el histórico del sector ${sectorId}`)
    }

    const fixture = clone(
      parseContract('history', contractFixtures.historyS1),
    )
    const from = range?.from ?? fixture.from
    const to = range?.to ?? fixture.to

    if (from < fixture.from || to > fixture.to) {
      throw new FixtureMissingError(
        `el histórico S1 entre ${from} y ${to}`,
      )
    }

    fixture.from = from
    fixture.to = to
    fixture.series = fixture.series.filter(
      (point) => point.date >= from && point.date <= to,
    )

    return fixture
  }

  async getSectorSensors(
    sectorId: string,
    hours = 48,
    options?: RequestOptions,
  ): Promise<SensorsResponse> {
    checkSignal(options)
    await Promise.resolve()
    assertSectorId(sectorId)
    assertHours(hours)

    if (sectorId !== 'S1') {
      throw new FixtureMissingError(`los sensores del sector ${sectorId}`)
    }

    if (hours > 48) {
      throw new FixtureMissingError(`${hours} horas de sensores para S1`)
    }

    const fixture = clone(
      parseContract('sensors', contractFixtures.sensorsS1),
    )
    const latestTimestamp = Date.parse(fixture.readings.at(-1)?.ts ?? '')
    const threshold = latestTimestamp - hours * 60 * 60 * 1000

    fixture.hours = hours
    fixture.readings = fixture.readings.filter(
      (reading) => Date.parse(reading.ts) >= threshold,
    )

    return fixture
  }

  async getBacktest(
    event: BacktestEvent,
    options?: RequestOptions,
  ): Promise<BacktestResponse> {
    checkSignal(options)
    await Promise.resolve()
    assertBacktestEvent(event)

    if (event !== '2015-16') {
      throw new FixtureMissingError(`el backtest ${event}`)
    }

    return clone(parseContract('backtest', contractFixtures.backtest2015))
  }

  async sendChat(
    request: ChatRequest,
    options?: RequestOptions,
  ): Promise<ChatResponse> {
    checkSignal(options)
    await Promise.resolve()
    const validRequest = parseContract('chatRequest', request)
    const fixtureRequest = parseContract(
      'chatRequest',
      contractFixtures.chatRequest,
    )
    const matchesFixture =
      validRequest.message === fixtureRequest.message &&
      validRequest.sector_id === fixtureRequest.sector_id &&
      validRequest.scenario === fixtureRequest.scenario

    if (!matchesFixture) {
      throw new FixtureMissingError('esta consulta del asistente')
    }

    return clone(parseContract('chatResponse', contractFixtures.chatResponse))
  }

  async saveDecision(decision: Decision, options?: RequestOptions): Promise<void> {
    checkSignal(options)
    await Promise.resolve()
    const valid = parseContract('decision', decision)
    writeDecisions([...readDecisions().filter((d) => d.id !== valid.id), valid])
    this.#events.emit()
  }

  async deleteDecision(id: string, options?: RequestOptions): Promise<void> {
    checkSignal(options)
    await Promise.resolve()
    writeDecisions(readDecisions().filter((d) => d.id !== id))
    this.#events.emit()
  }

  async listDecisions(
    communityId: string,
    sectorId?: string,
    options?: RequestOptions,
  ): Promise<DecisionList> {
    checkSignal(options)
    await Promise.resolve()
    return {
      decisions: sortDecisions(
        readDecisions().filter(
          (d) =>
            d.community_id === communityId &&
            (sectorId === undefined || d.sector_id === sectorId),
        ),
      ),
      pendingIds: [],
    }
  }

  onDecisionsChange(listener: () => void): () => void {
    return this.#events.subscribe(listener)
  }
}
