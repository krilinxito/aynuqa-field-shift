import { Link, Navigate, useLocation } from 'react-router-dom'

import { getPersistentSearch } from '../app/navigation/persistentSearch'
import { useAppState } from '../app/providers/appStateContext'
import { writeUrlState } from '../app/state/urlState'
import { useSelectedSector } from '../features/data/useSelectedSector'
import { SectorInsight } from '../features/insight'
import { ScenarioSwitch } from '../features/scenario/ScenarioSwitch'
import { PrimaryLink, SecondaryButton } from '../shared/components/Actions'
import { LoadError } from '../shared/components/LoadError'
import { RouteLoading } from '../shared/components/RouteLoading'
import { AguayoDivider, PlainDivider } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

/** Detalle de un sector: se llega tocándolo en el resumen de la comunidad. */
export function SectorDetailRoute() {
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
    return (
      <Navigate replace to={state.communityId ? '/mi-comunidad' : '/comunidad'} />
    )
  }

  const { sector, snapshot } = selected
  const search = getPersistentSearch(location.search)
  const communitySearch = writeUrlState({
    selectedSectorId: null,
    scenario: snapshot.scenario,
  })

  return (
    <SectorInsight.Provider
      sector={sector}
      zone={snapshot.zone}
      scenario={snapshot.scenario}
      provenance={snapshot.provenance}
    >
      <article className={styles.page}>
        <p className={`${styles.place} no-imprimir`}>
          <Link to={{ pathname: '/mi-comunidad', search: communitySearch }}>
            ← Volver a {snapshot.zone.name}
          </Link>
        </p>
        <p className={styles.printOnly}>{snapshot.zone.name}</p>

        <SectorInsight.Heading />
        <ScenarioSwitch />
        <SectorInsight.Recommendation />
        <SectorInsight.Listen />

        <div className="no-imprimir">
          <PrimaryLink to={{ pathname: '/preguntar', search }}>
            Preguntar sobre este sector
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
