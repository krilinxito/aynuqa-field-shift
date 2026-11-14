import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RouteLoading } from './RouteLoading'

describe('RouteLoading', () => {
  it('ofrece un fallback ligero y anunciado para rutas diferidas', () => {
    render(<RouteLoading />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando sección…')
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
})
