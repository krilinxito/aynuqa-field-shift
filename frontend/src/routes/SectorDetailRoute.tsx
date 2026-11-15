import { Link, Navigate, useLocation } from 'react-router-dom'

import { useLanguage } from '../app/i18n/languageContext'
import { getPersistentSearch } from '../app/navigation/persistentSearch'
import { useAppState } from '../app/providers/appStateContext'
import { writeUrlState } from '../app/state/urlState'
import { useSelectedSector } from '../features/data/useSelectedSector'
import { DecisionPanel } from '../features/decisions/DecisionPanel'
import { SectorInsight } from '../features/insight'
import { ScenarioSwitch } from '../features/scenario/ScenarioSwitch'
import { PrimaryLink, SecondaryButton } from '../shared/components/Actions'
import { DoseSection } from '../shared/components/DoseSection'
import { LoadError } from '../shared/components/LoadError'
import { RouteLoading } from '../shared/components/RouteLoading'
import {
  AguayoDivider,
  Cloud,
  LlamaResting,
  PlainDivider,
  Plant,
} from '../shared/sprites/Sprites'
import styles from './routes.module.css'

/** Detalle de un sector: muestra primero el consejo y dosifica el resto. */
export function SectorDetailRoute() {
  const location = useLocation()
  const { t } = useLanguage()
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
      <Navigate replace to="/mi-comunidad" />
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
            {t.backTo(snapshot.zone.name)}
          </Link>
        </p>
        <p className={styles.printOnly}>{snapshot.zone.name}</p>

        <SectorInsight.Heading />
        <ScenarioSwitch />
        <SectorInsight.Recommendation />
        <SectorInsight.Listen />

        <div className="no-imprimir">
          <PrimaryLink to={{ pathname: '/preguntar', search }}>
            {t.askAboutSector}
          </PrimaryLink>
        </div>

        <div className="no-imprimir">
          <DecisionPanel
            communityId={state.communityId ?? snapshot.zone.id}
            sector={sector}
            scenario={snapshot.scenario}
          />
        </div>

        <AguayoDivider />

        <div className={styles.doses}>
          <p className={styles.dosesTitle}>{t.explanationStepByStep}</p>

          <DoseSection
            title={t.whyAdviceTitle}
            subtitle={t.whyAdviceSub}
            icon={<Plant size={2.2} />}
          >
            <SectorInsight.Reasons />
            <PlainDivider />
            <SectorInsight.Risk />
            <PlainDivider />
            <SectorInsight.Recovery />
          </DoseSection>

          {sector.twinPrecedent ? (
            <DoseSection
              title={t.twinSectionTitle}
              subtitle={t.twinSectionSub(sector.twinPrecedent.twin_zone)}
              icon={<LlamaResting size={2.4} />}
            >
              <SectorInsight.Twin />
            </DoseSection>
          ) : null}

          <DoseSection
            title={t.weatherSectionTitle}
            subtitle={t.weatherSectionSub}
            icon={<Cloud size={2.4} />}
          >
            <SectorInsight.ZoneWeather />
          </DoseSection>
        </div>

        <SectorInsight.Provenance />

        <div className="no-imprimir">
          <SecondaryButton onClick={() => window.print()}>
            {t.printAssembly}
          </SecondaryButton>
        </div>
      </article>
    </SectorInsight.Provider>
  )
}
