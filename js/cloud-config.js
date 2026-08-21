/**
 * Cinematic cloud configuration (atmosphere only — not geographic route).
 */
export const CLOUD_CONFIG = {
  enabled: true,
  maxHeroFormations: 4,
  puffsPerFormation: { desktop: 7, mobile: 5 },
  density: {
    departure: 0.45,
    climb: 0.95,
    cruise: 1.0,
    descent: 0.7,
    approach: 0.35,
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
