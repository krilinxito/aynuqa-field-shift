import type { SectorDiagnosisViewModel } from '../../domain/presentationModels'
import { sectorNumber } from '../insight/insightText'
import { projectSectors } from './projectSectors'
import styles from './SectorMap.module.css'

interface SectorMapProps {
  sectors: readonly SectorDiagnosisViewModel[]
  selectedSectorId: string | null
  onChoose: (sectorId: string) => void
}

/**
 * Dibujo plano de los sectores, con el norte arriba. Se puede tocar, pero
 * es un apoyo visual: la lista de abajo ofrece lo mismo con texto y es la
 * que usan el teclado y los lectores de pantalla.
 */
export function SectorMap({ sectors, selectedSectorId, onChoose }: SectorMapProps) {
  const { shapes, width, height } = projectSectors(sectors)

  return (
    <figure className={styles.figure}>
      <svg
        className={styles.map}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <pattern
            id="trama-descanso"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="4" height="4" fill="#f1e4c9" />
            <rect width="1.2" height="4" fill="#c99a2e" />
          </pattern>
        </defs>
        {shapes.map((shape) => {
          const isSelected = shape.id === selectedSectorId

          return (
            <g
              key={shape.id}
              className={styles.sector}
              onClick={() => onChoose(shape.id)}
            >
              <polygon
                points={shape.points}
                className={isSelected ? styles.selected : undefined}
                fill={
                  shape.status === 'resting' ? 'url(#trama-descanso)' : '#8fb37a'
                }
              />
              <circle cx={shape.cx} cy={shape.cy} r="5.2" className={styles.badge} />
              <text x={shape.cx} y={shape.cy} className={styles.number}>
                {sectorNumber(shape)}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className={styles.legend}>
        <span>
          <span className={`${styles.swatch} ${styles.swatchResting}`} /> Rayado:
          en descanso
        </span>
        <span>
          <span className={`${styles.swatch} ${styles.swatchCultivated}`} /> Verde
          liso: en cultivo
        </span>
        <span className={styles.simulated}>
          Arriba es el norte. Límites simulados.
        </span>
      </figcaption>
    </figure>
  )
}
