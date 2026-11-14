import type { SensorsResponse } from '../contracts/generated'
import { adaptProvenance } from './provenanceAdapter'
import { formatValue } from './formatters'

export function adaptSensors(response: SensorsResponse) {
  return {
    sectorId: response.sector_id,
    hours: response.hours,
    readings: response.readings.map((reading) => ({
      timestamp: reading.ts,
      soilMoisture: formatValue(reading.soil_moisture_pct, '%'),
      airTemperature: formatValue(reading.air_temp_c, '°C'),
      canopyTemperatureDelta: formatValue(
        reading.canopy_temp_delta_c,
        '°C',
      ),
      frostAlert: reading.frost_alert,
      waterStressAlert: reading.water_stress_alert,
      isSimulated: reading.is_simulated,
    })),
    provenance: adaptProvenance({
      updatedAt: response.updated_at,
      isSimulated: response.is_simulated,
    }),
  }
}
