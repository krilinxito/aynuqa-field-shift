import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

import backtestSchema from '../../../../contracts/backtest.schema.json'
import decisionSchema from '../../../../contracts/decision.schema.json'
import chatRequestSchema from '../../../../contracts/chat_request.schema.json'
import chatResponseSchema from '../../../../contracts/chat_response.schema.json'
import errorSchema from '../../../../contracts/error.schema.json'
import healthSchema from '../../../../contracts/health.schema.json'
import historySchema from '../../../../contracts/history.schema.json'
import sectorRiskSchema from '../../../../contracts/sector_risk.schema.json'
import sensorsSchema from '../../../../contracts/sensors.schema.json'
import twinPrecedentSchema from '../../../../contracts/twin_precedent.schema.json'
import { ContractError } from '../transport/errors'
import type {
  ApiErrorResponse,
  BacktestResponse,
  ChatRequest,
  ChatResponse,
  Decision,
  HealthResponse,
  HistoryResponse,
  SectorRiskResponse,
  SensorsResponse,
  TwinPrecedent,
} from './generated'

export const contractSchemas = {
  sectorRisk: sectorRiskSchema,
  history: historySchema,
  sensors: sensorsSchema,
  backtest: backtestSchema,
  chatRequest: chatRequestSchema,
  chatResponse: chatResponseSchema,
  health: healthSchema,
  apiError: errorSchema,
  twinPrecedent: twinPrecedentSchema,
  decision: decisionSchema,
} as const

export interface ContractTypes {
  sectorRisk: SectorRiskResponse
  history: HistoryResponse
  sensors: SensorsResponse
  backtest: BacktestResponse
  chatRequest: ChatRequest
  chatResponse: ChatResponse
  health: HealthResponse
  apiError: ApiErrorResponse
  twinPrecedent: TwinPrecedent
  decision: Decision
}

export type ContractName = keyof ContractTypes

export const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
})

addFormats(ajv)

for (const [name, schema] of Object.entries(contractSchemas)) {
  ajv.addSchema(schema, name)
}

const validators = Object.fromEntries(
  (Object.keys(contractSchemas) as ContractName[]).map((name) => {
    const validator = ajv.getSchema(name)

    if (!validator) {
      throw new Error(`No se registró el schema ${name}.`)
    }

    return [name, validator]
  }),
) as Record<ContractName, ValidateFunction>

export function isContract<K extends ContractName>(
  name: K,
  value: unknown,
): value is ContractTypes[K] {
  return validators[name](value) === true
}

export function parseContract<K extends ContractName>(
  name: K,
  value: unknown,
): ContractTypes[K] {
  const validator = validators[name]

  if (!validator(value)) {
    throw new ContractError(name, validator.errors)
  }

  return value as ContractTypes[K]
}

export function getContractValidator(name: ContractName): ValidateFunction {
  return validators[name]
}
