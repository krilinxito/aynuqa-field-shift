/*
 * ARCHIVO GENERADO. NO EDITAR MANUALMENTE.
 * Fuente: contracts/*.schema.json
 * Ejecuta npm run generate:types para regenerarlo.
 */

export interface HistoryResponse {
  updated_at: string
  data_source: 'mock' | 'real'
  sector_id: string
  from: string
  to: string
  series: {
    date: string
    /**
     * Del sector. null si falta.
     */
    ndvi: number | null
    /**
     * De la zona. Lluvia total del mes, en mm.
     */
    precip_mm: number | null
    /**
     * De la zona. Fraccion de 0 a 1 (GWETROOT).
     */
    soil_moisture: number | null
    /**
     * De la zona. Temperatura media del mes.
     */
    temp_c: number | null
    /**
     * Global. RONI de la temporada centrada en ese mes.
     */
    roni: number | null
  }[]
}
