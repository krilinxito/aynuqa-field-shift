import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { useLocation } from 'react-router-dom'

import { useLanguage } from '../../app/i18n/languageContext'
import { usePreferences } from '../../app/preferences/preferencesContext'
import { useAppState } from '../../app/providers/appStateContext'
import { useOnline } from '../../shared/hooks/useOnline'
import { PixelSprite } from '../../shared/sprites/PixelSprite'
import {
  llamaHappyRows,
  llamaInsistentRows,
  llamaSleepingRows,
  llamaStandingRows,
  llamaTalkingRows,
  llamaThinkingRows,
  llamaWorriedRows,
} from '../../shared/sprites/spriteRows'
import { useSectorSnapshot } from '../data/useSectorSnapshot'
import { DECISION_SAVED_EVENT, useDecisions } from '../decisions/useDecisions'
import { sectorNumber } from '../insight/insightText'
import { useSpeech } from '../speech/speechContext'
import {
  nextLine,
  type MascotContext,
  type MascotLine,
  type MascotMood,
} from './mascotLines'
import { mascotSignals, useMascotSignals } from './mascotSignals'
import { saveVisitForReminders } from './reminders'
import {
  readVisitRecord,
  todayInBolivia,
  updateVisit,
  writeVisitRecord,
  type VisitInfo,
} from './visitTracker'
import styles from './Mascot.module.css'

/** Espera entre frases que la llamita dice sola, para no cansar. */
const PROACTIVE_GAP_MS = 25_000
const BUBBLE_MS = 9_000
const CELEBRATION_MS = 2_600

const MOOD_ROWS: Record<MascotMood, readonly string[]> = {
  idle: llamaStandingRows,
  happy: llamaHappyRows,
  celebrate: llamaHappyRows,
  thinking: llamaThinkingRows,
  worried: llamaWorriedRows,
  insistent: llamaInsistentRows,
  sleeping: llamaSleepingRows,
}

function registerVisit(): VisitInfo {
  const { record, info } = updateVisit(readVisitRecord(), todayInBolivia())
  writeVisitRecord(record)
  return info
}

/**
 * La llamita que acompaña: habla sola de vez en cuando (saludo, racha,
 * riesgo, decisiones pendientes), celebra y se duerme sin señal. Nunca tapa
 * la pantalla: el globo se cierra con ✕ o solo.
 */
