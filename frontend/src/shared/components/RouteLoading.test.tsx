import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RouteLoading } from './RouteLoading'

describe('RouteLoading', () => {
  it('anuncia la carga con texto, no solo con el dibujo', () => {
    render(<RouteLoading />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
})
