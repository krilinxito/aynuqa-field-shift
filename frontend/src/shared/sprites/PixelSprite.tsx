import type { ReactNode } from 'react'

import { spritePalette } from './spritePalette'

interface PixelSpriteProps {
  /** Filas de caracteres: cada letra es un color de `spritePalette`, el punto es vacío. */
  rows: readonly string[]
  /** Ancho en pantalla, en rem. El alto se calcula solo. */
  size?: number
  className?: string
  /** Si el dibujo dice algo que el texto no dice, descríbelo aquí. */
  label?: string
  children?: ReactNode
}

/**
 * Dibuja un sprite de píxeles como SVG. Une los píxeles vecinos del mismo
 * color en una sola barra para que el dibujo pese muy poco.
 */
export function PixelSprite({
  rows,
  size = 4,
  className,
  label,
  children,
}: PixelSpriteProps) {
  const width = Math.max(...rows.map((row) => row.length))
  const height = rows.length
  const rects: ReactNode[] = []

  rows.forEach((row, y) => {
    let x = 0

    while (x < row.length) {
      const key = row[x]
      const fill = spritePalette[key]

      if (!fill) {
        x += 1
        continue
      }

      let end = x + 1

      while (end < row.length && row[end] === key) {
        end += 1
      }

      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={end - x}
          height={1}
          fill={fill}
        />,
      )
      x = end
    }
  })

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      style={{ inlineSize: `${size}rem`, blockSize: 'auto' }}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {rects}
      {children}
    </svg>
  )
}
