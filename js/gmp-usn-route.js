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

/**
 * Cinematic departure — virtual SAVEAS Field (stand-in for blurred RKSS).
 * Runway heading ~145° over Han River corridor; procedural scenery in virtual-airport.js.
 */
export const DEPARTURE_TRANSITION = [
  { id: "DEP_THR", lat: 37.5685, lon: 126.828, note: "virtual RWY threshold" },
  { id: "DEP_R1", lat: 37.56482, lon: 126.83125, note: "roll" },
  { id: "DEP_R2", lat: 37.5604, lon: 126.83516, note: "accelerate" },
  { id: "DEP_ROT", lat: 37.55671, lon: 126.83841, note: "rotate / liftoff" },
  { id: "DEP_CLB1", lat: 37.55082, lon: 126.84362, note: "initial climb" },
  { id: "DEP_CLB2", lat: 37.5405, lon: 126.85272, note: "climb outbound" },
  { id: "DEP_TURN", lat: 37.51692, lon: 126.87352, note: "turn toward SEL" },
];

export const DEP_RWY_HEADING = 145;
export const ARR_RWY_HEADING = 176;

const R_EARTH = 6371000;

function offsetLatLon(lat, lon, bearingDeg, distM) {
  const δ = distM / R_EARTH;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: (φ2 * 180) / Math.PI, lon: (((λ2 * 180) / Math.PI + 540) % 360) - 180 };
}

/**
 * Short straight-in (~5–6 km) so final groundspeed stays viewable.
 * LATEP→ENTRY join is skipped in route-progress (instant handoff).
 */
const ARR_THR = { lat: 35.545, lon: 129.355 };
const ARR_BACK = (ARR_RWY_HEADING + 180) % 360;
export const ARRIVAL_TRANSITION = [
  { id: "ARR_ENTRY", ...offsetLatLon(ARR_THR.lat, ARR_THR.lon, ARR_BACK, 5200), note: "final entry" },
  { id: "ARR_IF", ...offsetLatLon(ARR_THR.lat, ARR_THR.lon, ARR_BACK, 3200), note: "initial approach" },
  { id: "ARR_FAF", ...offsetLatLon(ARR_THR.lat, ARR_THR.lon, ARR_BACK, 1600), note: "final approach" },
  { id: "ARR_SHORT", ...offsetLatLon(ARR_THR.lat, ARR_THR.lon, ARR_BACK, 600), note: "short final" },
  { id: "ARR_THR", lat: ARR_THR.lat, lon: ARR_THR.lon, note: "virtual RWY threshold" },
  { id: "ARR_TD", ...offsetLatLon(ARR_THR.lat, ARR_THR.lon, ARR_RWY_HEADING, 220), note: "touchdown" },
  { id: "ARR_ROLL", ...offsetLatLon(ARR_THR.lat, ARR_THR.lon, ARR_RWY_HEADING, 700), note: "roll-out" },
  { id: "ARR_HOLD", ...offsetLatLon(ARR_THR.lat, ARR_THR.lon, ARR_RWY_HEADING, 1300), note: "end of roll" },
];

export const FLIGHT_DURATION_SEC = 110;
export const GMP_ELEV_M = 18;
export const USN_ELEV_M = 13;

/**
 * Active flight leg labels — update together when swapping routes.
 * Must stay in sync with DEPARTURE_TRANSITION / ARRIVAL_TRANSITION.
 */
export const ROUTE_META = {
  depIcao: "USN",
  depName: "Ulsan",
  arrIcao: "GMP",
  arrName: "Gimpo",
  durationSec: FLIGHT_DURATION_SEC,
};

export function formatRouteDuration(sec = ROUTE_META.durationSec) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function routeLabelShort() {
  return `${ROUTE_META.depIcao} → ${ROUTE_META.arrIcao}`;
}

export function routeLabelLong() {
  return `${ROUTE_META.depName} (${ROUTE_META.depIcao}) → ${ROUTE_META.arrName} (${ROUTE_META.arrIcao})`;
}

const R_EARTH_M = 6371000;

