/*
 * ARCHIVO GENERADO. NO EDITAR MANUALMENTE.
 * Fuente: contracts/*.schema.json
 * Ejecuta npm run generate:types para regenerarlo.
 */

/**
 * Lo que la asamblea decidió hacer. La escribe la persona en el celular; no es una predicción. Puede seguir o no la recomendación.
 */
export interface Decision {
  /**
   * UUID creado en el celular, para poder guardar sin señal.
   */
  id: string
  community_id: string
  sector_id: string
  scenario: 'normal' | 'nino'
  action: 'open' | 'extend_rest' | 'start_rest' | 'keep_cultivating' | 'other'
  recommended_action: 'open' | 'extend_rest' | 'start_rest' | 'keep_cultivating' | null
  follows_recommendation: boolean
  note: string | null
  decided_at: string
}
