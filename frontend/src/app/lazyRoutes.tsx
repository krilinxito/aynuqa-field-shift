import { lazy } from 'react'

export const LazyCommunityRoute = lazy(() =>
  import('../routes/CommunityRoute').then((module) => ({
    default: module.CommunityRoute,
  })),
)

export const LazyCommunityHomeRoute = lazy(() =>
  import('../routes/CommunityHomeRoute').then((module) => ({
    default: module.CommunityHomeRoute,
  })),
)

export const LazySectorDetailRoute = lazy(() =>
  import('../routes/SectorDetailRoute').then((module) => ({
    default: module.SectorDetailRoute,
  })),
)

export const LazyAskRoute = lazy(() =>
  import('../routes/AskRoute').then((module) => ({
    default: module.AskRoute,
  })),
)

export const LazyNotFoundRoute = lazy(() =>
  import('../routes/NotFoundRoute').then((module) => ({
    default: module.NotFoundRoute,
  })),
)
