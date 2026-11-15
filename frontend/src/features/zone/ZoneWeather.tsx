import { useLanguage } from '../../app/i18n/languageContext'
import type { ZoneViewModel } from '../../domain/presentationModels'
import { ninoText, weatherLines } from '../insight/insightText'
import styles from './ZoneWeather.module.css'

/** El tiempo de la zona: es el mismo para todos los sectores. */
export function ZoneWeather({ zone }: { zone: ZoneViewModel }) {
  const { t, tr } = useLanguage()

  return (
    <section aria-labelledby="zona-titulo" className={styles.section}>
      <h2 id="zona-titulo" className={styles.heading}>
        {t.weatherInZone(zone.name)}
      </h2>
      <p className={styles.note}>
        {zone.periodText} · {t.equalForAllSectors}
      </p>
      <p className={styles.ninoBadge}>{tr(ninoText(zone))}</p>
      <dl className={styles.weather}>
        {weatherLines(zone).map((line) => (
          <div key={line.label} className={styles.weatherCard}>
            <dt>{tr(line.label)}</dt>
            <dd>{tr(line.text)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
