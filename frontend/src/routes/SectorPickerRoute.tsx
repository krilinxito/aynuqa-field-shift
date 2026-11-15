import { Link } from 'react-router-dom'

import { useAppState } from '../app/providers/appStateContext'
import { useSectorSnapshot } from '../features/data/useSectorSnapshot'
import { rotationText } from '../features/insight/insightText'
import { ChoiceList, SectorMap } from '../features/picker'
import { LoadError } from '../shared/components/LoadError'
import { RouteLoading } from '../shared/components/RouteLoading'
import { LlamaResting, Plant } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

/** Segunda pantalla: ¿cuál es su sector? */
export function SectorPickerRoute() {
  const { state, actions } = useAppState()
  const { status, snapshot } = useSectorSnapshot(state.scenario)

  if (!snapshot) {
    return status === 'error' ? <LoadError /> : <RouteLoading />
  }

  return (
    <div className={styles.page}>
      <header>
        <p className={styles.place}>
          {snapshot.zone.name} ·{' '}
          <Link to="/comunidad">Cambiar comunidad</Link>
        </p>
        <h1>¿Cuál es su sector?</h1>
        <p>Toque su sector en el dibujo o en la lista.</p>
      </header>

      <SectorMap
        sectors={snapshot.sectors}
        selectedSectorId={state.selectedSectorId}
        onChoose={actions.selectSector}
      />

      <ChoiceList.Root label="Sectores">
        {snapshot.sectors.map((sector) => (
          <ChoiceList.Available
            key={sector.id}
            picture={
              sector.rotation.status === 'resting' ? (
                <LlamaResting size={4} />
              ) : (
                <Plant size={3} />
              )
            }
            title={sector.name}
            description={rotationText(sector)}
            current={
              state.selectedSectorId === sector.id ? 'Su sector' : undefined
            }
            onChoose={() => actions.selectSector(sector.id)}
          />
        ))}
      </ChoiceList.Root>

      <p className={styles.footnote}>
        Los límites de los sectores y los años de descanso son simulados.
      </p>
    </div>
  )
}
