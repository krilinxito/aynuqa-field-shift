/*
 * ARCHIVO GENERADO. NO EDITAR MANUALMENTE.
 * Fuente: contracts/*.schema.json
 * Ejecuta npm run generate:types para regenerarlo.
 */

export interface SectorRiskResponse {
  updated_at: string
  /**
   * mock si son los ejemplos de contracts/, real si vienen de ML.
   */
  data_source: 'mock' | 'real'
  /**
   * nino es el estado real de hoy; normal es la comparacion.
   */
  scenario: 'normal' | 'nino'
  zone: {
    id: string
    name: string
    lat: number
    lon: number
    /**
     * Indice relativo de El Nino (RONI) de NOAA usado en el escenario.
     */
    roni: {
      value: number
      /**
       * Temporada de tres meses, por ejemplo ASO. null si el valor es supuesto.
       */
      season: string | null
      year: number | null
      /**
       * observed en el escenario nino; assumed en el escenario normal.
       */
      kind: 'observed' | 'assumed'
    }
    /**
     * Clima observado de la zona. Es igual para todos los sectores.
     */
    climate: {
      period: string
      /**
       * Lluvia total del mes, en mm.
       */
      precip_mm: number | null
      precip_anomaly_pct: number | null
      temp_c: number | null
      temp_anomaly_c: number | null
      /**
       * Humedad de la zona de raices, fraccion de 0 a 1 (GWETROOT).
       */
      soil_moisture: number | null
      soil_moisture_anomaly: number | null
    }
  }
  /**
   * @minItems 1
   */
  sectors: [
    {
      id: string
      name: string
      /**
       * Poligono GeoJSON, coordenadas [lon, lat]. Simulado.
       */
      geometry: {
        type: 'Polygon'
        /**
         * @minItems 1
         */
        coordinates: [
          [[number, number], [number, number], [number, number], [number, number], ...[number, number][]],
          ...[[number, number], [number, number], [number, number], [number, number], ...[number, number][]][],
        ]
      }
      centroid: {
        lat: number
        lon: number
      }
      area_ha: number
      /**
       * De NASADEM. Real.
       */
      terrain: {
        elevation_m: number | null
        slope_pct: number | null
        aspect_deg: number | null
      }
      /**
       * Estado de la rotacion. Simulado segun el ciclo publicado de Pumani.
       */
      rotation: {
        status: 'resting' | 'cultivated'
        years_in_status: number
        is_simulated: true
      }
      /**
       * Ultimo NDVI disponible del sector. Real.
       */
      vegetation: {
        date: string
        /**
         * NDVI del sector, de -1 a 1. null si falta.
         */
        ndvi: number | null
        /**
         * Desviaciones estandar respecto al mismo mes desde 2000.
         */
        ndvi_anomaly: number | null
      }
      /**
       * Riesgo de sequia del proximo ciclo.
       */
      risk: {
        score: number
        /**
         * low si score < 0.33, medium si < 0.66, high en otro caso.
         */
        level: 'low' | 'medium' | 'high'
        /**
         * Intervalo del modelo de cuantiles.
         */
        interval: {
          low: number
          high: number
        }
        confidence: number
        /**
         * baja si confidence < 0.4, media hasta 0.7, alta por encima.
         */
        confidence_label: 'baja' | 'media' | 'alta'
        drivers: {
          /**
           * Nombre de la variable del modelo.
           */
          feature: string
          /**
           * Explicacion en espanol simple.
           */
          label: string
          direction: 'increases' | 'decreases'
          /**
           * Peso relativo de la variable (SHAP normalizado).
           */
          weight: number
        }[]
      }
      /**
       * Recuperacion del suelo durante el descanso.
       */
      recovery: {
        score: number
        level: 'low' | 'medium' | 'high'
        confidence: number
        confidence_label: 'baja' | 'media' | 'alta'
        /**
         * NDVI corregido por lluvia (RESTREND).
         */
        ndvi_residual: number | null
      }
      recommendation: {
        action: 'open' | 'extend_rest' | 'start_rest' | 'keep_cultivating'
        /**
         * Recomendacion en espanol simple.
         */
        text: string
        /**
         * @minItems 1
         */
        reasons: [string, ...string[]]
        extend_rest_years: number | null
        crop: string | null
        sowing_window: string | null
        confidence: number
        confidence_label: 'baja' | 'media' | 'alta'
      }
      /**
       * Precedente en una tierra gemela, o null si no aplica.
       */
      twin_precedent: TwinPrecedent | null
      /**
       * Los limites del sector y sus anios de descanso son simulados.
       */
      is_simulated: true
    },
    ...{
      id: string
      name: string
      /**
       * Poligono GeoJSON, coordenadas [lon, lat]. Simulado.
       */
      geometry: {
        type: 'Polygon'
        /**
         * @minItems 1
         */
        coordinates: [
          [[number, number], [number, number], [number, number], [number, number], ...[number, number][]],
          ...[[number, number], [number, number], [number, number], [number, number], ...[number, number][]][],
        ]
      }
      centroid: {
        lat: number
        lon: number
      }
      area_ha: number
      /**
       * De NASADEM. Real.
       */
      terrain: {
        elevation_m: number | null
        slope_pct: number | null
        aspect_deg: number | null
      }
      /**
       * Estado de la rotacion. Simulado segun el ciclo publicado de Pumani.
       */
      rotation: {
        status: 'resting' | 'cultivated'
        years_in_status: number
        is_simulated: true
      }
      /**
       * Ultimo NDVI disponible del sector. Real.
       */
      vegetation: {
        date: string
        /**
         * NDVI del sector, de -1 a 1. null si falta.
         */
        ndvi: number | null
        /**
         * Desviaciones estandar respecto al mismo mes desde 2000.
         */
        ndvi_anomaly: number | null
      }
      /**
       * Riesgo de sequia del proximo ciclo.
       */
      risk: {
        score: number
        /**
         * low si score < 0.33, medium si < 0.66, high en otro caso.
         */
        level: 'low' | 'medium' | 'high'
        /**
         * Intervalo del modelo de cuantiles.
         */
        interval: {
          low: number
          high: number
        }
        confidence: number
        /**
         * baja si confidence < 0.4, media hasta 0.7, alta por encima.
         */
        confidence_label: 'baja' | 'media' | 'alta'
        drivers: {
          /**
           * Nombre de la variable del modelo.
           */
          feature: string
          /**
           * Explicacion en espanol simple.
           */
          label: string
          direction: 'increases' | 'decreases'
          /**
           * Peso relativo de la variable (SHAP normalizado).
           */
          weight: number
        }[]
      }
      /**
       * Recuperacion del suelo durante el descanso.
       */
      recovery: {
        score: number
        level: 'low' | 'medium' | 'high'
        confidence: number
        confidence_label: 'baja' | 'media' | 'alta'
        /**
         * NDVI corregido por lluvia (RESTREND).
         */
        ndvi_residual: number | null
      }
      recommendation: {
        action: 'open' | 'extend_rest' | 'start_rest' | 'keep_cultivating'
        /**
         * Recomendacion en espanol simple.
         */
        text: string
        /**
         * @minItems 1
         */
        reasons: [string, ...string[]]
        extend_rest_years: number | null
        crop: string | null
        sowing_window: string | null
        confidence: number
        confidence_label: 'baja' | 'media' | 'alta'
      }
      /**
       * Precedente en una tierra gemela, o null si no aplica.
       */
      twin_precedent: TwinPrecedent | null
      /**
       * Los limites del sector y sus anios de descanso son simulados.
       */
      is_simulated: true
    }[],
  ]
}
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
