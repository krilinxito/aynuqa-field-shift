import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryRouter,
  type InitialEntry,
} from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { appRoutes } from './router'

function renderRoute(initialEntry: InitialEntry) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  })

  render(<RouterProvider router={router} />)

  return router
}

describe('AppShell', () => {
  it('renderiza las regiones semánticas y el enlace de salto', () => {
    renderRoute('/territorio')

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Navegación principal' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute(
      'id',
      'contenido-principal',
    )
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Saltar al contenido' }),
    ).toHaveAttribute('href', '#contenido-principal')
  })
})

describe('rutas de la aplicación', () => {
  it.each([
    ['/territorio', 'Territorio'],
    ['/analisis', 'Análisis'],
    ['/asistente', 'Asistente agrícola'],
    ['/informe', 'Informe'],
  ])('renderiza %s mediante acceso directo', (path, heading) => {
    renderRoute(path)

    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
  })

  it('renderiza la página 404 para una ruta desconocida', () => {
    renderRoute('/ruta-inexistente')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Página no encontrada',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Volver al territorio' }),
    ).toBeInTheDocument()
  })

  it('redirige / hacia /territorio', async () => {
    const router = renderRoute('/')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/territorio')
    })
    expect(
      screen.getByRole('heading', { level: 1, name: 'Territorio' }),
    ).toBeInTheDocument()
  })

  it('permite navegar internamente con teclado o puntero', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/territorio')

    await user.click(screen.getByRole('link', { name: 'Análisis' }))

    expect(router.state.location.pathname).toBe('/analisis')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Análisis' }),
    ).toBeInTheDocument()
  })

  it('conserva sector y escenario al cambiar de sección', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/territorio?sector=S3&scenario=nino&temporal=1')

    await user.click(screen.getByRole('link', { name: 'Asistente' }))

    expect(router.state.location.pathname).toBe('/asistente')
    expect(router.state.location.search).toBe('?sector=S3&scenario=nino')
  })
})
