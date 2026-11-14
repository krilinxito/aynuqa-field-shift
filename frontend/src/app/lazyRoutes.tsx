import { lazy } from 'react'

export const LazyTerritoryRoute = lazy(() =>
  import('../routes/TerritoryRoute').then((module) => ({
    default: module.TerritoryRoute,
  })),
)

export const LazyAnalysisRoute = lazy(() =>
  import('../routes/AnalysisRoute').then((module) => ({
    default: module.AnalysisRoute,
  })),
)

export const LazyAssistantRoute = lazy(() =>
  import('../routes/AssistantRoute').then((module) => ({
    default: module.AssistantRoute,
  })),
)

export const LazyReportRoute = lazy(() =>
  import('../routes/ReportRoute').then((module) => ({
    default: module.ReportRoute,
  })),
)

export const LazyNotFoundRoute = lazy(() =>
  import('../routes/NotFoundRoute').then((module) => ({
    default: module.NotFoundRoute,
  })),
)
