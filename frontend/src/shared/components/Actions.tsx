import type { ComponentProps } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

import styles from './actions.module.css'

/** La acción principal de una pantalla. Debe haber una sola. */
export function PrimaryButton(props: ComponentProps<'button'>) {
  return <button type="button" {...props} className={styles.primary} />
}

/** Acción secundaria: mismo tamaño para tocar, menos peso visual. */
export function SecondaryButton(props: ComponentProps<'button'>) {
  return <button type="button" {...props} className={styles.secondary} />
}

export function PrimaryLink(props: LinkProps) {
  return <Link {...props} className={styles.primary} />
}

export function SecondaryLink(props: LinkProps) {
  return <Link {...props} className={styles.secondary} />
}
