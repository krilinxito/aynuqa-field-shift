import { isDemoData } from '../../app/status/demoData'
import type { ProvenanceViewModel } from '../../domain/presentationModels'
import styles from './ZoneWeather.module.css'

/** De dónde salen los datos, qué es simulado y cuándo se actualizaron. */
export function Provenance({ provenance }: { provenance: ProvenanceViewModel }) {
  return (
    <footer className={styles.provenance}>
      <p>
        <strong>Datos simulados:</strong> los límites de los sectores y los años
        de descanso. El clima y el verdor vienen de satélites de la NASA.
      </p>
      {provenance.dataSource === 'mock' || isDemoData() ? (
        <p>
          <strong>Datos de demostración:</strong> estos números son de ejemplo.
        </p>
      ) : null}
      <p>
        Última actualización:{' '}
        <time dateTime={provenance.updatedAt}>{provenance.updatedAtText}</time>
      </p>
      <p>Esta ayuda no reemplaza a la asamblea ni al agrónomo.</p>
    </footer>
  )
}
