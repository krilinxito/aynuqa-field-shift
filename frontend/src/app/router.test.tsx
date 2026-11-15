import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryRouter,
  type InitialEntry,
} from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { appRoutes } from './router'

function renderRoute(initialEntry: InitialEntry) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  })

  render(<RouterProvider router={router} />)

  return router
}

function rememberCommunity() {
  localStorage.setItem('aynuqa:community', 'pumani')
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.letra
})

describe('recorrido principal', () => {
  it('empieza pidiendo la comunidad y dosifica las comunidades sin datos', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: '¿De qué comunidad es usted?',
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/comunidad')
    expect(screen.getByRole('button', { name: /Pumani/ })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Patacamaya/ }),
    ).not.toBeInTheDocument()

    // Las comunidades sin datos no abruman de entrada: se abren al tocar.
    expect(screen.queryAllByText(/Todavía sin datos/)).toHaveLength(0)
    await user.click(
      screen.getByRole('button', { name: /Ver otras comunidades/ }),
    )
    expect(screen.getAllByText(/Todavía sin datos/)).toHaveLength(7)

    // Sin comunidad elegida todavía no hay barra de navegación.
    expect(
      screen.queryByRole('navigation', { name: 'Navegación principal' }),
    ).not.toBeInTheDocument()
  })

  it('lleva de la comunidad a su resumen y de ahí al detalle de un sector', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/')

    await user.click(await screen.findByRole('button', { name: /Pumani/ }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pumani' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/mi-comunidad')
    expect(localStorage.getItem('aynuqa:community')).toBe('pumani')

    await user.click(screen.getByRole('button', { name: /Sector 4/ }))
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

  it('manda a elegir comunidad si todavía no hay una', async () => {
    const router = renderRoute('/mi-comunidad')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/comunidad')
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

  it('dosifica tierras gemelas y riesgo/clima, mostrándolos al tocar', async () => {
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

    await user.click(
      screen.getByRole('button', { name: /Riesgo de sequía y clima/ }),
    )
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

  it('muestra el botón para descargar la PWA en el celular y abre la guía de instalación', async () => {
    const user = userEvent.setup()
    renderRoute('/comunidad')

    const installBtn = await screen.findByRole('button', {
      name: /Descargar en celular/,
    })
    await user.click(installBtn)

    expect(
      screen.getByText(/Para guardar Aynuqa en la pantalla de su celular/),
    ).toBeInTheDocument()
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
