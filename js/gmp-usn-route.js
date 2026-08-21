/**
 * Published airway / flight-plan route data (RKSS → RKPU).
 * Not an exact airline radar track — cinematic portfolio reconstruction.
 */
export const PUBLISHED_AIRWAY = [
  { id: "RKSS", name: "Gimpo International Airport", lat: 37.55831, lon: 126.79058 },
  { id: "SEL", name: "Anyang VORTAC", lat: 37.41389, lon: 126.92861 },
  { id: "BELMI", lat: 37.21333, lon: 126.99139 },
  { id: "OSN", name: "Osan VORTAC", lat: 37.0919, lon: 127.02975 },
  { id: "SINSA", lat: 36.83611, lon: 127.34722 },
  { id: "AKLAS", lat: 36.7125, lon: 127.49944 },
  { id: "VAPKA", lat: 36.45167, lon: 127.81917 },
  { id: "PATLA", lat: 36.27867, lon: 128.02867 },
  { id: "TGU", name: "Dalsung VORTAC", lat: 35.81, lon: 128.59083 },
  { id: "LATEP", lat: 35.90361, lon: 129.08111 },
  { id: "KPO", name: "Pohang VORTAC", lat: 35.97747, lon: 129.47433 },
  { id: "USN", name: "Ulsan VOR-DME", lat: 35.5985, lon: 129.35328 },
  { id: "RKPU", name: "Ulsan Airport", lat: 35.59348, lon: 129.35174 },
];

/** Cinematic departure (RWY 14L ~136° T) — not published SID
 * Dense runway points so first ~25s stays on Gimpo field. */
export const DEPARTURE_TRANSITION = [
  { id: "DEP_THR", lat: 37.5635, lon: 126.7812, note: "RWY14L threshold" },
  { id: "DEP_R1", lat: 37.5622, lon: 126.7835, note: "roll 1" },
  { id: "DEP_R2", lat: 37.5608, lon: 126.7858, note: "roll 2" },
  { id: "DEP_R3", lat: 37.5594, lon: 126.7882, note: "roll 3 / rotate" },
  { id: "DEP_ROT", lat: 37.5575, lon: 126.7912, note: "liftoff" },
  { id: "DEP_CLB1", lat: 37.5540, lon: 126.7970, note: "initial climb" },
  { id: "DEP_CLB2", lat: 37.5450, lon: 126.8120, note: "climb outbound" },
  { id: "DEP_TURN", lat: 37.5000, lon: 126.8500, note: "turn toward SEL" },
];

/** Cinematic arrival (RWY 18 ~176° T) — not published STAR */
export const ARRIVAL_TRANSITION = [
  { id: "ARR_IF", lat: 35.648, lon: 129.3555, note: "initial approach" },
  { id: "ARR_FAF", lat: 35.618, lon: 129.3538, note: "final approach" },
  { id: "ARR_THR", lat: 35.5982, lon: 129.3522, note: "RWY18 threshold" },
  { id: "ARR_HOLD", lat: 35.5935, lon: 129.3517, note: "Ulsan airport hold" },
];

export const FLIGHT_DURATION_SEC = 110;
export const GMP_ELEV_M = 18;
export const USN_ELEV_M = 13;

const R_EARTH = 6371000;

