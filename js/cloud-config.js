/**
 * Cinematic cloud configuration (atmosphere only — not geographic route).
 * Renderer: Cesium CloudCollection (world-space). Three windshield sprites stay OFF.
 */
export const CLOUD_CONFIG = {
  enabled: true,
  maxHeroFormations: 2,
  puffsPerFormation: { desktop: 5, mobile: 3 },
  density: {
    departure: 0.1,
    climb: 0.5,
    cruise: 0.95,
    descent: 0.35,
    approach: 0.08,
  },
  cinematicApproachMps: 16,
  atmTimeScale: 1,
  qualityMode: "auto",
};

export function resolveCloudQuality(mode, mobile) {
  if (mode === "high") return "high";
  if (mode === "medium") return "medium";
  if (mode === "low") return "low";
  if (mobile) return "low";
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 4) return "medium";
  return "high";
}
