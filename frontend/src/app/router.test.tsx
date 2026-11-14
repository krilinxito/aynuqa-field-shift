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
  it('renderiza las regiones semánticas, la navegación y el enlace de salto', async () => {
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
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByText('Datos de demostración')).toBeInTheDocument()
    expect(await screen.findByText(/Referencia del fixture:/)).toBeInTheDocument()
  })

  it('identifica la ruta activa con texto, indicador y aria-current', async () => {
    renderRoute('/territorio')
    await screen.findByRole('heading', { level: 1, name: 'Territorio' })

    expect(screen.getByRole('link', { name: 'Territorio' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Análisis' })).not.toHaveAttribute(
      'aria-current',
    )
    expect(
      screen.getByRole('link', { name: 'Territorio' }).querySelector('svg'),
    ).toBeInTheDocument()
  })
})

describe('rutas de la aplicación', () => {
  it.each([
    ['/territorio', 'Territorio'],
    ['/analisis', 'Análisis'],
    ['/asistente', 'Asistente agrícola'],
    ['/informe', 'Informe'],
  ])('renderiza %s mediante acceso directo', async (path, heading) => {
    renderRoute(path)

    expect(
      await screen.findByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
  })

  it('renderiza la página 404 para una ruta desconocida', async () => {
    renderRoute('/ruta-inexistente')

    expect(
      await screen.findByRole('heading', {
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
      await screen.findByRole('heading', { level: 1, name: 'Territorio' }),
    ).toBeInTheDocument()
  })

  it('permite navegar internamente con teclado o puntero', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/territorio')

    await screen.findByRole('heading', { level: 1, name: 'Territorio' })
    await user.click(screen.getByRole('link', { name: 'Análisis' }))

    expect(router.state.location.pathname).toBe('/analisis')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Análisis' }),
    ).toBeInTheDocument()
  })

  it('conserva sector y escenario al cambiar de sección', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/territorio?sector=S3&scenario=nino&temporal=1')

    await screen.findByRole('heading', { level: 1, name: 'Territorio' })
    await user.click(screen.getByRole('link', { name: 'Asistente' }))

    expect(router.state.location.pathname).toBe('/asistente')
    expect(router.state.location.search).toBe('?sector=S3&scenario=nino')
  })

  it('cambia el escenario, conserva el sector y lo mantiene al navegar', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/territorio?sector=S3&scenario=nino')

    const normalButton = await screen.findByRole('button', {
      name: 'Año normal',
    })
    expect(normalButton).toHaveAttribute('aria-pressed', 'false')

    normalButton.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(router.state.location.search).toBe('?sector=S3&scenario=normal')
    })
    expect(normalButton).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('link', { name: 'Análisis' }))
    await screen.findByRole('heading', { level: 1, name: 'Análisis' })
    expect(router.state.location.pathname).toBe('/analisis')
    expect(router.state.location.search).toContain('sector=S3')
    expect(router.state.location.search).toContain('scenario=normal')
  })

  it('permite activar la navegación principal mediante teclado', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/territorio')
    await screen.findByRole('heading', { level: 1, name: 'Territorio' })

    await user.tab()
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Territorio' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Análisis' })).toHaveFocus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/analisis')
    })
  })
})
