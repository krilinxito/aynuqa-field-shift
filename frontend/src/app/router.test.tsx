import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryRouter,
  type InitialEntry,
} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { appRoutes } from './router'

function renderRoute(initialEntry: InitialEntry) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  })

  render(<RouterProvider router={router} />)

  return router
}

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Ajustes' }))
}

function rememberCommunity() {
  localStorage.setItem('aynuqa:community', 'pumani')
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.letra
})

describe('recorrido principal', () => {
  it('entra directo a la comunidad con datos, sin obligar a elegir', async () => {
    const router = renderRoute('/')

    // Primera prueba: la ruta perezosa todavía no está en caché.
    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Pumani' },
        { timeout: 4000 },
      ),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/mi-comunidad')
    // La barra de navegación está siempre.
    expect(
      screen.getByRole('navigation', { name: 'Navegación principal' }),
    ).toBeInTheDocument()
  })

  it('cambiar de comunidad es opcional y dosifica las que no tienen datos', async () => {
    const user = userEvent.setup()
    renderRoute('/comunidad')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: '¿De qué comunidad es usted?',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pumani/ })).toBeInTheDocument()
    expect(screen.queryAllByText(/Todavía sin datos/)).toHaveLength(0)
    await user.click(
      screen.getByRole('button', { name: /Ver otras comunidades/ }),
    )
    expect(screen.getAllByText(/Todavía sin datos/)).toHaveLength(7)
  })

  it('lleva de la comunidad a su resumen y de ahí al detalle de un sector', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/comunidad')

    await user.click(await screen.findByRole('button', { name: /Pumani/ }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pumani' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/mi-comunidad')
    expect(localStorage.getItem('aynuqa:community')).toBe('pumani')

    await user.click(screen.getByRole('button', { name: /Sector 4.*Confianza/ }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sector 4' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/sector')
    expect(router.state.location.search).toBe('?sector=S4&scenario=nino')
    expect(
      screen.getByText('Mantener este sector en descanso.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Volver a Pumani/ }))
    expect(router.state.location.pathname).toBe('/mi-comunidad')
    expect(router.state.location.search).toBe('?scenario=nino')
  })

  it('recuerda la comunidad y abre directo en su resumen', async () => {
    rememberCommunity()
    const router = renderRoute('/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pumani' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/mi-comunidad')
  })

  it('abre el resumen aunque todavía no se haya elegido comunidad', async () => {
    const router = renderRoute('/mi-comunidad')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pumani' }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/mi-comunidad')
    })
  })

  it('muestra la página 404 para una ruta desconocida', async () => {
    renderRoute('/ruta-inexistente')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Esta página no existe',
      }),
    ).toBeInTheDocument()
  })
})

