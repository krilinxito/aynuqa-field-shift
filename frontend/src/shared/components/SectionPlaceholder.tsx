import styles from './SectionPlaceholder.module.css'

interface SectionPlaceholderProps {
  eyebrow: string
  title: string
  description: string
}

export function SectionPlaceholder({
  eyebrow,
  title,
  description,
}: SectionPlaceholderProps) {
  return (
    <section className={styles.section} aria-labelledby="section-title">
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 id="section-title">{title}</h1>
      <p className={styles.description}>{description}</p>
    </section>
  )
}
