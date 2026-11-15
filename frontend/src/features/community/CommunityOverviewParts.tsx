import type { ReactNode } from 'react'

import { useLanguage } from '../../app/i18n/languageContext'
import { RiskScale } from '../../shared/components/LevelScale'
import { LlamaResting, LlamaStanding, Plant } from '../../shared/sprites/Sprites'
import {
  confidenceText,
  riskExplanation,
  rotationText,
  twinCaution,
} from '../insight/insightText'
import { ChoiceList, SectorMap } from '../picker'
import { ListenButton } from '../speech/ListenButton'
import { ZoneWeather } from '../zone/ZoneWeather'
import {
  CommunityContext,
  useCommunity,
  type CommunityContextValue,
} from './communityContext'
import {
  groupByAction,
  groupByRisk,
  groupTwins,
  lowestConfidence,
  sectorsPhrase,
  spokenCommunitySummary,
  twinGroupText,
} from './communityText'
import styles from './CommunityOverview.module.css'

export function CommunityProvider({
  children,
  ...value
}: CommunityContextValue & { children: ReactNode }) {
  return <CommunityContext value={value}>{children}</CommunityContext>
}

export function CommunityHeading() {
  const { snapshot } = useCommunity()
  const { t } = useLanguage()

  return (
    <header className={styles.heading}>
      <LlamaStanding size={4} />
      <div>
        <h1>{snapshot.zone.name}</h1>
        <p className={styles.lead}>
          {t.sectorsLead(snapshot.sectors.length)}
        </p>
      </div>
    </header>
  )
}

const actionPictures = {
  open: <Plant size={2.4} />,
  extend_rest: <LlamaResting size={3} />,
  keep_cultivating: <Plant size={2.4} />,
  start_rest: <LlamaResting size={3} />,
} as const

/** Qué conviene hacer con cada sector, agrupado por la acción recomendada. */
export function CommunityActions() {
  const { snapshot, onOpenSector } = useCommunity()
  const { t, tr } = useLanguage()

  return (
    <section aria-labelledby="conviene-titulo" className={styles.actionsSection}>
      <h2 id="conviene-titulo" className={styles.sectionTitle}>
        {t.whatToDoThisYear}
      </h2>
      {groupByAction(snapshot.sectors).map((group) => (
        <div key={group.action} className={styles.group}>
          <h3 className={styles.groupTitle}>
            {actionPictures[group.action]}
            <span>
              {tr(group.title)}
              <span className={styles.count}>
                {group.sectors.length === 1
                  ? t.oneSector
                  : t.manySectors(group.sectors.length)}
              </span>
            </span>
          </h3>
          <ChoiceList.Root label={tr(group.title)}>
            {group.sectors.map((sector) => (
              <ChoiceList.Available
                key={sector.id}
                title={sector.name}
                description={tr(
                  `${rotationText(sector)}. Confianza ${sector.recommendation.confidence_label}.`,
                )}
                onChoose={() => onOpenSector(sector.id)}
              />
            ))}
          </ChoiceList.Root>
        </div>
      ))}
    </section>
  )
}

/** Dibujo de los sectores; tocar uno abre su detalle. */
export function CommunityMap() {
  const { snapshot, onOpenSector } = useCommunity()
  const { t } = useLanguage()

  return (
    <section aria-labelledby="dibujo-titulo">
      <h2 id="dibujo-titulo" className={styles.subHeading}>
        {t.mapTitle}
      </h2>
      <p className={styles.hint}>{t.mapHint}</p>
      <SectorMap
        sectors={snapshot.sectors}
        selectedSectorId={null}
        onChoose={onOpenSector}
      />
    </section>
  )
}

/** Riesgo de sequía: cuántos sectores hay en cada nivel. */
export function CommunityRisk() {
  const { snapshot } = useCommunity()
  const { t, tr } = useLanguage()
  const confidence = lowestConfidence(
    snapshot.sectors.map((sector) => sector.risk.confidence_label),
  )

  return (
    <section aria-labelledby="riesgo-comunidad-titulo">
      <h2 id="riesgo-comunidad-titulo" className={styles.subHeading}>
        {t.riskWeatherTitle}
      </h2>
      <p className={styles.hint}>{tr(riskExplanation(snapshot.scenario))}</p>
      <ul className={styles.levels}>
        {groupByRisk(snapshot.sectors).map((group) => (
          <li key={group.level} className={styles.levelRow}>
            <RiskScale level={group.level} />
            <span>
              <strong>{tr(group.title)}:</strong> {sectorsPhrase(group.sectors)}.
            </span>
          </li>
        ))}
      </ul>
      {confidence ? (
        <p className={styles.confidence}>
          <strong>{t.howSure}</strong> {tr(confidenceText(confidence))}
        </p>
      ) : null}
    </section>
  )
}

/** Qué pasó en las tierras gemelas. Precedente, no garantía. */
export function CommunityTwins() {
  const { snapshot } = useCommunity()
  const { t, tr } = useLanguage()
  const groups = groupTwins(snapshot.sectors)

  return (
    <section aria-labelledby="gemelas-titulo">
      <h2 id="gemelas-titulo" className={styles.subHeading}>
        {t.twinsTitle}
      </h2>
      {groups.length === 0 ? (
        <p className={styles.empty}>
          {snapshot.scenario === 'normal'
            ? 'En la comparación con un año normal no hay precedentes de tierras gemelas. Vuelva a "Hoy, con El Niño" para verlos.'
            : 'Todavía no hay precedentes de tierras gemelas.'}
        </p>
      ) : (
        <ul className={styles.twins}>
          {groups.map((group) => (
            <li key={group.key} className={styles.twinCard}>
              <h3 className={styles.twinName}>{group.zone}</h3>
              <p>{tr(twinGroupText(group))}</p>
              {group.confidence ? (
                <p className={styles.note}>
                  {tr(`Confianza ${group.confidence}`)}
                  {group.isSimulated ? ' · Límites simulados' : ''}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {groups.length > 0 ? (
        <p className={styles.caution}>{tr(twinCaution)}</p>
      ) : null}
    </section>
  )
}

export function CommunityWeather() {
  const { snapshot } = useCommunity()

  return <ZoneWeather zone={snapshot.zone} />
}

/** Botón que lee el resumen de la comunidad en voz alta. */
export function CommunityListen() {
  const { snapshot } = useCommunity()
  const { t } = useLanguage()

  return (
    <ListenButton
      id={`comunidad-${snapshot.zone.id}-${snapshot.scenario}`}
      text={spokenCommunitySummary(
        snapshot.zone.name,
        snapshot.sectors,
        snapshot.scenario,
      )}
      label={t.listenSummary}
    />
  )
}
