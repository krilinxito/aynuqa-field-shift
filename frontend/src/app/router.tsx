import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { RouteLoading } from '../shared/components/RouteLoading'
import {
  LazyAskRoute,
  LazyCommunityRoute,
  LazyMySectorRoute,
  LazyNotFoundRoute,
  LazySectorPickerRoute,
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
      { path: 'comunidad', element: withRouteFallback(<LazyCommunityRoute />) },
      { path: 'sector', element: withRouteFallback(<LazySectorPickerRoute />) },
      { path: 'mi-sector', element: withRouteFallback(<LazyMySectorRoute />) },
      { path: 'preguntar', element: withRouteFallback(<LazyAskRoute />) },
      { path: '*', element: withRouteFallback(<LazyNotFoundRoute />) },
    ],
  },
]

export const browserRouter = createBrowserRouter(appRoutes)
