import {
  ARRIVAL_TRANSITION,
  DEPARTURE_TRANSITION,
  FLIGHT_DURATION_SEC,
  GMP_ELEV_M,
  altitudeEnvelopeM,
  bearingDeg,
  buildFlightPath,
  lookAheadMeters,
  phaseFromTime,
  pitchFromAltRate,
  sampleAhead,
  samplePathByDistance,
  timeToDistanceProgress,
} from "./gmp-usn-route.js";

function readIonToken() {
  if (typeof window !== "undefined" && window.__CESIUM_ION_TOKEN) {
    return String(window.__CESIUM_ION_TOKEN).trim();
  }
  return "";
}

function isMobile() {
  return window.innerWidth < 980;
}

/**
 * Cesium exterior world behind the Three.js cockpit.
 * Attribution remains visible (legal). No map chrome / labels.
 */
export async function createCesiumWorld({ containerId = "cesiumContainer", debug = false } = {}) {
  const Cesium = window.Cesium;
  if (!Cesium) throw new Error("Cesium global missing — load CesiumJS before this module");

  const token = readIonToken();
  if (!token) {
    console.warn("[cesium] No ion token (set window.__CESIUM_ION_TOKEN via cesium-token.local.js)");
  } else {
    Cesium.Ion.defaultAccessToken = token;
  }

  const container = document.getElementById(containerId);
  if (!container) throw new Error(`#${containerId} not found`);

  const mobile = isMobile();
  let terrainOpt = undefined;
  try {
    if (Cesium.Terrain?.fromWorldTerrain) {
      terrainOpt = Cesium.Terrain.fromWorldTerrain();
    }
  } catch (_) {}

  const viewer = new Cesium.Viewer(container, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    creditContainer: document.getElementById("cesiumCredit") || undefined,
    terrain: terrainOpt,
    requestRenderMode: false,
    msaaSamples: mobile ? 1 : 2,
  });

  if (!terrainOpt && Cesium.createWorldTerrainAsync) {
    Cesium.createWorldTerrainAsync()
      .then((t) => {
        viewer.terrainProvider = t;
      })
      .catch((e) => console.warn("[cesium] terrain", e));
  }

  viewer.scene.globe.enableLighting = false;
  /* depthTestAgainstTerrain causes flicker/pop while tiles stream in */
  viewer.scene.globe.depthTestAgainstTerrain = false;
  if (viewer.scene.fog) {
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.00018;
  }
  if (viewer.scene.skyBox && typeof viewer.scene.skyBox === "object") viewer.scene.skyBox.show = true;
  if (viewer.scene.sun && typeof viewer.scene.sun === "object") viewer.scene.sun.show = true;
  if (viewer.scene.moon && typeof viewer.scene.moon === "object") viewer.scene.moon.show = false;
  if (viewer.scene.skyAtmosphere && typeof viewer.scene.skyAtmosphere === "object") {
    viewer.scene.skyAtmosphere.show = true;
  }
  /* sharper tiles near airports; cruise can loosen later */
  viewer.resolutionScale = mobile ? 0.75 : 1;
  viewer.scene.globe.maximumScreenSpaceError = mobile ? 2 : 1.15;
  if ("tileCacheSize" in viewer.scene.globe) viewer.scene.globe.tileCacheSize = mobile ? 120 : 220;
  viewer.scene.globe.showGroundAtmosphere = true;
  viewer.scene.screenSpaceCameraController.enableInputs = false;
  if (viewer.cesiumWidget?.creditContainer) viewer.cesiumWidget.creditContainer.style.display = "";

  const path = buildFlightPath();
  console.info(
    `[cesium-route] path points=${path.points.length} totalDistKm=${(path.totalDistM / 1000).toFixed(1)} ` +
      `(published airway + cinematic dep/arr)`
  );

  const state = {
    elapsedSeconds: 0,
    normalizedProgress: 0,
    latitude: DEPARTURE_TRANSITION[0].lat,
    longitude: DEPARTURE_TRANSITION[0].lon,
    terrainHeight: 0,
    altitudeAMSL: GMP_ELEV_M + 140,
    altitudeAGL: 140,
    heading: 136,
    pitch: 0,
    roll: 0,
    activeLegIndex: 0,
    activeWaypointFrom: "DEP_FIELD",
    activeWaypointTo: "DEP_THR",
    phase: "departure",
    userYawOffset: 0,
    userAltitudeOffset: 0,
    routeHeading: 136,
    _yawTarget: 0,
    _altTarget: 0,
    _prevAlt: GMP_ELEV_M + 140,
    _heldAtEnd: false,
    _ready: false,
    totalDistM: path.totalDistM,
    totalDistKm: path.totalDistM / 1000,
    publishedNm: path.totalDistM / 1852,
  };

  function waitTilesIdle(maxMs = 6000, needIdle = 4) {
    return new Promise((resolve) => {
      let idle = 0;
      let remove = null;
      const finish = () => {
        try {
          if (typeof remove === "function") remove();
        } catch (_) {}
        resolve();
      };
      const timer = setTimeout(finish, maxMs);
      try {
        remove = viewer.scene.globe.tileLoadProgressEvent.addEventListener((queued) => {
          if (queued === 0) idle += 1;
          else idle = 0;
          if (idle >= needIdle) {
            clearTimeout(timer);
            finish();
          }
        });
      } catch (_) {
        clearTimeout(timer);
        finish();
      }
    });
  }

  function setCam(lon, lat, height, headingDeg, pitchDeg) {
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
      orientation: {
        heading: Cesium.Math.toRadians(headingDeg),
        pitch: Cesium.Math.toRadians(pitchDeg),
        roll: 0,
      },
    });
  }

  /* Multi-pass Gimpo preload so windshield is not muddy LOD sludge */
  const g0 = DEPARTURE_TRANSITION[0];
  const g1 = DEPARTURE_TRANSITION[Math.min(2, DEPARTURE_TRANSITION.length - 1)];
  document.body.classList.remove("is-cesium-ready");
  const bootEm = document.querySelector("#boot em");
  if (bootEm) bootEm.textContent = "Gimpo terrain loading…";

  setCam(g0.lon, g0.lat, 600, 136, -22);
  await waitTilesIdle(3500, 2);
  setCam(g0.lon, g0.lat, 280, 136, -12);
  await waitTilesIdle(3500, 3);
  /* final departure pose: along runway, sky + field readable */
  setCam(g0.lon, g0.lat, 170, 136, -11);
  await waitTilesIdle(2500, 2);

  state._ready = true;
  document.body.classList.add("is-cesium-ready");
  if (bootEm) bootEm.textContent = "Opening cockpit…";
  document.body.classList.add("is-ready");

  let debugEl = null;
  if (debug || new URLSearchParams(location.search).has("flightDebug")) {
    debugEl = document.createElement("pre");
    debugEl.id = "flightDebug";
    debugEl.style.cssText =
      "position:fixed;right:8px;bottom:48px;z-index:40;margin:0;padding:8px 10px;font:11px/1.35 ui-monospace,monospace;background:rgba(0,0,0,.55);color:#d7ffe8;border-radius:8px;pointer-events:none;max-width:280px";
    document.body.appendChild(debugEl);
  }

  async function sampleTerrainHeight(lat, lon) {
    try {
      const cartos = [Cesium.Cartographic.fromDegrees(lon, lat)];
      await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, cartos);
      return cartos[0].height || 0;
    } catch {
      return 0;
    }
  }

  let terrainCache = { key: "", h: 0, t: 0, pending: false };

  function terrainAtCached(lat, lon) {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const now = performance.now();
    if (terrainCache.key === key && now - terrainCache.t < 2000) return terrainCache.h;
    if (!terrainCache.pending) {
      terrainCache.pending = true;
      sampleTerrainHeight(lat, lon)
        .then((h) => {
          terrainCache = { key, h, t: performance.now(), pending: false };
        })
        .catch(() => {
          terrainCache.pending = false;
        });
    }
    return terrainCache.h;
  }

  function applyUserOffsets(keys, dt) {
    /* View-only peek — does NOT change route lat/lon or autopilot track */
    const yawMax = 8;
    const altMaxUp = 450;
    const altMaxDn = 350;
    if (keys?.left) state._yawTarget = Math.min(yawMax, state._yawTarget + dt * 22);
    else if (keys?.right) state._yawTarget = Math.max(-yawMax, state._yawTarget - dt * 22);
    else state._yawTarget += (0 - state._yawTarget) * Math.min(1, dt * 3.2);

    if (keys?.up) state._altTarget = Math.min(altMaxUp, state._altTarget + dt * 260);
    else if (keys?.down) state._altTarget = Math.max(-altMaxDn, state._altTarget - dt * 220);
    else state._altTarget += (0 - state._altTarget) * Math.min(1, dt * 2.8);

    state.userYawOffset += (state._yawTarget - state.userYawOffset) * Math.min(1, dt * 5);
    state.userAltitudeOffset += (state._altTarget - state.userAltitudeOffset) * Math.min(1, dt * 4);
  }

  let lastHeading = 136;
  let lastWall = performance.now();

  function tick(dt, keys, tabVisible) {
    if (!state._ready) {
      lastWall = performance.now();
      return state;
    }
    const now = performance.now();
    if (!tabVisible) {
      lastWall = now;
      return state;
    }
    /* wall-clock step — survives rAF throttle; capped so tab-return does not teleport */
    let step = (now - lastWall) / 1000;
    lastWall = now;
    if (!Number.isFinite(step) || step < 0) step = dt;
    step = Math.min(0.25, Math.max(dt, step));

    if (!state._heldAtEnd) {
      state.elapsedSeconds = Math.min(FLIGHT_DURATION_SEC, state.elapsedSeconds + step);
    }
    if (state.elapsedSeconds >= FLIGHT_DURATION_SEC - 0.05) {
      state._heldAtEnd = true;
      state.elapsedSeconds = FLIGHT_DURATION_SEC;
    }

    const u = state.elapsedSeconds / FLIGHT_DURATION_SEC;
    state.normalizedProgress = u;
    state.phase = phaseFromTime(state.elapsedSeconds);

    applyUserOffsets(keys, step);

    const distM = timeToDistanceProgress(
      state.elapsedSeconds,
      FLIGHT_DURATION_SEC,
      path.totalDistM
    );
    const sample = samplePathByDistance(path, distM);
    state.latitude = sample.lat;
    state.longitude = sample.lon;
    state.activeLegIndex = sample.legIndex;
    state.activeWaypointFrom = sample.fromId;
    state.activeWaypointTo = sample.toId;

    const lookM = lookAheadMeters(state.phase);
    const ahead = sampleAhead(path, distM, lookM);
    let hdg = bearingDeg(sample.lat, sample.lon, ahead.lat, ahead.lon);
    if (u > 0.9) hdg = 176;
    let dh = ((hdg - lastHeading + 540) % 360) - 180;
    const smoothHdg = lastHeading + dh * Math.min(1, step * (u > 0.9 ? 2.4 : 1.8));
    lastHeading = (smoothHdg + 360) % 360;
    /* route heading = autopilot only; keyboard yaw is view offset only */
    state.routeHeading = lastHeading;
    state.heading = lastHeading;

    const autoAlt = altitudeEnvelopeM(u);
    const terrainH = terrainAtCached(sample.lat, sample.lon);
    state.terrainHeight = terrainH;
    const minClear =
      state.phase === "departure" || state.phase === "approach"
        ? 35
        : state.phase === "cruise"
          ? 350
          : 120;
    /* autopilot altitude only — keyboard height is applied to camera later */
    const safe = Math.max(autoAlt, terrainH + minClear);
    state.altitudeAMSL = safe;
    state.altitudeAGL = safe - terrainH;

    const altRate = (state.altitudeAMSL - state._prevAlt) / Math.max(step, 1e-3);
    state._prevAlt = state.altitudeAMSL;
    state.pitch = pitchFromAltRate(altRate) * 0.35;
    const turnRate = dh / Math.max(step, 1e-3);
    state.roll = Math.max(-8, Math.min(8, -turnRate * 0.08));

    /* camera = route pose + temporary view offsets (does not rewrite route) */
    const camH = Math.max(
      terrainH + minClear,
      state.altitudeAMSL + state.userAltitudeOffset
    );
    let horizonBias = -6;
    /* mild look-down — steep pitch fills windshield with muddy low-LOD ground */
    if (u < 0.1) horizonBias = -11;
    else if (u < 0.18) horizonBias = -9;
    else if (u > 0.92) horizonBias = -14;
    else if (u > 0.86) horizonBias = -10;
    else if (state.phase === "cruise") horizonBias = -9;

    /* phase-aware tile quality: sharp near fields, lighter at cruise */
    if (u < 0.15 || u > 0.88) {
      viewer.scene.globe.maximumScreenSpaceError = mobile ? 1.8 : 1.05;
    } else if (state.phase === "cruise") {
      viewer.scene.globe.maximumScreenSpaceError = mobile ? 2.8 : 1.8;
    } else {
      viewer.scene.globe.maximumScreenSpaceError = mobile ? 2.2 : 1.35;
    }

    /* preload tiles ahead of aircraft */
    try {
      const pre = sampleAhead(path, distM, Math.max(lookM, 8000));
      viewer.scene.camera.moveForward; /* no-op keep ref */
      void pre;
      if ((Math.floor(state.elapsedSeconds * 2) % 5) === 0) {
        const carto = Cesium.Cartographic.fromDegrees(pre.lon, pre.lat);
        viewer.scene.globe.getHeight(carto);
      }
    } catch (_) {}

    const viewHdg = (state.routeHeading + state.userYawOffset + 360) % 360;
    const pitchCesium = Cesium.Math.toRadians(-state.pitch + horizonBias);
    const rollCesium = Cesium.Math.toRadians(state.roll);
    const hdgCesium = Cesium.Math.toRadians(viewHdg);

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(state.longitude, state.latitude, camH),
      orientation: {
        heading: hdgCesium,
        pitch: pitchCesium,
        roll: rollCesium,
      },
    });

    if (debugEl) {
      debugEl.textContent = [
        `PHASE ${state.phase.toUpperCase()}`,
        `LEG ${state.activeWaypointFrom} → ${state.activeWaypointTo}`,
        `T ${state.elapsedSeconds.toFixed(1)}s / ${FLIGHT_DURATION_SEC}s`,
        `ROUTE ${(u * 100).toFixed(1)}%`,
        `LAT ${state.latitude.toFixed(4)}  LON ${state.longitude.toFixed(4)}`,
        `ALT ${Math.round(state.altitudeAMSL)} m  AGL ${Math.round(state.altitudeAGL)} m`,
        `TER ${Math.round(state.terrainHeight)} m`,
        `HDG ${state.heading.toFixed(0)}°  P ${state.pitch.toFixed(1)}°  R ${state.roll.toFixed(1)}°`,
        `YAWΔ ${state.userYawOffset.toFixed(1)}°  ALTΔ ${state.userAltitudeOffset.toFixed(0)} m`,
        `DIST ${(path.totalDistM / 1000).toFixed(1)} km`,
      ].join("\n");
    }

    return state;
  }

  function resize() {
    viewer.resize();
    viewer.resolutionScale = isMobile()
      ? 0.65
      : Math.min(1, window.devicePixelRatio > 1.5 ? 0.85 : 1);
  }

  window.addEventListener("resize", resize);

  return {
    viewer,
    state,
    path,
    tick,
    resize,
    FLIGHT_DURATION_SEC,
    DEPARTURE_TRANSITION,
    ARRIVAL_TRANSITION,
  };
}
