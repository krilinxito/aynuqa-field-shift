import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { compile } from 'json-schema-to-typescript'

const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contractsDirectory = resolve(frontendDirectory, '..', 'contracts')
const outputDirectory = resolve(
  frontendDirectory,
  'src',
  'data',
  'contracts',
  'generated',
)
const checkOnly = process.argv.includes('--check')

const contracts = [
  ['sector_risk.schema.json', 'SectorRiskResponse'],
  ['history.schema.json', 'HistoryResponse'],
  ['sensors.schema.json', 'SensorsResponse'],
  ['backtest.schema.json', 'BacktestResponse'],
  ['chat_request.schema.json', 'ChatRequest'],
  ['chat_response.schema.json', 'ChatResponse'],
  ['health.schema.json', 'HealthResponse'],
  ['error.schema.json', 'ApiErrorResponse'],
  ['twin_precedent.schema.json', 'TwinPrecedent'],
  ['decision.schema.json', 'Decision'],
]

const bannerComment = `/*
 * ARCHIVO GENERADO. NO EDITAR MANUALMENTE.
 * Fuente: contracts/*.schema.json
 * Ejecuta npm run generate:types para regenerarlo.
 */`

async function generateContract(schemaFile, typeName) {
  const sourcePath = resolve(contractsDirectory, schemaFile)
  const schema = JSON.parse(await readFile(sourcePath, 'utf8'))
  schema.title = typeName
  const generated = await compile(schema, typeName, {
    bannerComment,
    cwd: contractsDirectory,
    additionalProperties: false,
    declareExternallyReferenced: true,
    unknownAny: true,
    unreachableDefinitions: false,
    style: {
      semi: false,
      singleQuote: true,
      trailingComma: 'all',
    },
  })

  return generated.replaceAll('\r\n', '\n')
}

await mkdir(outputDirectory, { recursive: true })

const staleFiles = []

for (const [schemaFile, typeName] of contracts) {
  const outputPath = resolve(outputDirectory, `${typeName}.ts`)
  const generated = await generateContract(schemaFile, typeName)

  if (checkOnly) {
    let current = ''

    try {
      current = (await readFile(outputPath, 'utf8')).replaceAll('\r\n', '\n')
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error
      }
    }

    if (current !== generated) {
      staleFiles.push(typeName)
    }
  } else {
    await writeFile(outputPath, generated, 'utf8')
    console.log(`Generado: ${typeName}.ts`)
  }
}

if (staleFiles.length > 0) {
  console.error(
    `Tipos contractuales desactualizados: ${staleFiles.join(', ')}. ` +
      'Ejecuta npm run generate:types.',
  )
  process.exitCode = 1
} else if (checkOnly) {
  console.log('Tipos contractuales actualizados.')
}
