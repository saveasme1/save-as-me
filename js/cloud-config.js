/**
 * Cinematic cloud configuration (atmosphere only — not geographic route).
 * Inspired by CK42BB procedural-clouds (cumulus profiles) + OpenSkyFlight layering.
 */
export const CLOUD_CONFIG = {
  enabled: true,
  maxHeroFormations: 3,
  puffsPerFormation: { desktop: 12, mobile: 6 },
  density: {
    departure: 0.22,
    climb: 0.55,
    cruise: 1.0,
    descent: 0.4,
    approach: 0.2,
  },
  /** Local ENU distance band (meters) — cinematic towering cumulus */
  minDistanceM: 16000,
  maxDistanceM: 48000,
  puffWidthM: { min: 2800, max: 7800 },
  puffHeightM: { min: 1400, max: 4200 },
  windSpeedMps: 12,
  cinematicApproachMps: 70,
  atmTimeScale: 1,
  qualityMode: "auto", // auto | high | medium | low
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
