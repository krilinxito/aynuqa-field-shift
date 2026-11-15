import { Navigate } from 'react-router-dom'

import { useAppState } from '../app/providers/appStateContext'
import { Chat } from '../features/chat'
import { useSectorSnapshot } from '../features/data/useSectorSnapshot'
import { sectorNumber } from '../features/insight/insightText'
import { LoadError } from '../shared/components/LoadError'
import { RouteLoading } from '../shared/components/RouteLoading'
import { LlamaStanding } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

/**
 * Pantalla del asistente: preguntar con un toque, hablando o escribiendo.
 * Pregunta sobre toda la comunidad, o sobre un sector si se llegó desde él.
 */
export function AskRoute() {
  const { state } = useAppState()
  const { status, snapshot } = useSectorSnapshot(state.scenario)

  if (!state.communityId) {
    return <Navigate replace to="/comunidad" />
  }

  if (!snapshot) {
    return status === 'error' ? <LoadError /> : <RouteLoading />
  }

  const sector =
    snapshot.sectors.find(
      (candidate) => candidate.id === state.selectedSectorId,
    ) ?? null
  const about = sector
    ? `el ${sector.name.toLowerCase()} de ${snapshot.zone.name}`
    : `la comunidad de ${snapshot.zone.name}`

  return (
    <Chat.Provider
      key={`${sector?.id ?? 'comunidad'}-${snapshot.scenario}`}
      sectorId={sector?.id ?? null}
      sectorNumber={sector ? sectorNumber(sector) : null}
      scenario={snapshot.scenario}
    >
      <div className={styles.page}>
        <header className={styles.welcome}>
          <LlamaStanding size={5} />
          <div>
            <h1>Pregunte a la llamita</h1>
            <p>
              Responde sobre {about}
              {snapshot.scenario === 'normal'
                ? ', comparando con un año normal'
                : ''}
              .
            </p>
          </div>
        </header>

        <Chat.OfflineNotice />
        <Chat.Messages />
        <Chat.Suggestions />
        <Chat.Composer>
          <Chat.DictateButton />
        </Chat.Composer>

        <p className={styles.footnote}>
          La llamita es un programa. Usa los datos de la comunidad y puede
          equivocarse. No reemplaza a la asamblea ni al agrónomo.
        </p>
      </div>
    </Chat.Provider>
  )
}
