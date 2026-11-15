import { resolveDataMode } from './systemStatus'

/**
 * `true` si lo que se muestra son datos de ejemplo: el modo mock, o un
 * backend que sirve archivos de prueba (VITE_DEMO_DATA=true). En ese caso
 * la app lo dice siempre, aunque la API marque los datos como reales.
 */
export function isDemoData(): boolean {
  return (
    resolveDataMode(import.meta.env.VITE_DATA_MODE) === 'mock' ||
    import.meta.env.VITE_DEMO_DATA === 'true'
  )
}
