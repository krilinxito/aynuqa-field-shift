/*
 * ARCHIVO GENERADO. NO EDITAR MANUALMENTE.
 * Fuente: contracts/*.schema.json
 * Ejecuta npm run generate:types para regenerarlo.
 */

export interface ChatRequest {
  message: string
  sector_id?: string
  scenario?: 'normal' | 'nino'
}
