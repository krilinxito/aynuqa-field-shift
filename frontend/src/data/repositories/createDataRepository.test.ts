import { describe, expect, it } from 'vitest'

import { ApiDataRepository } from './ApiDataRepository'
import { MockDataRepository } from './MockDataRepository'
import { createDataRepository } from './createDataRepository'
import { ConfigurationError } from '../transport/errors'

describe('createDataRepository', () => {
  it('usa mock por defecto', () => {
    expect(createDataRepository({})).toBeInstanceOf(MockDataRepository)
  })

  it('crea API con URL configurada', () => {
    expect(
      createDataRepository({
        VITE_DATA_MODE: 'api',
        VITE_API_BASE_URL: 'https://example.test',
      }),
    ).toBeInstanceOf(ApiDataRepository)
  })

  it.each([
    [{ VITE_DATA_MODE: 'otro' }, 'no es válido'],
    [{ VITE_DATA_MODE: 'api' }, 'es obligatoria'],
    [
      { VITE_DATA_MODE: 'api', VITE_API_BASE_URL: 'archivo-local' },
      'URL HTTP o HTTPS válida',
    ],
  ])('rechaza configuración inválida', (environment, message) => {
    try {
      createDataRepository(environment)
      throw new Error('La configuración inválida fue aceptada.')
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError)
      expect((error as Error).message).toContain(message)
    }
  })
})
