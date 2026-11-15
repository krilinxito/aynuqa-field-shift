import { useState, type ReactNode } from 'react'

import { useLanguage } from '../../app/i18n/languageContext'
import styles from './DoseSection.module.css'

interface DoseSectionProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * Tarjeta desplegable para dosificar la información paso a paso.
 * Pensada para personas mayores: botón grande, letra clara y una sola cosa a la vez.
 */
export function DoseSection({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: DoseSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const { t } = useLanguage()

  return (
    <div className={styles.card} data-open={isOpen}>
      <button
        type="button"
        className={`${styles.trigger} no-imprimir`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {icon ? (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className={styles.headingText}>
          <span className={styles.title}>{title}</span>
          {subtitle ? (
            <span className={styles.subtitle}>{subtitle}</span>
          ) : null}
        </span>
        <span className={styles.badge} aria-hidden="true">
          {isOpen ? `${t.hide} ▲` : `${t.show} ▼`}
        </span>
      </button>

      {isOpen ? <div className={styles.content}>{children}</div> : null}
    </div>
  )
}
