/*
 * ARCHIVO GENERADO. NO EDITAR MANUALMENTE.
 * Fuente: contracts/*.schema.json
 * Ejecuta npm run generate:types para regenerarlo.
 */

export interface BacktestResponse {
  updated_at: string
  data_source: 'mock' | 'real'
  event: '2015-16' | '2023-24' | '2020-22'
  event_type: 'nino' | 'nina'
  /**
   * true si el evento quedo fuera del entrenamiento.
   */
  held_out: boolean
  /**
   * Backtest principal: serie temporal de la zona.
   */
  zone: {
    id: string
    series: {
      date: string
      roni: number | null
      predicted_risk: number | null
      observed_ndvi_anomaly: number | null
      precip_anomaly_pct: number | null
    }[]
    mean_predicted_risk: number | null
    mean_observed_ndvi_anomaly: number | null
    metric: {
      spearman: number | null
      n: number
      /**
       * Advertencia sobre como leer la metrica.
       */
      note: string | null
    }
  }
  /**
   * Evidencia secundaria: solo NDVI por sector.
   */
  per_sector: {
    sector_id: string
    predicted_risk: number | null
    observed_ndvi_anomaly: number | null
  }[]
  per_sector_metric: {
    spearman: number | null
    n: number
    /**
     * Advertencia sobre como leer la metrica.
     */
    note: string | null
  }
  note: string | null
}
