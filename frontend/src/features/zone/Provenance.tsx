import { useLanguage } from '../../app/i18n/languageContext'
import { isDemoData } from '../../app/status/demoData'
import type { ProvenanceViewModel } from '../../domain/presentationModels'
import styles from './ZoneWeather.module.css'

/** Nota breve y clara al pie: origen de datos y fecha. */
export function Provenance({ provenance }: { provenance: ProvenanceViewModel }) {
  const { t } = useLanguage()

  return (
    <footer className={styles.provenance}>
      <p>
        {t.simulatedFooter}{' '}
        {provenance.dataSource === 'mock' || isDemoData() ? (
          <span>{t.demoFooter} </span>
        ) : null}
        {t.updatedLabel}{' '}
        <time dateTime={provenance.updatedAt}>{provenance.updatedAtText}</time>.
      </p>
    </footer>
  )
}
