import { Navigate } from 'react-router-dom'

import { useAppState } from '../app/providers/appStateContext'
import { Chat } from '../features/chat'
import { useSelectedSector } from '../features/data/useSelectedSector'
import { sectorNumber } from '../features/insight/insightText'
import { LoadError } from '../shared/components/LoadError'
import { RouteLoading } from '../shared/components/RouteLoading'
import { LlamaStanding } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

/** Pantalla del asistente: preguntar con un toque, hablando o escribiendo. */
export function AskRoute() {
  const { state } = useAppState()
  const selected = useSelectedSector()

  if (selected.status === 'loading') {
    return <RouteLoading />
  }

  if (selected.status === 'error') {
    return <LoadError />
  }

  if (selected.status === 'missing') {
    return <Navigate replace to={state.communityId ? '/sector' : '/comunidad'} />
  }

  const { sector, snapshot } = selected

  return (
    <Chat.Provider
      key={`${sector.id}-${snapshot.scenario}`}
      sectorId={sector.id}
      sectorNumber={sectorNumber(sector)}
      scenario={snapshot.scenario}
    >
      <div className={styles.page}>
        <header className={styles.welcome}>
          <LlamaStanding size={5} />
          <div>
            <h1>Pregunte a la llamita</h1>
            <p>
              Responde sobre el {sector.name.toLowerCase()} de {snapshot.zone.name}
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
          La llamita es un programa. Usa los datos de su sector y puede
          equivocarse. No reemplaza a la asamblea ni al agrónomo.
        </p>
      </div>
    </Chat.Provider>
  )
}
