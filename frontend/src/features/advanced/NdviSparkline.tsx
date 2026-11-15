import { useId, useState } from 'react'

import styles from './Advanced.module.css'

export interface NdviPoint {
  date: string
  ndvi: number | null
}

const WIDTH = 320
const HEIGHT = 120
const PAD = { top: 10, right: 10, bottom: 22, left: 34 }

/**
 * Línea de NDVI mensual: una sola serie, sin leyenda (el título la nombra),
 * con cruz y etiqueta al tocar, y la tabla como alternativa accesible.
 */
export function NdviSparkline({
  points,
  tableLabel,
}: {
  points: NdviPoint[]
  tableLabel: string
}) {
  const titleId = useId()
  const [active, setActive] = useState<number | null>(null)
  const valid = points.filter((p): p is { date: string; ndvi: number } => p.ndvi !== null)

  if (valid.length < 2) {
    return <p className={styles.muted}>Sin datos de NDVI suficientes.</p>
  }

  const values = valid.map((p) => p.ndvi)
  const min = Math.min(0, ...values)
  const max = Math.max(...values) * 1.1 || 1
  const innerW = WIDTH - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (i / (valid.length - 1)) * innerW
  const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH
  const path = valid
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.ndvi).toFixed(1)}`)
    .join(' ')
  const ticks = [min, (min + max) / 2, max]
  const current = active === null ? null : valid[active]

  function handlePointer(clientX: number, rect: DOMRect) {
    const ratio = (clientX - rect.left) / rect.width
    const svgX = ratio * WIDTH
    const index = Math.round(((svgX - PAD.left) / innerW) * (valid.length - 1))
    setActive(Math.max(0, Math.min(valid.length - 1, index)))
  }

  return (
    <figure className={styles.chart} aria-labelledby={titleId}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.chartSvg}
        role="img"
        aria-labelledby={titleId}
        onPointerMove={(event) =>
          handlePointer(event.clientX, event.currentTarget.getBoundingClientRect())
        }
        onPointerDown={(event) =>
          handlePointer(event.clientX, event.currentTarget.getBoundingClientRect())
        }
        onPointerLeave={() => setActive(null)}
      >
        <title id={titleId}>NDVI mensual</title>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              className={styles.grid}
            />
            <text x={PAD.left - 4} y={y(tick) + 3} className={styles.axisLabel} textAnchor="end">
              {tick.toFixed(2)}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={HEIGHT - 6} className={styles.axisLabel}>
          {valid[0].date.slice(0, 7)}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 6} className={styles.axisLabel} textAnchor="end">
          {valid[valid.length - 1].date.slice(0, 7)}
        </text>
        <path d={path} className={styles.line} />
        {current && active !== null ? (
          <g>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              className={styles.crosshair}
            />
            <circle cx={x(active)} cy={y(current.ndvi)} r={4.5} className={styles.dot} />
          </g>
        ) : null}
        {/* Área de toque más grande que la línea */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          fill="transparent"
        />
      </svg>
      <p className={styles.readout} aria-live="polite">
        {current
          ? `${current.date.slice(0, 7)}: NDVI ${current.ndvi.toFixed(3)}`
          : 'Toque la línea para ver cada mes.'}
      </p>
      <details className={styles.tableToggle}>
        <summary>{tableLabel}</summary>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">NDVI</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date}>
                <td>{p.date.slice(0, 7)}</td>
                <td>{p.ndvi === null ? '—' : p.ndvi.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
