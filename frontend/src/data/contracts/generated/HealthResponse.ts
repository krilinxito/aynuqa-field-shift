/*
 * ARCHIVO GENERADO. NO EDITAR MANUALMENTE.
 * Fuente: contracts/*.schema.json
 * Ejecuta npm run generate:types para regenerarlo.
 */

export interface HealthResponse {
  status: 'ok'
  version: string
  updated_at: string
  /**
   * De donde sale cada grupo de datos: mock (ejemplos de contracts/) o real (ml/outputs/).
   */
  sources: {
    predictions: 'mock' | 'real'
    history: 'mock' | 'real'
    backtest: 'mock' | 'real'
    analogs: 'mock' | 'real'
  }
}
