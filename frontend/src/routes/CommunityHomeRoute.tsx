import { Link } from 'react-router-dom'

import { useLanguage } from '../app/i18n/languageContext'
import { useAppState } from '../app/providers/appStateContext'
import { writeUrlState } from '../app/state/urlState'
import { CommunityOverview } from '../features/community'
import { useSectorSnapshot } from '../features/data/useSectorSnapshot'
import { ScenarioSwitch } from '../features/scenario/ScenarioSwitch'
import { Provenance } from '../features/zone/Provenance'
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

/** Pantalla principal: el resumen de toda la comunidad dosificado paso a paso. */
export function CommunityHomeRoute() {
  const { state, actions } = useAppState()
  const { t } = useLanguage()
  const { status, snapshot } = useSectorSnapshot(state.scenario)

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
          <Link to="/comunidad">{t.changeCommunity}</Link>
        </p>

        <CommunityOverview.Heading />
        <ScenarioSwitch />
        <CommunityOverview.Listen />
        <CommunityOverview.Actions />

        <div className="no-imprimir">
          <PrimaryLink to={{ pathname: '/preguntar', search }}>
            {t.askLlama}
          </PrimaryLink>
        </div>

        <AguayoDivider />

        <div className={styles.doses}>
          <p className={styles.dosesTitle}>{t.moreDetailsStepByStep}</p>

          <DoseSection
            title={t.mapTitle}
            subtitle={t.mapSub}
            icon={<Plant size={2.2} />}
            defaultOpen
          >
            <CommunityOverview.Map />
          </DoseSection>

          <DoseSection
            title={t.riskWeatherTitle}
            subtitle={t.riskWeatherSub}
            icon={<Cloud size={2.4} />}
            defaultOpen
          >
            <CommunityOverview.Risk />
            <PlainDivider />
            <CommunityOverview.Weather />
          </DoseSection>

          <DoseSection
            title={t.twinsTitle}
            subtitle={t.twinsSub}
            icon={<LlamaResting size={2.4} />}
          >
            <CommunityOverview.Twins />
          </DoseSection>
        </div>

        <Provenance provenance={snapshot.provenance} />

        <div className="no-imprimir">
          <SecondaryButton onClick={() => window.print()}>
            {t.printAssembly}
          </SecondaryButton>
        </div>
      </article>
    </CommunityOverview.Provider>
  )
}
