import { describe, expect, it } from 'vitest'

import { adaptSectorSnapshot } from '../../../data/adapters/sectorAdapter'
import { contractFixtures } from '../../../data/contracts/contractFixtures'
import { parseContract } from '../../../data/contracts/contractValidator'
import { answerLocally, detectIntent } from './localAnswers'

const snapshot = adaptSectorSnapshot(
  parseContract('sectorRisk', contractFixtures.sectorsNino),
)

function ask(question: string, sectorId: string | null = null, lang: 'es' | 'ay' | 'qu' = 'es') {
  return answerLocally(question, snapshot, { sectorId, lang })
}

describe('respuestas sin señal', () => {
  it('reconoce la intención en español, aymara y quechua', () => {
    expect(detectIntent('¿Qué sectores conviene abrir este año?')).toBe('open')
    expect(detectIntent('¿Kawkïri suyunakanasa llawiraña wakisi?')).toBe('open')
    expect(detectIntent("¿Imaraykutaq ch'aki pacha kanman?")).toBe('risk')
    expect(detectIntent('¿Qué se puede sembrar y cuándo?')).toBe('sow')
    expect(detectIntent('¿Qué es El Niño?')).toBe('nino')
  })

  it('dice qué sectores abrir con los datos guardados', () => {
    expect(ask('¿Qué sectores conviene abrir?').text).toBe(
      'Se puede abrir los sectores 1, 2 y 3 para cultivo.',
    )
  })

  it('responde por el sector que nombra la pregunta, con su confianza', () => {
    const answer = ask('¿Hay riesgo de sequía en el sector 4?')
    expect(answer.text).toContain('Sector 4. Riesgo de sequía: alto')
    expect(answer.text).toContain('aumenta la probabilidad de sequía')
    expect(answer.confidenceNote).toMatch(/^Confianza media/)
    expect(answer.confidenceNote).toContain('Respuesta sin señal')
  })

  it('usa el sector de la pantalla si la pregunta no nombra otro', () => {
    expect(ask('¿Qué se puede sembrar?', 'S7').text).toContain('Cultivo sugerido: quinua')
  })

  it('El Niño: usa el RONI guardado y no lo da por seguro', () => {
    const answer = ask('¿Qué pasa con El Niño?')
    expect(answer.text).toContain('RONI')
    expect(answer.text).toContain('no es seguro que ocurra')
  })

  it('traduce lo que puede al aymara', () => {
    expect(ask('¿Qué sector abrir?', 'S4', 'ay').text).toContain('samarañanakakïpan')
  })

  it('no inventa números', () => {
    const texts = [
      ask('¿Qué sectores abrir?'),
      ask('¿Riesgo?'),
      ask('¿Qué sembrar?'),
      ask('¿Descanso?'),
    ].map((a) => a.text)
    const allowed = new Set(['1', '2', '3', '4', '5', '6', '7', '8'])
    for (const number of texts.join(' ').match(/\d+/g) ?? []) {
      expect(allowed.has(number)).toBe(true)
    }
  })
})
