import { describe, expect, it } from 'vitest'

import { isFaithful } from './localModel'

describe('IA local: solo textos fieles a los datos', () => {
  const source =
    'Riesgo alto de sequía en los sectores 4 y 5. El Niño aumenta la probabilidad de sequía.'

  it('acepta una redacción que no agrega números', () => {
    expect(
      isFaithful(
        'Los sectores 4 y 5 tienen más riesgo: El Niño aumenta la probabilidad de sequía.',
        source,
      ),
    ).toBe(true)
  })

  it('rechaza números inventados', () => {
    expect(isFaithful('El sector 9 tendrá 30 % menos cosecha, probabilidad alta.', source)).toBe(false)
  })

  it('rechaza si pierde el "aumenta la probabilidad"', () => {
    expect(isFaithful('Habrá sequía en los sectores 4 y 5.', source)).toBe(false)
  })
})
