import type { ErrorObject } from 'ajv'

export interface ContractIssue {
  instancePath: string
  keyword: string
  message: string
}

function normalizeContractIssues(errors: ErrorObject[] | null | undefined): ContractIssue[] {
  return (errors ?? []).map((error) => ({
    instancePath: error.instancePath,
    keyword: error.keyword,
    message: error.message ?? 'Incumple el contrato.',
  }))
}

export class ContractError extends Error {
  readonly contract: string
  readonly issues: ContractIssue[]

  constructor(contract: string, errors?: ErrorObject[] | null, options?: ErrorOptions) {
    super(`Los datos no cumplen el contrato ${contract}.`, options)
    this.name = 'ContractError'
    this.contract = contract
    this.issues = normalizeContractIssues(errors)
  }
}

export class FixtureMissingError extends Error {
  readonly resource: string

  constructor(resource: string) {
    super(`No existe un fixture oficial para ${resource}.`)
    this.name = 'FixtureMissingError'
    this.resource = resource
  }
}

export class NetworkError extends Error {
  constructor(options?: ErrorOptions) {
    super('No se pudo conectar con el servicio de datos.', options)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends Error {
  readonly timeoutMs: number

  constructor(timeoutMs: number, options?: ErrorOptions) {
    super('La solicitud superó el tiempo de espera.', options)
    this.name = 'TimeoutError'
    this.timeoutMs = timeoutMs
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ConfigurationError'
  }
}