describe('resumen de la comunidad', () => {
  beforeEach(rememberCommunity)

  it('agrupa los sectores por lo que conviene hacer, con su confianza', async () => {
    renderRoute('/mi-comunidad')

    await screen.findByRole('heading', { level: 1, name: 'Pumani' })

    expect(
      screen.getByRole('heading', { name: /Abrir para cultivo.*3 sectores/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Seguir en descanso.*3 sectores/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Seguir cultivando.*1 sector/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Sector 1.*Confianza media/ }),
    ).toBeInTheDocument()
  })

  it('muestra riesgo y clima de entrada y dosifica las tierras gemelas', async () => {
    const user = userEvent.setup()
    renderRoute('/mi-comunidad')

    await screen.findByRole('heading', { level: 1, name: 'Pumani' })

    // De entrada están cerrados para no abrumar con texto
    expect(
      screen.queryByRole('heading', { name: 'Jesús de Machaca' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Tierras gemelas/ }))
    expect(
      screen.getByRole('heading', { name: 'Jesús de Machaca' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Se parece a los sectores 1 y 5/),
    ).toBeInTheDocument()
    expect(screen.getByText(/precedente, no como garantía/)).toBeInTheDocument()

    // Riesgo y clima ya están abiertos: no hace falta tocar.
    expect(
      screen.getByRole('button', { name: /Riesgo de sequía y clima/ }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText(/aumenta la probabilidad de sequía/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Riesgo alto:/)).toBeInTheDocument()
    expect(screen.getByText(/Es igual para todos los sectores/)).toBeInTheDocument()
    expect(screen.getByText(/Datos simulados:/)).toBeInTheDocument()
    expect(screen.getByText(/Datos de demostración:/)).toBeInTheDocument()
  })

  it('compara con un año normal, lo avisa y explica que no hay gemelas', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/mi-comunidad')

    await user.click(
      await screen.findByRole('button', { name: 'Si fuera un año normal' }),
    )

    await waitFor(() => {
      expect(router.state.location.search).toBe('?scenario=normal')
    })
    expect(await screen.findByText('Esto es una comparación.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Tierras gemelas/ }))
    expect(
      await screen.findByText(/no hay precedentes de tierras gemelas/),
    ).toBeInTheDocument()
  })
})

describe('detalle de un sector', () => {
  beforeEach(rememberCommunity)

  it('muestra primero el consejo y dosifica motivos, tierra parecida y clima', async () => {
    const user = userEvent.setup()
    renderRoute('/sector?sector=S1&scenario=nino')

    await screen.findByRole('heading', { level: 1, name: 'Sector 1' })

    expect(screen.getByText(/Datos simulados:/)).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /¿Por qué damos este consejo\?/ }),
    )
    expect(
      screen.getByRole('heading', { name: /Riesgo de sequía: medio/ }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Qué pasó en una tierra parecida/ }),
    )
    expect(screen.getByText(/precedente, no como garantía/)).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /El tiempo en la zona/ }),
    )
    expect(
      screen.getByRole('heading', { name: /El tiempo en toda la zona de Pumani/ }),
    ).toBeInTheDocument()
  })

  it('anota lo que decidió la comunidad, aunque no sea lo recomendado', async () => {
    const user = userEvent.setup()
    renderRoute('/sector?sector=S4&scenario=nino')

    await screen.findByRole('heading', { level: 1, name: 'Sector 4' })
    const group = screen.getByRole('group', { name: '¿Qué decidió la comunidad?' })
    // La recomendación va primero y marcada, pero se puede elegir otra.
    const options = within(group).getAllByRole('button')
    expect(options[0]).toHaveTextContent(/lo recomendado/)

    await user.click(within(group).getByRole('button', { name: /Abrir para cultivo/ }))
    await user.type(screen.getByLabelText('Nota (opcional)'), 'Lo hablamos el domingo')
    await user.click(screen.getByRole('button', { name: 'Guardar decisión' }))

    expect(await screen.findByText('Decisión guardada.')).toBeInTheDocument()
    expect(screen.getByText('Eligió otra cosa', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('«Lo hablamos el domingo»')).toBeInTheDocument()
    const saved = JSON.parse(localStorage.getItem('aynuqa:decisions') ?? '[]') as Array<{
      action: string
      follows_recommendation: boolean
    }>
    expect(saved).toMatchObject([{ action: 'open', follows_recommendation: false }])

    await user.click(screen.getByRole('button', { name: 'Borrar' }))
    await waitFor(() => {
      expect(screen.queryByText('Decisiones anotadas')).not.toBeInTheDocument()
    })
  })

  it('vuelve a la comunidad si el sector no existe', async () => {
    const router = renderRoute('/sector?sector=S99')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/mi-comunidad')
    })
  })

  it('al preguntar desde un sector conserva sector y escenario', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/sector?sector=S3&scenario=normal')

    await screen.findByRole('heading', { level: 1, name: 'Sector 3' })
    await user.click(screen.getByRole('link', { name: 'Preguntar' }))

    expect(router.state.location.pathname).toBe('/preguntar')
    expect(router.state.location.search).toBe('?sector=S3&scenario=normal')
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Preguntar' })).toHaveAttribute(
        'aria-current',
        'page',
      )
    })
    expect(
      await screen.findByText(/Responde sobre el sector 3 de Pumani/),
    ).toBeInTheDocument()
  })
})

