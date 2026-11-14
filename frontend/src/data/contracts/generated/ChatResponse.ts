/*
 * ARCHIVO GENERADO. NO EDITAR MANUALMENTE.
 * Fuente: contracts/*.schema.json
 * Ejecuta npm run generate:types para regenerarlo.
 */

export interface ChatResponse {
  answer: string
  sources: {
    tool: 'get_sector' | 'compare_scenarios' | 'get_history' | 'get_sensors' | 'get_twin_precedent'
    sector_id: string | null
    fields: string[]
  }[]
  /**
   * Frase corta sobre la confianza de lo respondido.
   */
  confidence_note: string
  updated_at: string
}