export function Mascot() {
  const { lang, t } = useLanguage()
  const { preferences } = usePreferences()
  const isOnline = useOnline()
  const location = useLocation()
  const { state, actions } = useAppState()
  const { snapshot } = useSectorSnapshot(state.scenario)
  const communityId = state.communityId ?? snapshot?.zone.id ?? null
  const { decisions } = useDecisions(communityId)
  const speech = useSpeech()
  const signals = useMascotSignals()

  const [visit] = useState(registerVisit)

  // El service worker lee la última visita para los avisos con la app cerrada.
  useEffect(() => {
    void saveVisitForReminders(todayInBolivia(), preferences.mascotNotify)
  }, [preferences.mascotNotify])
  const [line, setLine] = useState<MascotLine | null>(null)
  const [greeted, setGreeted] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const saidRef = useRef(new Set<string>())
  const lastShownRef = useRef(0)
  // Semilla estable por visita para variar las frases sin azar en el render.
  const seedRef = useRef(visit.streak * 7 + visit.daysAway)

  const context = useMemo<MascotContext>(() => {
    const decided = new Set(decisions.map((d) => d.sector_id))
    const sectors = (snapshot?.sectors ?? []).map((sector) => ({
      id: sector.id,
      number: sectorNumber(sector),
      riskLevel: sector.risk.level,
    }))
    return {
      lang,
      isOnline,
      scenario: state.scenario,
      streak: visit.streak,
      daysAway: visit.daysAway,
      firstTime: visit.firstTime,
      greeted,
      justCelebrated: celebrating,
      advanced: preferences.advanced,
      sectors,
      undecidedSectorIds: sectors.filter((s) => !decided.has(s.id)).map((s) => s.id),
    }
  }, [
    celebrating,
    decisions,
    greeted,
    isOnline,
    lang,
    preferences.advanced,
    snapshot,
    state.scenario,
    visit,
  ])

  const say = useCallback(
    (next: MascotLine | null) => {
      if (!next) return
      saidRef.current.add(next.id)
      lastShownRef.current = Date.now()
      seedRef.current += 1
      setLine(next)
      if (next.id.startsWith('saludo') || next.id === 'racha' || next.id === 'te-extrane') {
        setGreeted(true)
      }
      if (preferences.mascotAutoSpeak) {
        speech.actions.speak('mascota', next.text)
      }
    },
    [preferences.mascotAutoSpeak, speech.actions],
  )

  // Habla sola al abrir y al cambiar de pantalla, con pausa entre frases.
  const contextRef = useRef(context)
  useEffect(() => {
    contextRef.current = context
  }, [context])

  useEffect(() => {
    if (!preferences.mascotTalkative || !snapshot) return
    const timer = window.setTimeout(() => {
      if (Date.now() - lastShownRef.current < PROACTIVE_GAP_MS) return
      say(nextLine(contextRef.current, saidRef.current, seedRef.current))
    }, 1_500)
    return () => window.clearTimeout(timer)
  }, [location.pathname, preferences.mascotTalkative, say, snapshot])

  // Sin señal se duerme y lo dice una vez.
  useEffect(() => {
    if (isOnline || !preferences.mascotTalkative) return
    const timer = window.setTimeout(() => {
      say(nextLine({ ...contextRef.current, isOnline: false }, saidRef.current))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [isOnline, preferences.mascotTalkative, say])

  // Celebra cuando se guarda una decisión.
  useEffect(() => {
    const handle = () => mascotSignals.celebrate()
    window.addEventListener(DECISION_SAVED_EVENT, handle)
    return () => window.removeEventListener(DECISION_SAVED_EVENT, handle)
  }, [])

  useEffect(() => {
    if (!signals.celebrateAt) return
    const start = window.setTimeout(() => {
      setCelebrating(true)
      if (preferences.mascotTalkative) {
        say(
          nextLine(
            { ...contextRef.current, justCelebrated: true, isOnline: true },
            new Set(),
            seedRef.current,
          ),
        )
      }
    }, 0)
    const end = window.setTimeout(() => setCelebrating(false), CELEBRATION_MS)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(end)
    }
  }, [preferences.mascotTalkative, say, signals.celebrateAt])

  // El globo se va solo, salvo mientras lo está leyendo en voz alta.
  const isSpeakingLine = speech.state.speakingId === 'mascota'
  useEffect(() => {
    if (!line || isSpeakingLine) return
    const timer = window.setTimeout(() => setLine(null), BUBBLE_MS)
    return () => window.clearTimeout(timer)
  }, [isSpeakingLine, line])

  function handleTap() {
    const next =
      nextLine(context, saidRef.current, seedRef.current) ??
      (() => {
        // Ya dijo todo: vuelve a empezar con los consejos.
        saidRef.current = new Set([...saidRef.current].filter((id) => !id.startsWith('consejo')))
        return nextLine(context, saidRef.current, seedRef.current)
      })()
    say(next)
  }

  const mood: MascotMood = signals.thinking
    ? 'thinking'
    : celebrating
      ? 'celebrate'
      : !isOnline
        ? 'sleeping'
        : (line?.mood ?? 'idle')
  const isTalking = speech.state.speakingId !== null && mood !== 'sleeping'

  return (
    <aside className={`${styles.mascot} no-imprimir`} aria-label={t.mascotLabel}>
      {line ? (
        <div className={styles.bubble} role="status" data-mood={line.mood}>
          <p className={styles.text}>{line.text}</p>
          <div className={styles.bubbleActions}>
            {line.sectorId && line.actionLabel ? (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  if (line.sectorId) actions.openSector(line.sectorId)
                  setLine(null)
                }}
              >
                {line.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              className={styles.listen}
              onClick={() =>
                isSpeakingLine
                  ? speech.actions.stop()
                  : speech.actions.speak('mascota', line.text)
              }
            >
              {isSpeakingLine ? t.stopListening : t.listen}
            </button>
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label={t.mascotClose}
            onClick={() => {
              if (isSpeakingLine) speech.actions.stop()
              setLine(null)
            }}
          >
            ✕
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={styles.llamaButton}
        data-mood={mood}
        aria-label={t.mascotTap}
        onClick={handleTap}
      >
        {mood === 'celebrate' ? (
          <span className={styles.confetti} aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} style={{ '--i': i } as CSSProperties} />
            ))}
          </span>
        ) : null}
        {mood === 'thinking' ? (
          <span className={styles.think} aria-hidden="true">
            ?
          </span>
        ) : null}
        {mood === 'sleeping' ? (
          <span className={styles.zzz} aria-hidden="true">
            z<span>Z</span>
          </span>
        ) : null}
        <span className={isTalking ? styles.talking : styles.frames}>
          <PixelSprite rows={MOOD_ROWS[mood]} size={3.4} className={styles.frameA} />
          {isTalking ? (
            <PixelSprite rows={llamaTalkingRows} size={3.4} className={styles.frameB} />
          ) : null}
        </span>
      </button>
    </aside>
  )
}
