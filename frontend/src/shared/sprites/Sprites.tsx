import { PixelSprite } from './PixelSprite'
import {
  chakanaRows,
  cloudRows,
  llamaRestingRows,
  llamaStandingRows,
  llamaWalkingRows,
  plantRows,
  sunRows,
} from './spriteRows'
import styles from './Sprites.module.css'

interface SpriteProps {
  size?: number
  className?: string
}

export function LlamaStanding({ size = 4.5, className }: SpriteProps) {
  return (
    <PixelSprite
      rows={llamaStandingRows}
      size={size}
      className={[styles.llamaStanding, className].filter(Boolean).join(' ')}
    />
  )
}

export function LlamaResting({ size = 5, className }: SpriteProps) {
  return (
    <PixelSprite
      rows={llamaRestingRows}
      size={size}
      className={[styles.llamaResting, className].filter(Boolean).join(' ')}
    />
  )
}

export function Plant({ size = 3.5, className }: SpriteProps) {
  return (
    <PixelSprite
      rows={plantRows}
      size={size}
      className={[styles.plantSway, className].filter(Boolean).join(' ')}
    />
  )
}

export function Sun({ size = 2.5, className }: SpriteProps) {
  return <PixelSprite rows={sunRows} size={size} className={className} />
}

export function Cloud({ size = 3.5, className }: SpriteProps) {
  return <PixelSprite rows={cloudRows} size={size} className={className} />
}

export function Chakana({ size = 2.25, className }: SpriteProps) {
  return <PixelSprite rows={chakanaRows} size={size} className={className} />
}

/** Llama que camina: alterna dos dibujos. Se queda quieta si se pide menos movimiento. */
export function LlamaWalking({ size = 4.5 }: SpriteProps) {
  return (
    <span className={styles.walker} aria-hidden="true">
      <PixelSprite
        rows={llamaStandingRows}
        size={size}
        className={styles.stepOne}
      />
      <PixelSprite
        rows={llamaWalkingRows}
        size={size}
        className={styles.stepTwo}
      />
    </span>
  )
}

/** Cordillera nevada con sol y nube: cabecera decorativa. */
export function Skyline() {
  return (
    <div className={styles.skyline} aria-hidden="true">
      <Sun className={styles.sun} size={2.4} />
      <Cloud className={styles.cloud} size={3.2} />
      <Cloud className={styles.cloudTwo} size={2.3} />
      <svg
        className={styles.mountains}
        viewBox="0 0 120 30"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        focusable="false"
      >
        <path
          fill="#7d6a8c"
          d="M0 30V20h4v-2h4v-3h4v-3h4v-2h4v2h4v3h4v3h4v-2h4v-4h4v-4h4v-3h4V5h4v2h4v4h4v4h4v3h4v-3h4v-3h4v-3h4v-2h4v2h4v3h4v4h4v3h4v3h4v4z"
        />
        <path
          fill="#ffffff"
          d="M16 10h4v2h-4zM12 12h4v2h-4zM20 12h4v2h-4zM52 5h4v2h-4zM48 8h4v2h-4zM56 7h4v3h-4zM44 12h4v2h-4zM60 11h4v2h-4zM88 9h4v2h-4zM84 12h4v2h-4zM92 11h4v2h-4z"
        />
        <path
          fill="#c99a2e"
          d="M0 30v-5h8v-1h12v1h14v-2h16v2h12v1h14v-2h18v2h12v-1h14v5z"
        />
      </svg>
    </div>
  )
}

/** Línea simple entre secciones. */
export function PlainDivider() {
  return <div className={styles.plain} role="presentation" />
}

/** Franja de aguayo: marca los cambios grandes de tema, en lugar de cajas. */
export function AguayoDivider() {
  return <div className={styles.aguayo} role="presentation" />
}
