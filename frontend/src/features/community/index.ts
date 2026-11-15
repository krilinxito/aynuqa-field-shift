import {
  CommunityActions,
  CommunityHeading,
  CommunityListen,
  CommunityMap,
  CommunityProvider,
  CommunityRisk,
  CommunityTwins,
  CommunityWeather,
} from './CommunityOverviewParts'

/** Resumen de una comunidad, armado por composición. */
export const CommunityOverview = {
  Provider: CommunityProvider,
  Heading: CommunityHeading,
  Actions: CommunityActions,
  Listen: CommunityListen,
  Map: CommunityMap,
  Risk: CommunityRisk,
  Twins: CommunityTwins,
  Weather: CommunityWeather,
}
