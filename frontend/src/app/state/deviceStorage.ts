/*
 * Lo que la app recuerda en el celular. Si el almacenamiento falla
 * (modo privado, sin espacio), la app sigue funcionando sin recordar.
 */

export const storageKeys = {
  community: 'aynuqa:community',
  textSize: 'aynuqa:text-size',
} as const

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Sin almacenamiento: no se recuerda, pero nada se rompe.
  }
}
