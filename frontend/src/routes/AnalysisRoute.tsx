import { ScenarioSwitch } from '../features/scenarios/components/ScenarioSwitch'
import { SectionPlaceholder } from '../shared/components/SectionPlaceholder'

export function AnalysisRoute() {
  return (
    <SectionPlaceholder
      eyebrow="Modo avanzado"
      title="Análisis"
      description="Las series históricas y comparaciones están en desarrollo."
      controls={<ScenarioSwitch />}
    />
  )
}
