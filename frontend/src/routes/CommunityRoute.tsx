import { useAppState } from '../app/providers/appStateContext'
import { communities } from '../domain/communities'
import { useSectorSnapshot } from '../features/data/useSectorSnapshot'
import { ChoiceList } from '../features/picker'
import { LoadError } from '../shared/components/LoadError'
import { RouteLoading } from '../shared/components/RouteLoading'
import { LlamaStanding } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

/** Primera pantalla: ¿de qué comunidad es usted? */
export function CommunityRoute() {
  const { state, actions } = useAppState()
  const { status, snapshot } = useSectorSnapshot(state.scenario)

  if (!snapshot) {
    return status === 'error' ? <LoadError /> : <RouteLoading />
  }

  return (
    <div className={styles.page}>
      <header className={styles.welcome}>
        <LlamaStanding size={5} />
        <div>
          <h1>¿De qué comunidad es usted?</h1>
          <p>Toque el nombre de su comunidad.</p>
        </div>
      </header>

      <ChoiceList.Root label="Comunidades">
        {communities.map((community) =>
          community.id === snapshot.zone.id ? (
            <ChoiceList.Available
              key={community.id}
              title={snapshot.zone.name}
              description={community.place}
              current={
                state.communityId === community.id ? 'Su comunidad' : undefined
              }
              onChoose={() => actions.selectCommunity(community.id)}
            />
          ) : (
            <ChoiceList.Unavailable
              key={community.id}
              title={community.name}
              reason={`${community.place}. Todavía sin datos.`}
            />
          ),
        )}
      </ChoiceList.Root>

      <p className={styles.footnote}>
        Por ahora solo hay recomendaciones para {snapshot.zone.name}. Las otras
        comunidades se usan para comparar tierras parecidas.
      </p>
    </div>
  )
}
