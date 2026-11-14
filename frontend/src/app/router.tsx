import {
  createBrowserRouter,
  type RouteObject,
} from 'react-router-dom'

import { AnalysisRoute } from '../routes/AnalysisRoute'
import { AssistantRoute } from '../routes/AssistantRoute'
import { NotFoundRoute } from '../routes/NotFoundRoute'
import { ReportRoute } from '../routes/ReportRoute'
import { TerritoryRoute } from '../routes/TerritoryRoute'
import { AppShell } from './layout/AppShell'
import { RootRedirect } from './navigation/RootRedirect'

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <RootRedirect /> },
      { path: 'territorio', element: <TerritoryRoute /> },
      { path: 'analisis', element: <AnalysisRoute /> },
      { path: 'asistente', element: <AssistantRoute /> },
      { path: 'informe', element: <ReportRoute /> },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
]

export const browserRouter = createBrowserRouter(appRoutes)
