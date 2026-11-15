/*
 * ARCHIVO GENERADO. NO EDITAR MANUALMENTE.
 * Fuente: contracts/*.schema.json
 * Ejecuta npm run generate:types para regenerarlo.
 */

export interface TwinPrecedent {
  sector_id: string
  /**
   * Nombre de la zona analoga donde esta la tierra gemela.
   */
  twin_zone: string
  twin_elevation_m: number
  twin_slope_pct: number
  /**
   * Parecido fisico entre el sector y su tierra gemela, de 0 a 1.
   */
  similarity: number
  /**
   * El Nino pasado al que corresponde el precedente.
   */
  event: '2015-16' | '2023-24'
  /**
   * Anomalia de NDVI observada en la tierra gemela durante el evento, en desviaciones estandar. Dato real.
   */
  observed_ndvi_anomaly: number | null
  confidence: number
  confidence_label: 'baja' | 'media' | 'alta'
  /**
   * false: el NDVI y el terreno de la tierra gemela son mediciones reales.
   */
  is_simulated: boolean
}
