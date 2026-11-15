import type { ReactNode } from 'react'

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

/*
 * Piezas del resumen de una comunidad. Todas leen la misma foto de la
 * comunidad (zona + sectores) desde el contexto.
 */

export function CommunityProvider({
  children,
  ...value
}: CommunityContextValue & { children: ReactNode }) {
  return <CommunityContext value={value}>{children}</CommunityContext>
}

export function CommunityHeading() {
  const { snapshot } = useCommunity()

  return (
    <header className={styles.heading}>
      <LlamaStanding size={4.5} />
      <div>
        <h1>{snapshot.zone.name}</h1>
        <p className={styles.lead}>
          {snapshot.sectors.length} sectores de la comunidad
        </p>
      </div>
    </header>
  )
}

const actionPictures = {
  open: <Plant size={2.6} />,
  extend_rest: <LlamaResting size={3.4} />,
  keep_cultivating: <Plant size={2.6} />,
  start_rest: <LlamaResting size={3.4} />,
} as const

/** Qué conviene hacer con cada sector, agrupado por la acción recomendada. */
export function CommunityActions() {
  const { snapshot, onOpenSector } = useCommunity()

  return (
    <section aria-labelledby="conviene-titulo">
      <h2 id="conviene-titulo" className={styles.sectionTitle}>
        Qué conviene este año
      </h2>
      <p className={styles.hint}>Toque un sector para ver por qué.</p>
      {groupByAction(snapshot.sectors).map((group) => (
        <div key={group.action} className={styles.group}>
          <h3 className={styles.groupTitle}>
            {actionPictures[group.action]}
            <span>
              {group.title}
              <span className={styles.count}>
                {group.sectors.length === 1
                  ? '1 sector'
                  : `${group.sectors.length} sectores`}
              </span>
            </span>
          </h3>
          <ChoiceList.Root label={group.title}>
            {group.sectors.map((sector) => (
              <ChoiceList.Available
                key={sector.id}
                title={sector.name}
                description={`${rotationText(sector)}. Confianza ${sector.recommendation.confidence_label}.`}
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

  return (
    <section aria-labelledby="dibujo-titulo">
      <h2 id="dibujo-titulo">Dibujo de los sectores</h2>
      <SectorMap
        sectors={snapshot.sectors}
        selectedSectorId={null}
        onChoose={onOpenSector}
      />
    </section>
  )
}

/** Riesgo de sequía: cuántos sectores hay en cada nivel. No inventa un puntaje de zona. */
export function CommunityRisk() {
  const { snapshot } = useCommunity()
  const confidence = lowestConfidence(
    snapshot.sectors.map((sector) => sector.risk.confidence_label),
  )

  return (
    <section aria-labelledby="riesgo-comunidad-titulo">
      <h2 id="riesgo-comunidad-titulo">Riesgo de sequía en la comunidad</h2>
      <p>{riskExplanation(snapshot.scenario)}</p>
      <ul className={styles.levels}>
        {groupByRisk(snapshot.sectors).map((group) => (
          <li key={group.level} className={styles.levelRow}>
            <RiskScale level={group.level} />
            <span>
              <strong>{group.title}:</strong> {sectorsPhrase(group.sectors)}.
            </span>
          </li>
        ))}
      </ul>
      {confidence ? (
        <p className={styles.confidence}>
          <strong>Qué tan seguros estamos:</strong> {confidenceText(confidence)}
        </p>
      ) : null}
    </section>
  )
}

/** Qué pasó en las tierras gemelas. Precedente, no garantía. */
export function CommunityTwins() {
  const { snapshot } = useCommunity()
  const groups = groupTwins(snapshot.sectors)

  return (
    <section aria-labelledby="gemelas-titulo">
      <h2 id="gemelas-titulo">Tierras gemelas</h2>
      <p>
        Son tierras de otras comunidades del altiplano que se parecen a las de{' '}
        {snapshot.zone.name}: altura y clima parecidos.
      </p>
      {groups.length === 0 ? (
        <p className={styles.empty}>
          {snapshot.scenario === 'normal'
            ? 'En la comparación con un año normal no hay precedentes de tierras gemelas. Vuelva a "Hoy, con El Niño" para verlos.'
            : 'Todavía no hay precedentes de tierras gemelas.'}
        </p>
      ) : (
        <ul className={styles.twins}>
          {groups.map((group) => (
            <li key={group.key}>
              <h3 className={styles.twinName}>{group.zone}</h3>
              <p>{twinGroupText(group)}</p>
              {group.confidence ? (
                <p className={styles.confidence}>
                  <strong>Qué tan seguros estamos:</strong>{' '}
                  {confidenceText(group.confidence)}
                </p>
              ) : null}
              {group.isSimulated ? (
                <p className={styles.note}>
                  Los límites de esa tierra son simulados.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {groups.length > 0 ? <p className={styles.caution}>{twinCaution}</p> : null}
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

  return (
    <ListenButton
      id={`comunidad-${snapshot.zone.id}-${snapshot.scenario}`}
      text={spokenCommunitySummary(
        snapshot.zone.name,
        snapshot.sectors,
        snapshot.scenario,
      )}
      label="Escuchar el resumen"
    />
  )
}
