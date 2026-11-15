import { useState, type KeyboardEvent } from 'react'

import { useLanguage } from '../../app/i18n/languageContext'
import { readStored, writeStored } from '../../app/state/deviceStorage'
import type { SectorDiagnosisViewModel } from '../../domain/presentationModels'
import { useOnline } from '../../shared/hooks/useOnline'
import { sectorNumber } from '../insight/insightText'
import { projectSectors } from './projectSectors'
import { SATELLITE_ATTRIBUTION, satelliteImageUrl } from './satelliteImage'
import styles from './SectorMap.module.css'

interface SectorMapProps {
  sectors: readonly SectorDiagnosisViewModel[]
  selectedSectorId: string | null
  onChoose: (sectorId: string) => void
}

type MapView = 'photo' | 'drawing'

const VIEW_KEY = 'aynuqa:map-view'

const RISK_WORDS = { low: 'bajo', medium: 'medio', high: 'alto' } as const

/**
 * Los sectores sobre la foto satelital, con el norte arriba. El borde dice el
 * riesgo de sequía y el rayado el descanso. Cada sector se puede tocar o
 * abrir con el teclado. Sin señal, si la foto no está guardada, queda el dibujo.
 */
export function SectorMap({ sectors, selectedSectorId, onChoose }: SectorMapProps) {
  const { t, tr } = useLanguage()
  const isOnline = useOnline()
  const { shapes, width, height, bounds } = projectSectors(sectors)
  const [view, setView] = useState<MapView>(() =>
    readStored(VIEW_KEY) === 'drawing' ? 'drawing' : 'photo',
  )
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageUrl = bounds ? satelliteImageUrl(bounds, height / width) : null
  const photoFailed = imageUrl !== null && failedUrl === imageUrl
  const showPhoto = view === 'photo' && imageUrl !== null && !photoFailed

  function chooseView(next: MapView) {
    setView(next)
    writeStored(VIEW_KEY, next)
  }

  function handleKey(event: KeyboardEvent, id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onChoose(id)
    }
  }

  return (
    <figure className={styles.figure}>
      <div className={styles.switch} role="group" aria-label={t.mapViewLabel}>
        <button
          type="button"
          aria-pressed={view === 'photo'}
          onClick={() => chooseView('photo')}
        >
          {t.mapPhoto}
        </button>
        <button
          type="button"
          aria-pressed={view === 'drawing'}
          onClick={() => chooseView('drawing')}
        >
          {t.mapColors}
        </button>
      </div>

      <svg
        className={styles.map}
        data-view={showPhoto ? 'photo' : 'drawing'}
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={t.mapTitle}
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
          <pattern
            id="trama-descanso-foto"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="1.1" height="4" fill="#fffaf0" opacity="0.75" />
          </pattern>
        </defs>

        {showPhoto && imageUrl ? (
          <image
            href={imageUrl}
            x="0"
            y="0"
            width={width}
            height={height}
            preserveAspectRatio="none"
            onError={() => setFailedUrl(imageUrl)}
          />
        ) : null}

        {shapes.map((shape) => {
          const isSelected = shape.id === selectedSectorId
          const number = sectorNumber(shape)
          const fill = showPhoto
            ? shape.status === 'resting'
              ? 'url(#trama-descanso-foto)'
              : 'rgba(143, 179, 122, 0.28)'
            : shape.status === 'resting'
              ? 'url(#trama-descanso)'
              : '#8fb37a'

          return (
            <g
              key={shape.id}
              className={styles.sector}
              data-risk={shape.riskLevel}
              data-selected={isSelected}
              role="button"
              tabIndex={0}
              aria-label={t.mapSectorLabel(number, tr(RISK_WORDS[shape.riskLevel]))}
              onClick={() => onChoose(shape.id)}
              onKeyDown={(event) => handleKey(event, shape.id)}
            >
              {/* Halo claro para que el borde se lea sobre la foto */}
              <polygon points={shape.points} className={styles.halo} />
              <polygon points={shape.points} className={styles.outline} fill={fill} />
              <circle cx={shape.cx} cy={shape.cy} r="5.2" className={styles.badge} />
              <text x={shape.cx} y={shape.cy} className={styles.number}>
                {number}
              </text>
            </g>
          )
        })}
      </svg>

      {view === 'photo' && photoFailed ? (
        <p className={styles.notice}>{t.mapPhotoUnavailable}</p>
      ) : null}

      <figcaption className={styles.legend}>
        <span>
          <span className={`${styles.swatch} ${styles.swatchResting}`} />
          {t.mapLegendResting}
        </span>
        <span>
          <span className={`${styles.swatch} ${styles.swatchCultivated}`} />
          {t.mapLegendCultivated}
        </span>
        <span>
          <span className={styles.riskSwatches} aria-hidden="true">
            <span data-risk="low" />
            <span data-risk="medium" />
            <span data-risk="high" />
          </span>
          {t.mapLegendRisk}
        </span>
        <span className={styles.simulated}>{t.mapNorthSimulated}</span>
        {showPhoto ? (
          <span className={styles.attribution}>
            {SATELLITE_ATTRIBUTION}
            {isOnline ? '' : ' (guardada)'}
          </span>
        ) : null}
      </figcaption>
    </figure>
  )
}
