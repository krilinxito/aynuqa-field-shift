import { describe, expect, it } from 'vitest'

import { getPersistentSearch } from './persistentSearch'

describe('getPersistentSearch', () => {
  it('preserva sector y escenario válidos entre rutas', () => {
    expect(
      getPersistentSearch(
        '?sector=S3&scenario=nino&from=2020-01&section=sensors',
      ),
    ).toBe('?sector=S3&scenario=nino')
  })

  it('elimina parámetros compartidos con formato inválido', () => {
    expect(getPersistentSearch('?sector=tres&scenario=futuro')).toBe('')
  })
})
