import { describe, expect, it } from 'vitest'

import shellStyles from './AppShell.module.css?raw'
import globalStyles from '../../styles/globals.css?raw'
import fontStyles from '../../styles/fonts.css?raw'

describe('fundamentos responsive del AppShell', () => {
  it('reserva una navegación móvil inferior de cuatro columnas y safe area', () => {
    expect(shellStyles).toContain('position: fixed')
    expect(shellStyles).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))')
    expect(shellStyles).toContain('env(safe-area-inset-bottom)')
    expect(shellStyles).toContain('var(--mobile-nav-height)')
  })

  it('cambia a un rail compacto a partir de 1024 px', () => {
    expect(shellStyles).toContain('@media (min-width: 64rem)')
    expect(shellStyles).toContain('var(--desktop-rail-width)')
    expect(shellStyles).toContain("'navigation header'")
  })

  it('mantiene foco visible y Montserrat local sin petición externa', () => {
    expect(globalStyles).toContain(':focus-visible')
    expect(globalStyles).toContain('outline: var(--focus-ring)')
    expect(fontStyles).toContain('font-display: swap')
    expect(fontStyles).not.toContain('https://')
    expect(fontStyles).toContain('montserrat-latin-variable.woff2')
  })
})
