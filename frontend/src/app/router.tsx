import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { RouteLoading } from '../shared/components/RouteLoading'
import {
  LazyAnalysisRoute,
  LazyAssistantRoute,
  LazyNotFoundRoute,
  LazyReportRoute,
  LazyTerritoryRoute,
} from './lazyRoutes'
import { RootRedirect } from './navigation/RootRedirect'
import { AppProviders } from './providers/AppProviders'

function withRouteFallback(route: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{route}</Suspense>
}

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppProviders />,
    children: [
      { index: true, element: <RootRedirect /> },
      {
        path: 'territorio',
        element: withRouteFallback(<LazyTerritoryRoute />),
      },
      { path: 'analisis', element: withRouteFallback(<LazyAnalysisRoute />) },
      {
        path: 'asistente',
        element: withRouteFallback(<LazyAssistantRoute />),
      },
      { path: 'informe', element: withRouteFallback(<LazyReportRoute />) },
      { path: '*', element: withRouteFallback(<LazyNotFoundRoute />) },
    ],
  },
]

export const browserRouter = createBrowserRouter(appRoutes)
