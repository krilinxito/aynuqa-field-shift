import { useSyncExternalStore } from 'react'

import type { MLCEngineInterface } from '@mlc-ai/web-llm'

/**
 * IA opcional que corre dentro del celular (WebLLM + WebGPU). Solo se ofrece
 * si el navegador tiene WebGPU, y solo se descarga si la persona lo pide
 * (~400 MB, una vez). Redacta en español la respuesta de las plantillas; si
 * su texto trae algún número que no estaba en los datos, se descarta.
 */
export const LOCAL_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'

export type LocalModelStatus = 'unsupported' | 'absent' | 'downloading' | 'ready' | 'error'

interface LocalModelState {
  status: LocalModelStatus
  /** 0 a 1 mientras descarga. */
  progress: number
}

let state: LocalModelState = {
  status: isLocalAiSupported() ? 'absent' : 'unsupported',
  progress: 0,
}
let engine: MLCEngineInterface | null = null
let loading: Promise<MLCEngineInterface> | null = null
const listeners = new Set<() => void>()

function setState(next: Partial<LocalModelState>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

export function isLocalAiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

/** Al abrir la app: ¿ya estaba descargada? */
export async function checkLocalModel(): Promise<void> {
  if (state.status !== 'absent') return
  try {
    const { hasModelInCache } = await import('@mlc-ai/web-llm')
    if (await hasModelInCache(LOCAL_MODEL_ID)) setState({ status: 'ready', progress: 1 })
  } catch {
    // Sin caché accesible: queda como no descargada.
  }
}

async function loadEngine(): Promise<MLCEngineInterface> {
  if (engine) return engine
  loading ??= import('@mlc-ai/web-llm').then(({ CreateMLCEngine }) =>
    CreateMLCEngine(LOCAL_MODEL_ID, {
      initProgressCallback: (report) => {
        if (state.status === 'downloading') setState({ progress: report.progress })
      },
    }),
  )
  try {
    engine = await loading
    return engine
  } finally {
    loading = null
  }
}

/** Descarga (y deja lista) la IA local. Necesita señal una sola vez. */
export async function downloadLocalModel(): Promise<void> {
  if (state.status === 'unsupported' || state.status === 'downloading') return
  setState({ status: 'downloading', progress: 0 })
  try {
    await loadEngine()
    setState({ status: 'ready', progress: 1 })
  } catch {
    setState({ status: 'error' })
  }
}

function numbersIn(text: string): string[] {
  return text.match(/\d+(?:[.,]\d+)?/g) ?? []
}

/** Solo acepta el texto si no agrega números ni pierde el "no es seguro". */
export function isFaithful(draft: string, source: string): boolean {
  const allowed = new Set(numbersIn(source))
  if (!numbersIn(draft).every((n) => allowed.has(n))) return false
  if (/probabilidad/i.test(source) && !/probabilidad/i.test(draft)) return false
  return draft.trim().length > 0 && draft.length < 600
}

/**
 * Redacta la respuesta de la plantilla en un tono más natural. Devuelve
 * `null` si la IA no está lista o si su texto no es fiel a los datos.
 */
export async function rephraseWithLocalModel(
  question: string,
  templateAnswer: string,
): Promise<string | null> {
  if (state.status !== 'ready') return null
  try {
    const ai = await loadEngine()
    const reply = await ai.chat.completions.create({
      temperature: 0.2,
      max_tokens: 140,
      messages: [
        {
          role: 'system',
          content:
            'Eres la llamita de una comunidad del altiplano. Responde en español muy simple, ' +
            'en dos o tres frases, usando SOLO los datos que te dan. No agregues números, ' +
            'cultivos ni fechas que no estén en los datos. Si los datos dicen "aumenta la ' +
            'probabilidad", mantenlo: nunca digas que algo es seguro.',
        },
        {
          role: 'user',
          content: `Pregunta: ${question}\nDatos: ${templateAnswer}`,
        },
      ],
    })
    const draft = reply.choices[0]?.message.content?.trim() ?? ''
    return isFaithful(draft, templateAnswer) ? draft : null
  } catch {
    return null
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useLocalModel(): LocalModelState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  )
}
