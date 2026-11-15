import type {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from '@powersync/web'

interface TokenResponse {
  token: string
  endpoint: string
  expires_at: string
}
export class AynuqaPowerSyncConnector implements PowerSyncBackendConnector {
  constructor(
    private readonly apiBaseUrl: string,
    private readonly fetchImplementation: typeof fetch = fetch,
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

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    if (await database.getNextCrudTransaction()) {
      throw new Error(
        'Las instantáneas comunitarias son de solo lectura y no aceptan cambios locales.',
      )
    }
  }
}
