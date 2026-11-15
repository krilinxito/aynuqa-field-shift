import { useLanguage } from '../app/i18n/languageContext'
import { PrimaryLink } from '../shared/components/Actions'
import { LlamaResting } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

export function NotFoundRoute() {
  const { t } = useLanguage()

  return (
    <div className={styles.page}>
      <LlamaResting />
      <h1>{t.notFoundTitle}</h1>
      <p>{t.notFoundBody}</p>
      <PrimaryLink to="/">{t.backHome}</PrimaryLink>
    </div>
  )
}
