import { Link, Navigate } from 'react-router-dom'

import { useAppState } from '../app/providers/appStateContext'
import { writeUrlState } from '../app/state/urlState'
import { CommunityOverview } from '../features/community'
import { useSectorSnapshot } from '../features/data/useSectorSnapshot'
import { ScenarioSwitch } from '../features/scenario/ScenarioSwitch'
import { Provenance } from '../features/zone/Provenance'
import { PrimaryLink, SecondaryButton } from '../shared/components/Actions'
import { LoadError } from '../shared/components/LoadError'
import { RouteLoading } from '../shared/components/RouteLoading'
import { AguayoDivider, PlainDivider } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

/** Pantalla principal: el resumen de toda la comunidad y sus tierras gemelas. */
export function CommunityHomeRoute() {
  const { state, actions } = useAppState()
  const { status, snapshot } = useSectorSnapshot(state.scenario)

  if (!state.communityId) {
    return <Navigate replace to="/comunidad" />
  }

  if (!snapshot) {
    return status === 'error' ? <LoadError /> : <RouteLoading />
  }

  const search = writeUrlState({
    selectedSectorId: null,
    scenario: snapshot.scenario,
  })

  return (
    <CommunityOverview.Provider
      snapshot={snapshot}
      onOpenSector={actions.openSector}
    >
      <article className={styles.page}>
        <p className={`${styles.place} no-imprimir`}>
          <Link to="/comunidad">Cambiar comunidad</Link>
        </p>

        <CommunityOverview.Heading />
        <ScenarioSwitch />
        <CommunityOverview.Actions />
        <CommunityOverview.Listen />

        <div className="no-imprimir">
          <PrimaryLink to={{ pathname: '/preguntar', search }}>
            Preguntar a la llamita
          </PrimaryLink>
        </div>

        <AguayoDivider />
        <CommunityOverview.Twins />
        <PlainDivider />
        <CommunityOverview.Risk />
        <PlainDivider />
        <CommunityOverview.Map />
        <PlainDivider />
        <CommunityOverview.Weather />
        <AguayoDivider />
        <Provenance provenance={snapshot.provenance} />

        <div className="no-imprimir">
          <SecondaryButton onClick={() => window.print()}>
            Imprimir para la asamblea
          </SecondaryButton>
        </div>
      </article>
    </CommunityOverview.Provider>
  )
}
