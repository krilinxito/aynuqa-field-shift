/**
 * En las pruebas no hay service worker: el aviso de actualización nunca aparece.
 * Reemplaza a 'virtual:pwa-register/react' (ver vitest.config.ts).
 */
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as const,
    offlineReady: [false, () => {}] as const,
    updateServiceWorker: async () => {},
  }
}
