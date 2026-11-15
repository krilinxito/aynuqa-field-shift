import type { SectorDiagnosisViewModel } from '../../domain/presentationModels'

export interface SectorShape {
  id: string
  name: string
  status: 'resting' | 'cultivated'
  riskLevel: 'low' | 'medium' | 'high'
  /** Puntos del polígono listos para `<polygon points>`. */
  points: string
  cx: number
  cy: number
}

/** Recuadro (lon/lat) que cubre todo el dibujo, márgenes incluidos. */
export interface GeoBounds {
  minLon: number
  minLat: number
  maxLon: number
  maxLat: number
}

export interface ProjectedSectors {
  shapes: SectorShape[]
  width: number
  height: number
  bounds: GeoBounds | null
}

const mapWidth = 100
const padding = 4

/**
 * Pasa los polígonos (lon, lat) a un dibujo plano con el norte arriba.
 * La longitud se encoge con el coseno de la latitud para no deformar.
 */
export function projectSectors(
  sectors: readonly SectorDiagnosisViewModel[],
): ProjectedSectors {
  const rings = sectors.map((sector) => sector.geometry.coordinates[0])
  const all = rings.flat()

  if (all.length === 0) {
    return { shapes: [], width: mapWidth, height: mapWidth, bounds: null }
  }

  const lons = all.map(([lon]) => lon)
  const lats = all.map(([, lat]) => lat)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const stretch = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const spanX = (maxLon - minLon) * stretch || 1
  const spanY = maxLat - minLat || 1
  const scale = (mapWidth - padding * 2) / spanX
  const height = spanY * scale + padding * 2
  const toX = (lon: number) => padding + (lon - minLon) * stretch * scale
  const toY = (lat: number) => padding + (maxLat - lat) * scale
  const round = (value: number) => Math.round(value * 100) / 100

  const shapes = sectors.map((sector, index) => ({
    id: sector.id,
    name: sector.name,
    status: sector.rotation.status,
    riskLevel: sector.risk.level,
    points: rings[index]
      .map(([lon, lat]) => `${round(toX(lon))},${round(toY(lat))}`)
      .join(' '),
    cx: round(toX(sector.centroid.lon)),
    cy: round(toY(sector.centroid.lat)),
  }))

  // Lo que cubre el dibujo entero: sirve para pedir la foto satelital exacta.
  // Como la proyección es lineal en lon y lat, una imagen en EPSG:4326 estirada
  // al recuadro calza con los polígonos.
  const bounds = {
    minLon: minLon - padding / (stretch * scale),
    maxLon: maxLon + padding / (stretch * scale),
    minLat: minLat - padding / scale,
    maxLat: maxLat + padding / scale,
  }

  return { shapes, width: mapWidth, height: round(height), bounds }
}
