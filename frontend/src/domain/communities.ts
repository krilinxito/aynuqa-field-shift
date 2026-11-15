/*
 * Comunidades del altiplano que conoce el proyecto (las mismas zonas que usa
 * ML en `ml/zones.json`). Hoy solo Pumani tiene recomendaciones: las demás
 * se usan como "tierras gemelas" y se muestran como "todavía sin datos".
 * Una comunidad se puede elegir solo si la API devuelve su zona.
 */
export interface Community {
  id: string
  name: string
  place: string
}

export const communities: readonly Community[] = [
  { id: 'pumani', name: 'Pumani', place: 'Ayo Ayo, La Paz' },
  { id: 'patacamaya', name: 'Patacamaya', place: 'La Paz' },
  { id: 'sica_sica', name: 'Sica Sica', place: 'La Paz' },
  { id: 'caquiaviri', name: 'Caquiaviri', place: 'La Paz' },
  { id: 'jesus_de_machaca', name: 'Jesús de Machaca', place: 'La Paz' },
  { id: 'tiahuanaco', name: 'Tiahuanaco', place: 'La Paz' },
  { id: 'curahuara', name: 'Curahuara de Carangas', place: 'Oruro' },
  { id: 'toledo', name: 'Toledo', place: 'Oruro' },
]

export function findCommunity(id: string | null): Community | undefined {
  return communities.find((community) => community.id === id)
}