export function haversineM(lat1, lon1, lat2, lon2) {
  const toR = (d) => (d * Math.PI) / 180;
  const φ1 = toR(lat1);
  const φ2 = toR(lat2);
  const Δφ = toR(lat2 - lat1);
  const Δλ = toR(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function bearingDeg(lat1, lon1, lat2, lon2) {
  const toR = (d) => (d * Math.PI) / 180;
  const φ1 = toR(lat1);
  const φ2 = toR(lat2);
  const Δλ = toR(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function lerpGeo(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lon: a.lon + (b.lon - a.lon) * t,
  };
}

export function buildFlightPath() {
  const pts = [];
  DEPARTURE_TRANSITION.forEach((p) => pts.push({ ...p, kind: "departure" }));
  PUBLISHED_AIRWAY.slice(1).forEach((p) => pts.push({ ...p, kind: "airway" }));
  ARRIVAL_TRANSITION.forEach((p) => pts.push({ ...p, kind: "arrival" }));

  const segments = [];
  let cumulative = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dist = haversineM(pts[i].lat, pts[i].lon, pts[i + 1].lat, pts[i + 1].lon);
    segments.push({
      from: pts[i],
      to: pts[i + 1],
      distM: dist,
      startM: cumulative,
      endM: cumulative + dist,
    });
    cumulative += dist;
  }
  return { points: pts, segments, totalDistM: cumulative };
}

export function samplePathByDistance(path, distM) {
  const d = Math.max(0, Math.min(path.totalDistM, distM));
  const seg =
    path.segments.find((s) => d >= s.startM && d <= s.endM) ||
    path.segments[path.segments.length - 1];
  const t = seg.distM > 1e-3 ? (d - seg.startM) / seg.distM : 1;
  const pos = lerpGeo(seg.from, seg.to, t);
  return {
    ...pos,
    legIndex: path.segments.indexOf(seg),
    fromId: seg.from.id,
    toId: seg.to.id,
    kind: seg.from.kind,
    t,
  };
}

export function sampleAhead(path, distM, lookAheadM) {
  return samplePathByDistance(path, distM + lookAheadM);
}

function smoothstep(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

/**
 * Nonlinear cinematicTime → geographic route progress [0..1].
 * 0–25s  Gimpo local ~8% of route
 * 25–35s climb accel
 * 35–70s cruise compresses ~70% of route
 * 70–80s decelerate
 * 80–110s Ulsan local ~12% of route
 */
export function getCinematicRouteProgress(elapsedSeconds, duration = FLIGHT_DURATION_SEC) {
  const t = Math.max(0, Math.min(duration, elapsedSeconds));
  /* Gimpo: first 25s ≈ 2.5% route — stay on field/runway as long as possible */
  if (t <= 25) {
    return 0.025 * smoothstep(t / 25);
  }
  if (t <= 35) {
    const x = (t - 25) / 10;
    return 0.025 + 0.095 * smoothstep(x);
  }
  if (t <= 70) {
    const x = (t - 35) / 35;
    return 0.12 + 0.76 * smoothstep(x);
  }
  if (t <= 80) {
    const x = (t - 70) / 10;
    return 0.88 + 0.04 * smoothstep(x);
  }
  const x = (t - 80) / 30;
  return 0.92 + 0.08 * smoothstep(x);
}

export function timeToDistanceProgress(elapsed, duration, totalDistM) {
  return getCinematicRouteProgress(elapsed, duration) * totalDistM;
}

/** Altitude AMSL vs elapsed time (seconds), cinematic envelope */
export function altitudeAtElapsed(elapsed, duration = FLIGHT_DURATION_SEC) {
  const t = Math.max(0, Math.min(duration, elapsed));
  const keys = [
    [0, GMP_ELEV_M + 12],
    [5, GMP_ELEV_M + 70],
    [12, 400],
    [20, 1200],
    [25, 3500],
    [35, 6000],
    [45, 7000],
    [55, 7200],
    [70, 6800],
    [80, 5000],
    [90, 2800],
    [100, 1400],
    [107, 450],
    [110, USN_ELEV_M + 80],
  ];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a0] = keys[i];
    const [t1, a1] = keys[i + 1];
    if (t <= t1) {
      const x = (t - t0) / (t1 - t0 || 1);
      return a0 + (a1 - a0) * smoothstep(x);
    }
  }
  return keys[keys.length - 1][1];
}

/** @deprecated use altitudeAtElapsed */
export function altitudeEnvelopeM(u) {
  return altitudeAtElapsed(u * FLIGHT_DURATION_SEC);
}

export function phaseFromTime(elapsed, duration = FLIGHT_DURATION_SEC) {
  if (elapsed < 25) return "departure";
  if (elapsed < 35) return "climb";
  if (elapsed < 70) return "cruise";
  if (elapsed < 80) return "descent";
  return "approach";
}

export function qualityPhase(elapsed) {
  if (elapsed < 25) return "HIGH";
  if (elapsed < 35) return "MEDIUM";
  if (elapsed < 70) return "LOW";
  if (elapsed < 80) return "MEDIUM";
  return "HIGH";
}

export function lookAheadMeters(phase) {
  if (phase === "departure" || phase === "approach") return 1800;
  if (phase === "climb" || phase === "descent") return 4000;
  return 8000;
}

export function pitchFromAltRate(altRateMps) {
  const p = Math.atan2(altRateMps, 110) * (180 / Math.PI);
  return Math.max(-5, Math.min(7, p));
}

/** Autopilot base pitch by phase (degrees, nose up positive for cinema) */
export function autopilotPitchDeg(phase, altRateMps) {
  const rateP = pitchFromAltRate(altRateMps) * 0.4;
  if (phase === "departure") return 4 + rateP;
  if (phase === "climb") return 3 + rateP;
  if (phase === "cruise") return rateP * 0.3;
  if (phase === "descent") return -2 + rateP;
  return -1 + rateP;
}
