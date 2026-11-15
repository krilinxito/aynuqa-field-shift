import { describe, expect, it } from 'vitest'

import { candidateLines, nextLine, type MascotContext } from './mascotLines'
import { updateVisit } from './visitTracker'

function context(overrides: Partial<MascotContext> = {}): MascotContext {
  return {
    lang: 'es',
    isOnline: true,
    scenario: 'nino',
    streak: 1,
    daysAway: 0,
    firstTime: false,
    greeted: false,
    justCelebrated: false,
    advanced: false,
    sectors: [
      { id: 'S2', number: '2', riskLevel: 'high' },
      { id: 'S7', number: '7', riskLevel: 'low' },
    ],
    undecidedSectorIds: ['S7'],
    ...overrides,
  }
}

describe('updateVisit', () => {
  it('cuenta la racha de días seguidos', () => {
    const first = updateVisit({ lastVisit: null, streak: 0 }, '2026-11-10')
    expect(first.info).toEqual({ streak: 1, daysAway: 0, firstTime: true })

    const next = updateVisit(first.record, '2026-11-11')
    expect(next.info.streak).toBe(2)

    const sameDay = updateVisit(next.record, '2026-11-11')
    expect(sameDay.info.streak).toBe(2)
  })

  it('reinicia la racha y cuenta los días sin visitar', () => {
    const result = updateVisit({ lastVisit: '2026-11-01', streak: 4 }, '2026-11-06')
    expect(result.info).toEqual({ streak: 1, daysAway: 4, firstTime: false })
  })
})

describe('frases de la llamita', () => {
  it('saluda primero y después avisa del riesgo alto con El Niño', () => {
    const lines = candidateLines(context())
    expect(lines[0].id).toBe('saludo')
    expect(lines[1]).toMatchObject({ id: 'riesgo-S2', mood: 'worried', sectorId: 'S2' })
    expect(lines[1].text).toContain('aumenta la probabilidad de sequía en el sector 2')
  })

  it('insiste con humor si hace días que no vienes', () => {
    const line = nextLine(context({ daysAway: 5 }), new Set())
    expect(line).toMatchObject({ id: 'te-extrane', mood: 'insistent' })
    expect(line?.text).toContain('Hace 5 días')
  })

  it('celebra la racha', () => {
    const line = nextLine(context({ streak: 3 }), new Set())
    expect(line?.text).toMatch(/3 días/)
  })

  it('recuerda el sector sin decisión, sin obligar', () => {
    const line = nextLine(context({ greeted: true }), new Set(['riesgo-S2']))
    expect(line).toMatchObject({ id: 'pendiente-S7', sectorId: 'S7' })
    expect(line?.text).toContain('sector 7')
  })

  it('sin señal se duerme primero', () => {
    expect(nextLine(context({ isOnline: false }), new Set())?.mood).toBe('sleeping')
  })

  it('habla en aymara y quechua', () => {
    expect(nextLine(context({ lang: 'ay', daysAway: 4 }), new Set())?.text).toContain(
      '4 urunakaw',
    )
    expect(nextLine(context({ lang: 'qu', daysAway: 4 }), new Set())?.text).toContain(
      '4 p’unchawñam',
    )
  })

  it('no inventa números: solo usa los sectores y días que recibe', () => {
    const texts = candidateLines(context({ greeted: true })).map((l) => l.text)
    const numbers = texts.join(' ').match(/\d+/g) ?? []
    expect(new Set(numbers)).toEqual(new Set(['2', '7']))
  })
})
