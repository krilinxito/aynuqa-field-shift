import {
  UpdateType,
  type AbstractPowerSyncDatabase,
  type PowerSyncBackendConnector,
  type PowerSyncCredentials,
} from '@powersync/web'

import { rowToDecision, type DecisionRow } from './decisionRows'

interface TokenResponse {
  token: string
  endpoint: string
  expires_at: string
}
export class AynuqaPowerSyncConnector implements PowerSyncBackendConnector {
  constructor(
    private readonly apiBaseUrl: string,
    // En el navegador `fetch` exige llamarse sobre `window`: guardado suelto
    // falla con "Illegal invocation".
    private readonly fetchImplementation: typeof fetch = (input, init) =>
      fetch(input, init),
  ) {}

  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const response = await this.fetchImplementation(
      new URL('api/powersync/token', this.apiBaseUrl),
    )
    if (!response.ok) {
      throw new Error(`No se pudo iniciar PowerSync (${response.status}).`)
    }

    const value = (await response.json()) as Partial<TokenResponse>
    if (!value.token || !value.endpoint || !value.expires_at) {
      throw new Error('El backend devolvió credenciales PowerSync incompletas.')
    }

    return {
      token: value.token,
      endpoint: value.endpoint,
      expiresAt: new Date(value.expires_at),
    }
  }

  /**
   * Sube las decisiones guardadas sin señal. Un rechazo del servidor (4xx)
   * descarta la operación para no trabar la cola; un fallo de red la reintenta.
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction()
    if (!transaction) return

    const { token } = await this.fetchCredentials()
    for (const operation of transaction.crud) {
      if (operation.table !== 'decisions') {
        console.warn(`PowerSync: se ignora un cambio local en ${operation.table}.`)
        continue
      }

      const url = new URL(
        `api/decisions/${encodeURIComponent(operation.id)}`,
        this.apiBaseUrl,
      )
      let response: Response
      if (operation.op === UpdateType.DELETE) {
        response = await this.fetchImplementation(url, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        // PATCH trae solo lo que cambió: se sube la fila completa.
        const row = await database.getOptional<DecisionRow>(
          'SELECT * FROM decisions WHERE id = ?',
          [operation.id],
        )
        if (!row) continue
        response = await this.fetchImplementation(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rowToDecision(row)),
        })
      }

      if (response.status >= 500 || response.status === 401) {
        throw new Error(`No se pudo subir la decisión (${response.status}).`)
      }
      if (!response.ok) {
        console.warn(`PowerSync: el servidor rechazó la decisión ${operation.id}.`)
      }
    }
    await transaction.complete()
  }
}
