import { act, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSpeech, type SpeechContextValue } from './speechContext'
import { SpeechProvider } from './SpeechProvider'

/** Audio falso: guarda los eventos para dispararlos a mano. */
class FakeAudio {
  static instances: FakeAudio[] = []
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  onplaying: (() => void) | null = null
  rejectPlay: (error: unknown) => void = () => {}
  paused = false
  src: string

  constructor(src: string) {
    this.src = src
    FakeAudio.instances.push(this)
  }

  play() {
    return new Promise<void>((_, reject) => {
      this.rejectPlay = reject
    })
  }

  pause() {
    this.paused = true
  }

  removeAttribute() {
    this.src = ''
  }
}

const synthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: () => [],
}

const probe: { current: SpeechContextValue | null } = { current: null }

function Probe() {
  const value = useSpeech()
  useEffect(() => {
    probe.current = value
  })
  return <p>{value.state.speakingId ?? 'silencio'}</p>
}

const speech = {
  get actions() {
    if (!probe.current) {
      throw new Error('Probe sin montar')
    }
    return probe.current.actions
  },
}

function renderProvider() {
  render(
    <SpeechProvider remoteTts>
      <Probe />
    </SpeechProvider>,
  )
}

beforeEach(() => {
  FakeAudio.instances = []
  synthesis.speak.mockClear()
  synthesis.cancel.mockClear()
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('speechSynthesis', synthesis)
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      constructor(public text: string) {}
    },
  )
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('SpeechProvider', () => {
  it('al parar no vuelve a hablar con la voz del navegador', async () => {
    renderProvider()

    act(() => speech.actions.speak('a', 'Hola'))
    expect(screen.getByText('a')).toBeInTheDocument()
    const audio = FakeAudio.instances[0]

    vi.advanceTimersByTime(500)
    act(() => speech.actions.stop())

    // Eventos viejos que antes arrancaban la voz robótica:
    await act(async () => {
      audio.rejectPlay(new DOMException('aborted', 'AbortError'))
      await Promise.resolve()
    })
    expect(audio.onerror).toBeNull()

    expect(synthesis.speak).not.toHaveBeenCalled()
    expect(screen.getByText('silencio')).toBeInTheDocument()
  })

  it('ignora el segundo toque demasiado seguido', () => {
    renderProvider()

    act(() => speech.actions.speak('a', 'Hola'))
    vi.advanceTimersByTime(100)
    act(() => speech.actions.stop())

    expect(screen.getByText('a')).toBeInTheDocument()
    expect(FakeAudio.instances).toHaveLength(1)
  })

  it('si el audio del servidor falla, usa la voz del navegador una sola vez', async () => {
    renderProvider()

    act(() => speech.actions.speak('a', 'Hola'))
    const audio = FakeAudio.instances[0]
    const onerror = audio.onerror!

    await act(async () => {
      onerror()
      audio.rejectPlay(new Error('502'))
      await Promise.resolve()
    })

    expect(synthesis.speak).toHaveBeenCalledTimes(1)
  })

  it('al pedir otro texto, el primero no vuelve a sonar', async () => {
    renderProvider()

    act(() => speech.actions.speak('a', 'Uno'))
    const first = FakeAudio.instances[0]
    const staleError = first.onerror!
    vi.advanceTimersByTime(500)
    act(() => speech.actions.speak('b', 'Dos'))

    await act(async () => {
      staleError()
      await Promise.resolve()
    })

    expect(synthesis.speak).not.toHaveBeenCalled()
    expect(screen.getByText('b')).toBeInTheDocument()
    expect(FakeAudio.instances).toHaveLength(2)
  })
})
