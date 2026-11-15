import { useId, useState } from 'react'

import { useLanguage } from '../../app/i18n/languageContext'
import type { Decision } from '../../data/repositories/DataRepository'
import type { SectorDiagnosisViewModel } from '../../domain/presentationModels'
import { useOnline } from '../../shared/hooks/useOnline'
import { newDecisionId, useDecisions } from './useDecisions'
import styles from './DecisionPanel.module.css'

type Action = Decision['action']

/** Textos en español; `tr` los pasa a aymara o quechua. */
const ACTION_LABELS: Record<Action, string> = {
  open: 'Abrir para cultivo',
  extend_rest: 'Seguir en descanso',
  start_rest: 'Pasar a descanso después de la cosecha',
  keep_cultivating: 'Seguir cultivando',
  other: 'Otra cosa',
}

const ACTION_ORDER: readonly Action[] = [
  'open',
  'extend_rest',
  'start_rest',
  'keep_cultivating',
  'other',
]

interface DecisionPanelProps {
  communityId: string
  sector: SectorDiagnosisViewModel
  scenario: Decision['scenario']
}

/**
 * Anotar lo que decidió la asamblea. Es opcional y libre: la recomendación
 * aparece primero, pero se puede elegir cualquier otra cosa.
 */
export function DecisionPanel({ communityId, sector, scenario }: DecisionPanelProps) {
  const { t, tr } = useLanguage()
  const isOnline = useOnline()
  const noteId = useId()
  const { decisions, pendingIds, save, remove } = useDecisions(communityId, sector.id)
  const [choice, setChoice] = useState<Action | null>(null)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const recommended = sector.recommendation.action
  const ordered = [recommended, ...ACTION_ORDER.filter((a) => a !== recommended)]

  async function handleSave() {
    if (!choice) return
    setSaving(true)
    setMessage(null)
    try {
      await save({
        id: newDecisionId(),
        community_id: communityId,
        sector_id: sector.id,
        scenario,
        action: choice,
        recommended_action: recommended,
        follows_recommendation: choice === recommended,
        note: note.trim() ? note.trim().slice(0, 500) : null,
        decided_at: new Date().toISOString(),
      })
      setChoice(null)
      setNote('')
      setMessage(isOnline ? t.decisionSaved : t.decisionSavedOffline)
    } catch {
      setMessage(t.decisionSaveError)
    } finally {
      setSaving(false)
    }
  }

  const dateFormat = new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeZone: 'America/La_Paz',
  })

  return (
    <section className={styles.card} aria-labelledby="decision-titulo">
      <h2 id="decision-titulo" className={styles.title}>
        {t.decisionTitle}
      </h2>
      <p className={styles.intro}>{t.decisionIntro}</p>

      <div className={styles.options} role="group" aria-label={t.decisionTitle}>
        {ordered.map((action) => (
          <button
            key={action}
            type="button"
            className={styles.option}
            aria-pressed={choice === action}
            onClick={() => setChoice(choice === action ? null : action)}
          >
            <span>{tr(ACTION_LABELS[action])}</span>
            {action === recommended ? (
              <span className={styles.tag}>{t.decisionRecommended}</span>
            ) : null}
          </button>
        ))}
      </div>

      {choice ? (
        <div className={styles.form}>
          <label htmlFor={noteId} className={styles.label}>
            {t.decisionNoteLabel}
          </label>
          <textarea
            id={noteId}
            className={styles.note}
            rows={2}
            maxLength={500}
            value={note}
            placeholder={t.decisionNotePlaceholder}
            onChange={(event) => setNote(event.target.value)}
          />
          <button
            type="button"
            className={styles.save}
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {t.decisionSave}
          </button>
        </div>
      ) : null}

      {message ? (
        <p className={styles.message} role="status">
          {message}
        </p>
      ) : null}

      {decisions.length > 0 ? (
        <div className={styles.history}>
          <h3 className={styles.historyTitle}>{t.decisionHistory}</h3>
          <ul className={styles.list}>
            {decisions.map((decision) => {
              const pending = pendingIds.includes(decision.id)
              return (
                <li key={decision.id} className={styles.item}>
                  <p className={styles.itemAction}>
                    {tr(ACTION_LABELS[decision.action])}
                  </p>
                  <p className={styles.itemMeta}>
                    {dateFormat.format(new Date(decision.decided_at))} ·{' '}
                    {decision.follows_recommendation
                      ? t.decisionFollowed
                      : t.decisionDifferent}
                  </p>
                  {decision.note ? (
                    <p className={styles.itemNote}>«{decision.note}»</p>
                  ) : null}
                  <p className={pending ? styles.pending : styles.synced}>
                    {pending ? t.decisionPending : t.decisionSynced}
                  </p>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => void remove(decision.id)}
                  >
                    {t.decisionDelete}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
