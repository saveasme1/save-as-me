/**
 * Published airway / flight-plan route data (RKSS → RKPU).
 * Not an exact airline radar track — visual reconstruction for portfolio.
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
 * Start on/near field so Gimpo airport is visible in the windshield. */
export const DEPARTURE_TRANSITION = [
  { id: "DEP_FIELD", lat: 37.5608, lon: 126.7862, note: "over Gimpo field / terminal view" },
  { id: "DEP_THR", lat: 37.5632, lon: 126.7818, note: "RWY14L threshold" },
  { id: "DEP_ROLL", lat: 37.5588, lon: 126.7888, note: "takeoff roll" },
  { id: "DEP_ROT", lat: 37.5548, lon: 126.7952, note: "rotate / liftoff" },
  { id: "DEP_CLB", lat: 37.5465, lon: 126.8080, note: "initial climb" },
  { id: "DEP_TURN", lat: 37.4900, lon: 126.8600, note: "turn toward SEL" },
];

/** Cinematic arrival (RWY 18 ~176° T) — not published STAR
 * Finish over Ulsan field so the airport stays in view. */
export const ARRIVAL_TRANSITION = [
  { id: "ARR_IF", lat: 35.648, lon: 129.3555, note: "initial approach north of field" },
  { id: "ARR_FAF", lat: 35.618, lon: 129.3538, note: "final approach" },
  { id: "ARR_THR", lat: 35.5982, lon: 129.3522, note: "RWY18 threshold" },
  { id: "ARR_HOLD", lat: 35.5935, lon: 129.3517, note: "Ulsan airport hold" },
];

export const FLIGHT_DURATION_SEC = 115;
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

/** Full cinematic path: departure → airway (from SEL) → arrival */
export function buildFlightPath() {
  const pts = [];
  DEPARTURE_TRANSITION.forEach((p) => pts.push({ ...p, kind: "departure" }));
  /* merge into airway from SEL onward (skip RKSS — covered by departure) */
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

/** Look-ahead point ~lookAheadM along path */
export function sampleAhead(path, distM, lookAheadM) {
  return samplePathByDistance(path, distM + lookAheadM);
}

/**
 * Cinematic altitude AMSL envelope (meters) vs normalized time 0..1
 * Tuned for ~115s Gimpo→Ulsan visual scale (cruise ~7 km).
 */
export function altitudeEnvelopeM(u) {
  const t = Math.max(0, Math.min(1, u));
  /* Stay low near Gimpo / Ulsan so airports read in the windshield */
  const keys = [
    [0.0, GMP_ELEV_M + 55],
    [0.05, GMP_ELEV_M + 95],
    [0.09, 220],
    [0.14, 900],
    [0.22, 3800],
    [0.3, 6000],
    [0.39, 7200],
    [0.55, 7000],
    [0.65, 6800],
    [0.74, 5000],
    [0.83, 2800],
    [0.9, 900],
    [0.95, 220],
    [0.98, USN_ELEV_M + 90],
    [1.0, USN_ELEV_M + 55],
  ];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a0] = keys[i];
    const [t1, a1] = keys[i + 1];
    if (t <= t1) {
      const x = (t - t0) / (t1 - t0 || 1);
      const s = x * x * (3 - 2 * x);
      return a0 + (a1 - a0) * s;
    }
  }
  return keys[keys.length - 1][1];
}

export function phaseFromTime(elapsed, duration = FLIGHT_DURATION_SEC) {
  const u = elapsed / duration;
  if (u < 0.087) return "departure";
  if (u < 0.217) return "initial-climb";
  if (u < 0.348) return "climb";
  if (u < 0.696) return "cruise";
  if (u < 0.87) return "descent";
  return "approach";
}

/** Distance progress: linger near Gimpo start + Ulsan end so airports are visible */
export function timeToDistanceProgress(elapsed, duration, totalDistM) {
  const u = Math.max(0, Math.min(1, elapsed / duration));
  let eased;
  if (u < 0.12) {
    /* first ~14s ≈ first 3.5% of route (airport + takeoff) */
    const x = u / 0.12;
    eased = 0.035 * (x * x * (3 - 2 * x));
  } else if (u > 0.86) {
    /* last ~16s ≈ last 6% of route (approach + field hold) */
    const x = (u - 0.86) / 0.14;
    eased = 0.94 + 0.06 * (x * x * (3 - 2 * x));
  } else {
    const m = (u - 0.12) / 0.74;
    eased = 0.035 + 0.905 * m;
  }
  return eased * totalDistM;
}

export function lookAheadMeters(phase) {
  if (phase === "departure" || phase === "approach") return 2500;
  if (phase === "initial-climb" || phase === "descent") return 4500;
  return 7000;
}

export function pitchFromAltRate(altRateMps) {
  /* small cinematic pitch from climb/descent rate */
  const p = Math.atan2(altRateMps, 90) * (180 / Math.PI);
  return Math.max(-6, Math.min(8, p));
}
