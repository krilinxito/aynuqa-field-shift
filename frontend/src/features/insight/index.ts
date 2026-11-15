import {
  InsightHeading,
  InsightListen,
  InsightProvenance,
  InsightProvider,
  InsightReasons,
  InsightRecommendation,
  InsightRecovery,
  InsightRisk,
  InsightTwin,
  InsightZoneWeather,
} from './SectorInsightParts'

/** Ficha de un sector, armada por composición. */
export const SectorInsight = {
  Provider: InsightProvider,
  Heading: InsightHeading,
  Recommendation: InsightRecommendation,
  Listen: InsightListen,
  Reasons: InsightReasons,
  Risk: InsightRisk,
  Recovery: InsightRecovery,
  Twin: InsightTwin,
  ZoneWeather: InsightZoneWeather,
  Provenance: InsightProvenance,
}
