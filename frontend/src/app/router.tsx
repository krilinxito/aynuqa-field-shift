import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { RouteLoading } from '../shared/components/RouteLoading'
import {
  LazyAskRoute,
  LazyCommunityHomeRoute,
  LazyCommunityRoute,
  LazyNotFoundRoute,
  LazySectorDetailRoute,
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
      {
        path: 'mi-comunidad',
        element: withRouteFallback(<LazyCommunityHomeRoute />),
      },
      { path: 'sector', element: withRouteFallback(<LazySectorDetailRoute />) },
      { path: 'preguntar', element: withRouteFallback(<LazyAskRoute />) },
      { path: '*', element: withRouteFallback(<LazyNotFoundRoute />) },
    ],
  },
]

export const browserRouter = createBrowserRouter(appRoutes)
