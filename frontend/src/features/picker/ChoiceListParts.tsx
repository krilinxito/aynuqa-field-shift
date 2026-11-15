import type { ReactNode } from 'react'

import styles from './ChoiceList.module.css'

/*
 * Lista de opciones grandes para elegir con el dedo. Cada fila es una
 * variante explícita: `Available` se puede tocar, `Unavailable` explica
 * por qué no. No hay props booleanas que cambien el comportamiento.
 */

export function ChoiceListRoot({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <ul className={styles.list} aria-label={label}>
      {children}
    </ul>
  )
}

interface ChoiceContentProps {
  /** Dibujo a la izquierda (decorativo). */
  picture?: ReactNode
  title: string
  description?: string
}

function ChoiceContent({ picture, title, description }: ChoiceContentProps) {
  return (
    <>
      {picture ? <span className={styles.picture}>{picture}</span> : null}
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description ? (
          <span className={styles.description}>{description}</span>
        ) : null}
      </span>
    </>
  )
}

export function ChoiceAvailable({
  onChoose,
  current,
  ...content
}: ChoiceContentProps & {
  onChoose: () => void
  /** Texto que marca la opción ya elegida, por ejemplo "Su sector". */
  current?: string
}) {
  return (
    <li>
      <button type="button" className={styles.choice} onClick={onChoose}>
        <ChoiceContent {...content} />
        {current ? <span className={styles.current}>{current}</span> : null}
        <svg
          className={styles.arrow}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M9 5l7 7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="square"
          />
        </svg>
      </button>
    </li>
  )
}

export function ChoiceUnavailable({
  reason,
  ...content
}: ChoiceContentProps & { reason: string }) {
  return (
    <li className={styles.unavailable}>
      <ChoiceContent {...content} description={reason} />
    </li>
  )
}
