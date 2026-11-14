import type { ReactNode } from 'react'

import styles from './SectionPlaceholder.module.css'

interface SectionPlaceholderProps {
  eyebrow: string
  title: string
  description: string
  controls?: ReactNode
}

export function SectionPlaceholder({
  eyebrow,
  title,
  description,
  controls,
}: SectionPlaceholderProps) {
  return (
    <section className={styles.section} aria-labelledby="section-title">
      <div className={styles.headingBand}>
        <div className={styles.headingCopy}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 id="section-title">{title}</h1>
        </div>
        {controls ? <div className={styles.controls}>{controls}</div> : null}
      </div>

      <div className={styles.placeholderBand}>
        <p className={styles.description}>{description}</p>
        <p className={styles.phase}>Pantalla en desarrollo</p>
      </div>
    </section>
  )
}
