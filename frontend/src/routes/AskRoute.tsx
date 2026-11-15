import { useLanguage } from '../app/i18n/languageContext'
import { useAppState } from '../app/providers/appStateContext'
import { Chat } from '../features/chat'
import { useSectorSnapshot } from '../features/data/useSectorSnapshot'
import { sectorNumber } from '../features/insight/insightText'
import { LoadError } from '../shared/components/LoadError'
import { RouteLoading } from '../shared/components/RouteLoading'
import { LlamaStanding } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

/**
 * Pantalla del asistente: preguntar con un toque, hablando o escribiendo.
 * Soporta Español, Aymara y Quechua con traducción BERT y voz clara.
 */
export function AskRoute() {
  const { state } = useAppState()
  const { t } = useLanguage()
  const { status, snapshot } = useSectorSnapshot(state.scenario)

  if (!snapshot) {
    return status === 'error' ? <LoadError /> : <RouteLoading />
  }

  const sector =
    snapshot.sectors.find(
      (candidate) => candidate.id === state.selectedSectorId,
    ) ?? null
  const aboutText = sector
    ? t.answersAboutSector(sector.name.toLowerCase(), snapshot.zone.name)
    : t.answersAboutCommunity(snapshot.zone.name)

  return (
    <Chat.Provider
      key={`${sector?.id ?? 'comunidad'}-${snapshot.scenario}`}
      sectorId={sector?.id ?? null}
      sectorNumber={sector ? sectorNumber(sector) : null}
      scenario={snapshot.scenario}
    >
      <div className={styles.page}>
        <header className={styles.welcome}>
          <LlamaStanding size={4.5} />
          <div>
            <h1>{t.askLlamaTitle}</h1>
            <p>
              {aboutText}
              {snapshot.scenario === 'normal' ? t.comparingNormal : ''}.
            </p>
          </div>
        </header>

        <Chat.OfflineNotice />
        <Chat.Messages />
        <Chat.Suggestions />
        <Chat.Composer>
          <Chat.DictateButton />
        </Chat.Composer>

        <p className={styles.footnote}>{t.chatFootnote}</p>
      </div>
    </Chat.Provider>
  )
}
