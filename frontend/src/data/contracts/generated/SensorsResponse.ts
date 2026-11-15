/*
 * ARCHIVO GENERADO. NO EDITAR MANUALMENTE.
 * Fuente: contracts/*.schema.json
 * Ejecuta npm run generate:types para regenerarlo.
 */

export interface SensorsResponse {
  updated_at: string
  sector_id: string
  hours: number
  is_simulated: true
  readings: {
    ts: string
    /**
     * Porcentaje, de 0 a 100.
     */
    soil_moisture_pct: number
    air_temp_c: number
    canopy_temp_delta_c: number
    /**
     * true cuando air_temp_c <= 0.0.
     */
    frost_alert: boolean
    /**
     * true con soil_moisture_pct < 12 y canopy_temp_delta_c > 2.5 en 3 lecturas seguidas.
     */
    water_stress_alert: boolean
    is_simulated: true
  }[]
}
