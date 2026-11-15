import { Link, Navigate, useLocation } from 'react-router-dom'

import { getPersistentSearch } from '../app/navigation/persistentSearch'
import { useAppState } from '../app/providers/appStateContext'
import { useSelectedSector } from '../features/data/useSelectedSector'
import { SectorInsight } from '../features/insight'
import { ScenarioSwitch } from '../features/scenario/ScenarioSwitch'
import { PrimaryLink, SecondaryButton } from '../shared/components/Actions'
import { LoadError } from '../shared/components/LoadError'
import { RouteLoading } from '../shared/components/RouteLoading'
import { AguayoDivider, PlainDivider } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

/** Pantalla principal: el consejo para el sector elegido. */
export function MySectorRoute() {
  const location = useLocation()
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
  const search = getPersistentSearch(location.search)

  return (
    <SectorInsight.Provider
      sector={sector}
      zone={snapshot.zone}
      scenario={snapshot.scenario}
      provenance={snapshot.provenance}
    >
      <article className={styles.page}>
        <p className={styles.place}>
          {snapshot.zone.name}
          <span className="no-imprimir">
            {' · '}
            <Link to={{ pathname: '/sector', search }}>Cambiar sector</Link>
          </span>
        </p>

        <SectorInsight.Heading />
        <ScenarioSwitch />
        <SectorInsight.Recommendation />
        <SectorInsight.Listen />

        <div className="no-imprimir">
          <PrimaryLink to={{ pathname: '/preguntar', search }}>
            Preguntar a la llamita
          </PrimaryLink>
        </div>

        <AguayoDivider />
        <SectorInsight.Reasons />
        <PlainDivider />
        <SectorInsight.Risk />
        <PlainDivider />
        <SectorInsight.Recovery />
        {sector.twinPrecedent ? <PlainDivider /> : null}
        <SectorInsight.Twin />
        <PlainDivider />
        <SectorInsight.ZoneWeather />
        <AguayoDivider />
        <SectorInsight.Provenance />

        <div className="no-imprimir">
          <SecondaryButton onClick={() => window.print()}>
            Imprimir para la asamblea
          </SecondaryButton>
        </div>
      </article>
    </SectorInsight.Provider>
  )
}
