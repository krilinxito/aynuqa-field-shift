import type { GeoBounds } from './projectSectors'

const ESRI_EXPORT =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export'

export const SATELLITE_ATTRIBUTION =
  'Imagen: Esri, Maxar, Earthstar Geographics y la comunidad de usuarios SIG'

/**
 * Una sola foto (JPG) del recuadro de los sectores, en lon/lat (EPSG:4326),
 * para que calce con el dibujo. Pesa ~150-250 KB y el service worker la
 * guarda para verla sin señal.
 */
export function satelliteImageUrl(
  bounds: GeoBounds,
  aspect: number,
  widthPx = 720,
): string {
  const heightPx = Math.min(1400, Math.max(200, Math.round(widthPx * aspect)))
  const bbox = [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat]
    .map((value) => value.toFixed(6))
    .join(',')
  const params = new URLSearchParams({
    bbox,
    bboxSR: '4326',
    imageSR: '4326',
    size: `${widthPx},${heightPx}`,
    format: 'jpg',
    f: 'image',
  })
  return `${ESRI_EXPORT}?${params.toString()}`
}