export function haversineM(lat1, lon1, lat2, lon2) {
  const toR = (d) => (d * Math.PI) / 180;
  const φ1 = toR(lat1);
  const φ2 = toR(lat2);
  const Δφ = toR(lat2 - lat1);
  const Δλ = toR(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R_EARTH_M * Math.asin(Math.min(1, Math.sqrt(a)));
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

/**
 * Soften the hard TGU corner (PATLA≈136° → LATEP≈77°) so cruise
 * doesn't crab left while looking over the East Sea.
 */
export const COAST_CURVE = [
  { id: "COAST1", lat: 36.12, lon: 128.22, note: "coast turn in" },
  { id: "COAST2", lat: 35.98, lon: 128.42, note: "coast turn" },
  { id: "COAST3", lat: 35.9, lon: 128.62, note: "coast turn" },
  { id: "COAST4", lat: 35.88, lon: 128.82, note: "eastbound sea" },
  { id: "COAST5", lat: 35.89, lon: 129.0, note: "to LATEP" },
];

export function buildFlightPath() {
  const pts = [];
  DEPARTURE_TRANSITION.forEach((p) => pts.push({ ...p, kind: "departure" }));
  /* Keep LATEP (near coast), drop KPO/USN/RKPU doglegs; replace TGU kink */
  for (const p of PUBLISHED_AIRWAY.slice(1, -3)) {
    if (p.id === "TGU") {
      COAST_CURVE.forEach((c) => pts.push({ ...c, kind: "airway" }));
      continue;
    }
    pts.push({ ...p, kind: "airway" });
  }
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
 * Gentler early route so climb-out does not whip the exterior view.
 * Fractions: LATEP start ≈0.8573, ARR_ENTRY start ≈0.9810 (coast-curve path).
 */
export function getCinematicRouteProgress(elapsedSeconds, duration = FLIGHT_DURATION_SEC) {
  const t = Math.max(0, Math.min(duration, elapsedSeconds));
  const LATEP_U = 0.8573;
  const ARR_ENTRY_U = 0.981;
  if (t <= 18) {
    return 0.012 * smoothstep(t / 18);
  }
  if (t <= 40) {
    const x = (t - 18) / 22;
    return 0.012 + 0.07 * smoothstep(x);
  }
  if (t <= 70) {
    /* Hold at LATEP — do NOT lerp across LATEP→ARR_ENTRY teleport */
    const x = (t - 40) / 30;
    return 0.082 + (LATEP_U - 0.082) * smoothstep(x);
  }
  if (t < 73) {
    return LATEP_U;
  }
  /* Slow final: linger on ARR_ENTRY→SHORT so ~96% still has altitude + horizon */
  if (t <= 105) {
    const x = (t - 73) / 32;
    return ARR_ENTRY_U + (0.9945 - ARR_ENTRY_U) * smoothstep(x); /* ~ARR_SHORT */
  }
  if (t < 108) {
    const x = (t - 105) / 3;
    return 0.9945 + (0.997 - 0.9945) * smoothstep(x); /* SHORT→THR→TD */
  }
  const x = (t - 108) / 2;
  return 0.997 + (1 - 0.997) * smoothstep(x);
}

export function timeToDistanceProgress(elapsed, duration, totalDistM) {
  return getCinematicRouteProgress(elapsed, duration) * totalDistM;
}

/** Altitude AMSL vs elapsed time (seconds), cinematic envelope */
export function altitudeAtElapsed(elapsed, duration = FLIGHT_DURATION_SEC) {
  const t = Math.max(0, Math.min(duration, elapsed));
  /* Keep short-final higher so 90–96% still shows horizon / sea, not dirt fill */
  const keys = [
    [0, GMP_ELEV_M + 12],
    [5, GMP_ELEV_M + 70],
    [12, 400],
    [20, 1200],
    [25, 3500],
    [35, 6000],
    [45, 7000],
    [55, 7200],
    [68, 5200],
    [73, 2800], /* final handoff */
    [82, 1600],
    [90, 1100],
    [96, 620],
    [100, 380],
    [104, 180],
    [106, 85],
    [107.5, USN_ELEV_M + 28],
    [108.5, USN_ELEV_M + 10], /* delayed touchdown */
    [109.3, USN_ELEV_M + 5],
    [110, USN_ELEV_M + 4],
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
  if (elapsed < 16) return "departure";
  if (elapsed < 28) return "climb";
  if (elapsed < 70) return "cruise";
  if (elapsed < 84) return "descent";
  return "approach";
}

export function qualityPhase(elapsed) {
  if (elapsed < 16) return "HIGH";
  if (elapsed < 28) return "MEDIUM";
  if (elapsed < 70) return "LOW";
  if (elapsed < 84) return "MEDIUM";
  return "HIGH";
}

export function lookAheadMeters(phase) {
  if (phase === "departure") return 1800;
  if (phase === "approach") return 1200;
  if (phase === "climb" || phase === "descent") return 4000;
  return 8000;
}

export function pitchFromAltRate(altRateMps) {
  const p = Math.atan2(altRateMps, 110) * (180 / Math.PI);
  return Math.max(-5, Math.min(7, p));
}

/** Autopilot base pitch by phase (degrees, nose up positive for cinema) */
export function autopilotPitchDeg(phase, altRateMps, elapsed = 0) {
  const rateP = pitchFromAltRate(altRateMps) * 0.55;
  if (phase === "departure") {
    if (elapsed < 7) return 1.2 + rateP * 0.2;
    if (elapsed < 14) return 10 + rateP;
    return 6 + rateP;
  }
  if (phase === "climb") return 4 + rateP;
  if (phase === "cruise") return 1.5 + rateP * 0.25;
  if (phase === "descent") return -1.2 + rateP * 0.4;
  if (elapsed >= 108) return 0;
  if (elapsed > 106) return 0.8;
  return -0.8 + rateP * 0.25;
}

/**
 * Cinematic look pitch offset (deg) vs time — varies up/down along the trip.
 * Positive = look toward sky, negative = look toward ground.
 * Smooth keys so the nose doesn't snap.
 */
export function cinematicLookPitchDeg(elapsed, duration = FLIGHT_DURATION_SEC) {
  const t = Math.max(0, Math.min(duration, elapsed));
  const keys = [
    [0, -2.5], /* runway */
    [8, 6], /* rotate — sky */
    [16, 8], /* climb — look up into cloud */
    [28, 3], /* early cruise — soft sky */
    [40, -2.5], /* mid — glance at terrain, keep horizon */
    [52, 2.5], /* cruise — sky / cloud */
    [64, -1.5], /* coast / sea — keep horizon */
    [72, -1.2], /* hold LATEP */
    [78, -1.8], /* top of descent */
    [90, -2.2], /* approach — runway ahead, not dirt fill */
    [100, -1.6], /* short final */
    [106, -1.2], /* flare */
    [108, -1.0], /* touchdown */
    [110, -1.2], /* roll-out */
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