describe('letra grande, idiomas (Aymara / Quechua) y botón de descarga PWA', () => {
  it('agranda la letra de toda la app y lo recuerda', async () => {
    const user = userEvent.setup()
    renderRoute('/comunidad')

    await openSettings(user)
    const button = await screen.findByRole('button', { name: /Letra grande/ })
    await user.click(button)

    expect(document.documentElement.dataset.letra).toBe('grande')
    expect(localStorage.getItem('aynuqa:text-size')).toBe('grande')
    expect(
      screen.getByRole('button', { name: /Letra normal/ }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('traduce el sitio a Aymara y Quechua al tocar el selector de idioma', async () => {
    const user = userEvent.setup()
    renderRoute('/comunidad')

    await screen.findByRole('heading', {
      level: 1,
      name: '¿De qué comunidad es usted?',
    })

    await openSettings(user)
    await user.click(screen.getByRole('button', { name: 'Aymara' }))
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '¿Kawkïri markatätasa?',
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Quechua' }))
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '¿Mayqin ayllumantataq kanki?',
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Español' }))
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '¿De qué comunidad es usted?',
      }),
    ).toBeInTheDocument()
  })

  it('sin permiso del navegador no muestra el botón de instalar', async () => {
    renderRoute('/comunidad')

    await screen.findByRole('heading', { level: 1, name: '¿De qué comunidad es usted?' })
    expect(screen.queryByRole('button', { name: /Instalar/ })).not.toBeInTheDocument()
  })

  it('instala directo con un toque cuando el navegador lo permite', async () => {
    const user = userEvent.setup()
    renderRoute('/comunidad')
    await screen.findByRole('heading', { level: 1, name: '¿De qué comunidad es usted?' })

    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    })
    act(() => {
      window.dispatchEvent(event)
    })

    await user.click(await screen.findByRole('button', { name: 'Instalar' }))
    expect(prompt).toHaveBeenCalledOnce()
    expect(screen.queryByText(/Toque los tres puntitos/)).not.toBeInTheDocument()
  })
})

describe('mapa de sectores', () => {
  beforeEach(rememberCommunity)

  it('muestra la foto satelital con atribución y cada sector se abre tocando', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/mi-comunidad')

    await screen.findByRole('heading', { level: 1, name: 'Pumani' })
    const map = screen.getByRole('group', { name: 'Dibujo de los sectores' })
    expect(map.querySelector('image')?.getAttribute('href')).toContain(
      'World_Imagery/MapServer/export',
    )
    expect(screen.getByText(/Imagen: Esri/)).toBeInTheDocument()

    await user.click(within(map).getByRole('button', { name: /Sector 4, riesgo/ }))
    expect(router.state.location.pathname).toBe('/sector')
  })

  it('se puede cambiar a dibujo y lo recuerda', async () => {
    const user = userEvent.setup()
    renderRoute('/mi-comunidad')

    await screen.findByRole('heading', { level: 1, name: 'Pumani' })
    await user.click(screen.getByRole('button', { name: 'Dibujo' }))
    const map = screen.getByRole('group', { name: 'Dibujo de los sectores' })
    expect(map.querySelector('image')).toBeNull()
    expect(localStorage.getItem('aynuqa:map-view')).toBe('drawing')
  })
})

describe('modo avanzado', () => {
  beforeEach(rememberCommunity)

  it('se enciende en Ajustes y muestra los números técnicos del sector', async () => {
    const user = userEvent.setup()
    renderRoute('/sector?sector=S1&scenario=nino')

    await screen.findByRole('heading', { level: 1, name: 'Sector 1' })
    expect(screen.queryByText(/Riesgo de sequía \(0 a 1\)/)).not.toBeInTheDocument()

    await openSettings(user)
    await user.click(
      screen.getByRole('switch', { name: 'Modo avanzado (números técnicos)' }),
    )

    expect(screen.getByText(/Riesgo de sequía \(0 a 1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Residuo RESTREND/)).toBeInTheDocument()
    expect(localStorage.getItem('aynuqa:preferences')).toContain('"advanced":true')
  })
})

describe('preguntar a la llamita', () => {
  beforeEach(rememberCommunity)

  it('sin sector pregunta sobre toda la comunidad', async () => {
    renderRoute('/preguntar')

    expect(
      await screen.findByText(/Responde sobre la comunidad de Pumani/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: '¿Qué sectores conviene abrir este año?',
      }),
    ).toBeInTheDocument()
  })

  it('responde la pregunta sugerida del sector con su nota de confianza', async () => {
    const user = userEvent.setup()
    renderRoute('/preguntar?sector=S3&scenario=nino')

    await user.click(
      await screen.findByRole('button', {
        name: '¿Conviene abrir el sector 3 este año?',
      }),
    )

    expect(await screen.findByText('La llamita responde')).toBeInTheDocument()
    expect(screen.getByText('Usted preguntó')).toBeInTheDocument()
    expect(screen.getByText(/Confianza media/)).toBeInTheDocument()
  })

  it('avisa con claridad cuando la demostración no tiene respuesta', async () => {
    const user = userEvent.setup()
    renderRoute('/preguntar')

    await user.type(
      await screen.findByLabelText('O escriba su pregunta'),
      '¿Va a helar?',
    )
    await user.click(screen.getByRole('button', { name: 'Preguntar' }))

    expect(await screen.findByText(/datos de demostración/)).toBeInTheDocument()
    expect(screen.queryByText('La llamita responde')).not.toBeInTheDocument()
  })
})
