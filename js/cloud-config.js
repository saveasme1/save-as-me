/**
 * Cinematic cloud configuration (atmosphere only — not geographic route).
 */
export const CLOUD_CONFIG = {
  enabled: false,
  maxHeroFormations: 3,
  puffsPerFormation: { desktop: 6, mobile: 4 },
  density: {
    departure: 0.1,
    climb: 0.4,
    cruise: 0.75,
    descent: 0.3,
    approach: 0.1,
  },
  cinematicApproachMps: 20,
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
