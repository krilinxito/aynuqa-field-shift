import { useLanguage } from '../app/i18n/languageContext'
import { useAppState } from '../app/providers/appStateContext'
import { communities } from '../domain/communities'
import { useSectorSnapshot } from '../features/data/useSectorSnapshot'
import { ChoiceList } from '../features/picker'
import { DoseSection } from '../shared/components/DoseSection'
import { LoadError } from '../shared/components/LoadError'
import { RouteLoading } from '../shared/components/RouteLoading'
import { LlamaStanding } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

/** Primera pantalla: ¿de qué comunidad es usted? */
export function CommunityRoute() {
  const { state, actions } = useAppState()
  const { t } = useLanguage()
  const { status, snapshot } = useSectorSnapshot(state.scenario)

  if (!snapshot) {
    return status === 'error' ? <LoadError /> : <RouteLoading />
  }

  const available = communities.filter(
    (community) => community.id === snapshot.zone.id,
  )
  const unavailable = communities.filter(
    (community) => community.id !== snapshot.zone.id,
  )

  return (
    <div className={styles.page}>
      <header className={styles.welcome}>
        <LlamaStanding size={4.5} />
        <div>
          <h1>{t.welcomeQuestion}</h1>
          <p>{t.welcomeTap}</p>
        </div>
      </header>

      <ChoiceList.Root label="Comunidad disponible">
        {available.map((community) => (
          <ChoiceList.Available
            key={community.id}
            title={snapshot.zone.name}
            description={community.place}
            current={
              state.communityId === community.id ? t.yourCommunity : undefined
            }
            onChoose={() => actions.selectCommunity(community.id)}
          />
        ))}
      </ChoiceList.Root>

      <DoseSection
        title={t.seeOtherCommunities}
        subtitle={t.seeOtherCommunitiesSub}
      >
        <ChoiceList.Root label="Otras comunidades">
          {unavailable.map((community) => (
            <ChoiceList.Unavailable
              key={community.id}
              title={community.name}
              reason={`${community.place}. ${t.noDataYet}`}
            />
          ))}
        </ChoiceList.Root>
      </DoseSection>
    </div>
  )
}
