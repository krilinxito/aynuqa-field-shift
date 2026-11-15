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

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.letra
})

describe('recorrido principal', () => {
  it('empieza pidiendo la comunidad y solo deja elegir la que tiene datos', async () => {
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
    expect(screen.getAllByText(/Todavía sin datos/)).toHaveLength(7)
    // Sin sector elegido todavía no hay barra de navegación.
    expect(
      screen.queryByRole('navigation', { name: 'Navegación principal' }),
    ).not.toBeInTheDocument()
  })

  it('lleva de comunidad a sector y de sector al consejo', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/')

    await user.click(await screen.findByRole('button', { name: /Pumani/ }))
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: '¿Cuál es su sector?',
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/sector')

    await user.click(screen.getByRole('button', { name: /Sector 4/ }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sector 4' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/mi-sector')
    expect(router.state.location.search).toBe('?sector=S4&scenario=nino')
    expect(
      screen.getByText('Mantener este sector en descanso.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Descanso sugerido: 1 año más.')).toBeInTheDocument()
  })

  it('recuerda la elección y abre directo en el sector', async () => {
    localStorage.setItem('aynuqa:community', 'pumani')
    localStorage.setItem('aynuqa:selected-sector', 'S7')
    const router = renderRoute('/')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sector 7' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/mi-sector')
  })

  it('manda a elegir si se abre el consejo sin sector', async () => {
    const router = renderRoute('/mi-sector')

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

describe('consejo del sector', () => {
  it('muestra confianza, datos simulados y la zona una sola vez', async () => {
    renderRoute('/mi-sector?sector=S1&scenario=nino')

    await screen.findByRole('heading', { level: 1, name: 'Sector 1' })

    expect(screen.getAllByText(/Qué tan seguros estamos/).length).toBeGreaterThan(2)
    expect(screen.getByText(/Datos simulados:/)).toBeInTheDocument()
    expect(screen.getByText(/Datos de demostración:/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Riesgo de sequía: medio/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/aumenta la probabilidad de sequía/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /El tiempo en toda la zona de Pumani/ }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Es igual para todos los sectores/)).toBeInTheDocument()
    expect(screen.getByText(/precedente, no como garantía/)).toBeInTheDocument()
  })

  it('compara con un año normal y lo avisa', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/mi-sector?sector=S3&scenario=nino')

    const normal = await screen.findByRole('button', {
      name: 'Si fuera un año normal',
    })
    expect(normal).toHaveAttribute('aria-pressed', 'false')

    await user.click(normal)

    await waitFor(() => {
      expect(router.state.location.search).toBe('?sector=S3&scenario=normal')
    })
    expect(await screen.findByText('Esto es una comparación.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Si fuera un año normal' }),
    ).toHaveAttribute('aria-pressed', 'true')
    // En el año normal no hay precedente de tierra gemela.
    expect(
      screen.queryByRole('heading', { name: 'Qué pasó en una tierra parecida' }),
    ).not.toBeInTheDocument()
  })

  it('conserva sector y escenario al ir a preguntar', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/mi-sector?sector=S3&scenario=normal')

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
  })
})

describe('letra grande', () => {
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
})

describe('preguntar a la llamita', () => {
  it('responde la pregunta sugerida con su nota de confianza', async () => {
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
    renderRoute('/preguntar?sector=S3&scenario=nino')

    await user.type(
      await screen.findByLabelText('O escriba su pregunta'),
      '¿Va a helar?',
    )
    await user.click(screen.getByRole('button', { name: 'Preguntar' }))

    expect(await screen.findByText(/datos de demostración/)).toBeInTheDocument()
    expect(screen.queryByText('La llamita responde')).not.toBeInTheDocument()
  })
})
