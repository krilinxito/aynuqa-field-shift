import type { ZoneViewModel } from '../../domain/presentationModels'
import { ninoText, weatherLines } from '../insight/insightText'
import styles from './ZoneWeather.module.css'

/** El tiempo de la zona: es el mismo para todos los sectores. */
export function ZoneWeather({ zone }: { zone: ZoneViewModel }) {
  return (
    <section aria-labelledby="zona-titulo">
      <h2 id="zona-titulo">El tiempo en toda la zona de {zone.name}</h2>
      <p className={styles.note}>
        {zone.periodText}. Es igual para todos los sectores.
      </p>
      <p>{ninoText(zone)}</p>
      <dl className={styles.weather}>
        {weatherLines(zone).map((line) => (
          <div key={line.label}>
            <dt>{line.label}</dt>
            <dd>{line.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
