import { lazy } from 'react'

export const LazyCommunityRoute = lazy(() =>
  import('../routes/CommunityRoute').then((module) => ({
    default: module.CommunityRoute,
  })),
)

export const LazySectorPickerRoute = lazy(() =>
  import('../routes/SectorPickerRoute').then((module) => ({
    default: module.SectorPickerRoute,
  })),
)

export const LazyMySectorRoute = lazy(() =>
  import('../routes/MySectorRoute').then((module) => ({
    default: module.MySectorRoute,
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
