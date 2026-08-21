import {
  ARRIVAL_TRANSITION,
  ARR_RWY_HEADING,
  DEPARTURE_TRANSITION,
  DEP_RWY_HEADING,
  FLIGHT_DURATION_SEC,
  GMP_ELEV_M,
  USN_ELEV_M,
  altitudeAtElapsed,
  autopilotPitchDeg,
  bearingDeg,
  buildFlightPath,
  getCinematicRouteProgress,
  haversineM,
  lookAheadMeters,
  phaseFromTime,
  qualityPhase,
  sampleAhead,
  samplePathByDistance,
  timeToDistanceProgress,
} from "./gmp-usn-route.js?v=scrub-land1";
import { addVirtualAirport } from "./virtual-airport.js";
import { createCesiumCinematicClouds } from "./cesium-cinematic-clouds.js?v=scrub-land1";

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
 * Cesium exterior behind Three.js cockpit.
 * GeographicFlightState vs UserViewState are strictly separated.
 */
export async function createCesiumWorld({ containerId = "cesiumContainer", debug = false } = {}) {
  const Cesium = window.Cesium;
  if (!Cesium) throw new Error("Cesium global missing");

  const token = readIonToken();
  if (!token) {
    console.warn("[cesium] No ion token — set via js/cesium-token.local.js (gitignored)");
  } else {
    Cesium.Ion.defaultAccessToken = token;
  }

  const container = document.getElementById(containerId);
  if (!container) throw new Error(`#${containerId} missing`);

  const mobile = isMobile();
  let terrainOpt;
  try {
    if (Cesium.Terrain?.fromWorldTerrain) terrainOpt = Cesium.Terrain.fromWorldTerrain();
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

  /*
   * Gimpo RKSS airfield tiles are security-blurred on Bing (Cesium default).
   * https://community.cesium.com/t/blurred-tiles-gimpo-international-airport/18988
   * We start over Han River (clear) and use Esri / Sentinel instead of Bing.
   */
  try {
    viewer.imageryLayers.removeAll();
    let placed = false;
    try {
      viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          maximumLevel: 18,
          credit: "Imagery © Esri",
        })
      );
      placed = true;
      console.info("[cesium] imagery: Esri World Imagery (Han River corridor — avoids Bing RKSS blur)");
    } catch (e) {
      console.warn("[cesium] Esri imagery failed", e);
    }
    if (!placed) {
      try {
        const sentinel = await Cesium.IonImageryProvider.fromAssetId(3954);
        viewer.imageryLayers.addImageryProvider(sentinel);
        placed = true;
        console.info("[cesium] imagery: Sentinel-2 fallback");
      } catch (e2) {
        console.warn("[cesium] Sentinel-2 also failed", e2);
      }
    }
  } catch (e) {
    console.warn("[cesium] imagery setup failed — keeping viewer default", e);
  }

  viewer.scene.globe.enableLighting = false;
  viewer.scene.globe.depthTestAgainstTerrain = false;
  if (viewer.scene.fog) {
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.00015; /* pre-cloud Cesium look (afb7ae3) */
  }
  if (viewer.scene.skyBox && typeof viewer.scene.skyBox === "object") viewer.scene.skyBox.show = true;
  if (viewer.scene.sun && typeof viewer.scene.sun === "object") viewer.scene.sun.show = true;
  if (viewer.scene.moon && typeof viewer.scene.moon === "object") viewer.scene.moon.show = false;
  if (viewer.scene.skyAtmosphere && typeof viewer.scene.skyAtmosphere === "object") {
    viewer.scene.skyAtmosphere.show = true;
  }
  viewer.scene.globe.showGroundAtmosphere = true;
  viewer.scene.screenSpaceCameraController.enableInputs = false;
  if ("tileCacheSize" in viewer.scene.globe) viewer.scene.globe.tileCacheSize = mobile ? 140 : 240;
  if (viewer.cesiumWidget?.creditContainer) viewer.cesiumWidget.creditContainer.style.display = "";

  applyQuality("HIGH", mobile, viewer);

  const path = buildFlightPath();
  console.info(
    `[cesium-route] pts=${path.points.length} km=${(path.totalDistM / 1000).toFixed(1)} duration=${FLIGHT_DURATION_SEC}s`
  );

  /* Virtual airports — readable runway when real pads are security-blurred */
  const depApt = addVirtualAirport(Cesium, viewer, {
    lat: DEPARTURE_TRANSITION[0].lat,
    lon: DEPARTURE_TRANSITION[0].lon,
    heading: DEP_RWY_HEADING,
    elevM: GMP_ELEV_M,
    label: "GMP",
    runwayLenM: 2800,
  });
  const arrApt = addVirtualAirport(Cesium, viewer, {
    lat: ARRIVAL_TRANSITION[2].lat,
    lon: ARRIVAL_TRANSITION[2].lon,
    heading: ARR_RWY_HEADING,
    elevM: USN_ELEV_M,
    label: "USN",
    runwayLenM: 2400,
  });
  console.info("[cesium] virtual airports placed", depApt.heading, arrApt.heading);

  const cloudSys = createCesiumCinematicClouds(Cesium, viewer, {
    mobile,
    debug: debug || new URLSearchParams(location.search).has("cloudDebug"),
  });

  /* Geographic autopilot — never written by keyboard */
  const geo = {
    routeProgress: 0,
    latitude: DEPARTURE_TRANSITION[0].lat,
    longitude: DEPARTURE_TRANSITION[0].lon,
    altitudeAMSL: GMP_ELEV_M + 8,
    altitudeAGL: 8,
    terrainHeight: 0,
    heading: DEP_RWY_HEADING,
    pitch: 2,
    roll: 0,
    phase: "departure",
    activeLegIndex: 0,
    activeWaypointFrom: "DEP_THR",
    activeWaypointTo: "DEP_R1",
    quality: "HIGH",
    groundSpeedKt: 0,
    indicatedAirspeedKt: 0,
  };

  /* View offsets only */
  const view = {
    yawOffset: 0,
    pitchOffset: 0,
    _yawTarget: 0,
    _pitchTarget: 0,
  };

  const state = {
    elapsedSeconds: 0,
    normalizedProgress: 0,
    ...geo,
    userYawOffset: 0,
    userPitchOffset: 0,
    userAltitudeOffset: 0,
    routeHeading: DEP_RWY_HEADING,
    _heldAtEnd: false,
    _ready: false,
    totalDistM: path.totalDistM,
    totalDistKm: path.totalDistM / 1000,
    publishedNm: path.totalDistM / 1852,
    _prevAlt: GMP_ELEV_M + 8,
    _prevLat: DEPARTURE_TRANSITION[0].lat,
    _prevLon: DEPARTURE_TRANSITION[0].lon,
    _gsSmooth: 0,
    geo,
    view,
  };

  function waitTilesIdle(maxMs = 5000, needIdle = 3) {
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

  const g0 = DEPARTURE_TRANSITION[0];
  document.body.classList.remove("is-cesium-ready");
  const bootLoadLabel = document.getElementById("bootLoadLabel");
  if (bootLoadLabel) bootLoadLabel.textContent = "TERRAIN";

  /* Preload virtual runway — stay low, look along strip (not into muddy ground) */
  const startHdg = DEP_RWY_HEADING;
  setCam(g0.lon, g0.lat, 900, startHdg, -6);
  await waitTilesIdle(2800, 2);
  setCam(g0.lon, g0.lat, 180, startHdg, -4);
  await waitTilesIdle(3200, 2);
  setCam(g0.lon, g0.lat, GMP_ELEV_M + 12, startHdg, -2);
  await waitTilesIdle(2800, 2);

  state._ready = true;
  const bootJump = Number(new URLSearchParams(location.search).get("flightT") || "");
  if (Number.isFinite(bootJump) && bootJump > 0) {
    state.elapsedSeconds = Math.min(FLIGHT_DURATION_SEC, bootJump);
    console.info(`[cesium] debug flightT=${state.elapsedSeconds}s`);
  }
  document.body.classList.add("is-cesium-ready");
  if (bootLoadLabel) bootLoadLabel.textContent = "READY";
  document.body.classList.add("is-ready");

  let debugEl = null;
  let fpsAccum = 0;
  let fpsFrames = 0;
  let fpsShow = 0;
  if (debug || new URLSearchParams(location.search).has("flightDebug")) {
    debugEl = document.createElement("pre");
    debugEl.id = "flightDebug";
    debugEl.style.cssText =
      "position:fixed;right:8px;bottom:48px;z-index:40;margin:0;padding:8px 10px;font:11px/1.35 ui-monospace,monospace;background:rgba(0,0,0,.55);color:#d7ffe8;border-radius:8px;pointer-events:none;max-width:300px";
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

  /**
   * Keyboard = VIEW ONLY
   * LEFT/RIGHT → yawOffset
   * UP → look up (positive pitch offset)
   * DOWN → look down (negative pitch offset)
   * Never touches lat/lon/route/autopilot altitude/heading
   */
  function applyUserView(keys, dt) {
    const yawMax = 9;
    const pitchUp = 12;
    const pitchDn = -16;
    if (keys?.left) view._yawTarget = Math.min(yawMax, view._yawTarget + dt * 24);
    else if (keys?.right) view._yawTarget = Math.max(-yawMax, view._yawTarget - dt * 24);
    else view._yawTarget += (0 - view._yawTarget) * Math.min(1, dt * 3.4);

    if (keys?.up) view._pitchTarget = Math.min(pitchUp, view._pitchTarget + dt * 28);
    else if (keys?.down) view._pitchTarget = Math.max(pitchDn, view._pitchTarget - dt * 32);
    else view._pitchTarget += (0 - view._pitchTarget) * Math.min(1, dt * 3.0);

    view.yawOffset += (view._yawTarget - view.yawOffset) * Math.min(1, dt * 5);
    view.pitchOffset += (view._pitchTarget - view.pitchOffset) * Math.min(1, dt * 5);
    state.userYawOffset = view.yawOffset;
    state.userPitchOffset = view.pitchOffset;
  }

  let lastHeading = DEP_RWY_HEADING;
  let lastWall = performance.now();
  let lastQuality = "HIGH";

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
    let step = (now - lastWall) / 1000;
    lastWall = now;
    if (!Number.isFinite(step) || step < 0) step = dt;
    step = Math.min(0.25, Math.max(dt, step));

    fpsAccum += step;
    fpsFrames += 1;
    if (fpsAccum >= 0.5) {
      fpsShow = Math.round(fpsFrames / fpsAccum);
      fpsAccum = 0;
      fpsFrames = 0;
    }

    if (!state._heldAtEnd) {
      state.elapsedSeconds = Math.min(FLIGHT_DURATION_SEC, state.elapsedSeconds + step);
    }
    if (state.elapsedSeconds >= FLIGHT_DURATION_SEC - 0.05) {
      state._heldAtEnd = true;
      state.elapsedSeconds = FLIGHT_DURATION_SEC;
    }

    const elapsed = state.elapsedSeconds;
    state.normalizedProgress = elapsed / FLIGHT_DURATION_SEC;
    geo.phase = phaseFromTime(elapsed);
    geo.quality = qualityPhase(elapsed);
    state.phase = geo.phase;

    applyUserView(keys, step);

    const routeU = getCinematicRouteProgress(elapsed);
    geo.routeProgress = routeU;
    state.normalizedProgress = routeU;
    const distM = timeToDistanceProgress(elapsed, FLIGHT_DURATION_SEC, path.totalDistM);
    const sample = samplePathByDistance(path, distM);
    geo.latitude = sample.lat;
    geo.longitude = sample.lon;
    geo.activeLegIndex = sample.legIndex;
    geo.activeWaypointFrom = sample.fromId;
    geo.activeWaypointTo = sample.toId;
    state.latitude = geo.latitude;
    state.longitude = geo.longitude;
    state.activeLegIndex = geo.activeLegIndex;
    state.activeWaypointFrom = geo.activeWaypointFrom;
    state.activeWaypointTo = geo.activeWaypointTo;

    const lookM = lookAheadMeters(geo.phase);
    const ahead = sampleAhead(path, distM, lookM);
    let trackHdg = bearingDeg(sample.lat, sample.lon, ahead.lat, ahead.lon);
    const movedProbe = haversineM(state._prevLat, state._prevLon, sample.lat, sample.lon);
    if (movedProbe > 1.5) {
      trackHdg = bearingDeg(state._prevLat, state._prevLon, sample.lat, sample.lon);
    }
    const onArrLeg = String(sample.fromId || "").startsWith("ARR_");
    let hdg = trackHdg;
    if (elapsed < 28) {
      hdg = DEP_RWY_HEADING;
    } else if (onArrLeg || distM >= path.totalDistM - 80) {
      hdg = ARR_RWY_HEADING;
      /* Hard snap — no catch-up crab while moving 176° */
      if (!state._arrHdgLocked) {
        lastHeading = ARR_RWY_HEADING;
        state._arrHdgLocked = true;
        /* Swallow handoff teleport so GS/smear doesn't spike one frame */
        state._prevLat = sample.lat;
        state._prevLon = sample.lon;
      }
    } else {
      state._arrHdgLocked = false;
      const softAhead = sampleAhead(path, distM, Math.max(lookM, 12000));
      hdg = bearingDeg(sample.lat, sample.lon, softAhead.lat, softAhead.lon);
    }
    let dh = ((hdg - lastHeading + 540) % 360) - 180;
    if (state._arrHdgLocked) {
      lastHeading = ARR_RWY_HEADING;
      dh = 0;
    } else {
      const maxDegPerSec = elapsed < 40 ? 2.2 : elapsed >= 70 ? 20 : 5;
      const cappedDt = Math.min(step, 0.08);
      const maxStep = maxDegPerSec * cappedDt;
      if (dh > maxStep) dh = maxStep;
      if (dh < -maxStep) dh = -maxStep;
      const blend = 1 - Math.exp(-cappedDt * (elapsed >= 70 ? 4 : 1.2));
      lastHeading = (lastHeading + dh * blend + 360) % 360;
    }
    geo.heading = lastHeading;
    state.routeHeading = lastHeading;
    state.heading = lastHeading;

    /* Ground speed from geographic motion; IAS from phase envelope */
    const movedM = haversineM(state._prevLat, state._prevLon, sample.lat, sample.lon);
    state._prevLat = sample.lat;
    state._prevLon = sample.lon;
    const gsInst = step > 1e-4 ? (movedM / step) * 1.94384 : 0;
    state._gsSmooth += (gsInst - state._gsSmooth) * Math.min(1, step * 2.2);
    geo.groundSpeedKt = Math.max(0, state._gsSmooth);
    let iasTarget = 145;
    if (geo.phase === "departure") iasTarget = elapsed < 8 ? 80 + elapsed * 12 : 175;
    else if (geo.phase === "climb") iasTarget = 250;
    else if (geo.phase === "cruise") iasTarget = 445;
    else if (geo.phase === "descent") iasTarget = 290;
    else if (geo.phase === "approach") {
      if (elapsed >= 107) iasTarget = 40;
      else if (elapsed >= 105) iasTarget = 95;
      else if (elapsed > 100) iasTarget = 130;
      else iasTarget = 160;
    }
    geo.indicatedAirspeedKt =
      (geo.indicatedAirspeedKt || iasTarget) + (iasTarget - (geo.indicatedAirspeedKt || iasTarget)) * Math.min(1, step * 1.4);
    state.groundSpeedKt = geo.groundSpeedKt;
    state.indicatedAirspeedKt = geo.indicatedAirspeedKt;

    const autoAlt = altitudeAtElapsed(elapsed);
    const terrainH = terrainAtCached(sample.lat, sample.lon);
    geo.terrainHeight = terrainH;
    state.terrainHeight = terrainH;
    /* Plant on deck only after flare — keep clear of hills until then */
    const onGround =
      elapsed >= 107 ||
      state._heldAtEnd ||
      (elapsed >= 106.2 && autoAlt <= USN_ELEV_M + 8);
    let minClear =
      geo.phase === "departure" ? 8 : geo.phase === "approach" ? 40 : geo.phase === "cruise" ? 400 : 120;
    if (elapsed > 96) minClear = 28;
    if (elapsed > 100) minClear = 18;
    if (elapsed > 104) minClear = 10;
    if (elapsed > 106) minClear = 6;
    let targetAlt = onGround
      ? Math.max(USN_ELEV_M + 5, terrainH + 5)
      : Math.max(autoAlt, terrainH + minClear);
    /* Cap vertical rate so Cesium doesn't slam into terrain tiles */
    const prevAlt = state._prevAlt ?? targetAlt;
    const maxSink = onGround ? 8 : elapsed > 100 ? 22 : elapsed > 90 ? 28 : 60;
    const maxClimb = 40;
    const dAlt = targetAlt - prevAlt;
    const maxDown = -maxSink * Math.max(step, 1e-3);
    const maxUp = maxClimb * Math.max(step, 1e-3);
    geo.altitudeAMSL = prevAlt + Math.max(maxDown, Math.min(maxUp, dAlt));
    if (onGround) geo.altitudeAMSL = Math.max(USN_ELEV_M + 5, terrainH + 5);
    geo.altitudeAGL = geo.altitudeAMSL - terrainH;
    state.altitudeAMSL = geo.altitudeAMSL;
    state.altitudeAGL = geo.altitudeAGL;

    const altRate = (geo.altitudeAMSL - prevAlt) / Math.max(step, 1e-3);
    state._prevAlt = geo.altitudeAMSL;
    if (onGround) {
      geo.pitch = 0;
    } else {
      geo.pitch = autopilotPitchDeg(geo.phase, altRate, elapsed);
    }
    state.pitch = geo.pitch;
    if (onArrLeg || onGround) {
      geo.roll = 0;
    } else {
      const turnRate = dh / Math.max(Math.min(step, 0.08), 1e-3);
      geo.roll = Math.max(-4, Math.min(4, -turnRate * 0.04));
    }
    state.roll = geo.roll;

    if (geo.quality !== lastQuality) {
      applyQuality(geo.quality, mobile, viewer);
      lastQuality = geo.quality;
    }

    try {
      cloudSys.update(step, geo);
    } catch (e) {
      console.warn("[clouds] update", e);
    }

    /* Look ahead on final — keep horizon, never dive into dirt */
    const camH = Math.max(geo.altitudeAMSL, (geo.terrainHeight || 0) + (onGround ? 5 : 8));
    let horizonBias = -4.8;
    if (onGround) {
      horizonBias = -3.2;
    } else if (geo.phase === "departure" && elapsed < 8) {
      horizonBias = -5.0;
    } else if (geo.phase === "climb" || geo.phase === "cruise") {
      horizonBias = -4.4;
    } else if (geo.phase === "descent") {
      horizonBias = -4.5;
    } else if (geo.phase === "approach") {
      horizonBias = elapsed > 104 ? -3.6 : -4.0;
    }
    if (state._horizonBias == null) state._horizonBias = horizonBias;
    state._horizonBias += (horizonBias - state._horizonBias) * Math.min(1, step * 2.2);

    const renderHeading = (geo.heading + view.yawOffset + 360) % 360;
    const renderPitch = state._horizonBias + view.pitchOffset;
    const renderRoll = onArrLeg || onGround ? 0 : geo.roll;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(geo.longitude, geo.latitude, camH),
      orientation: {
        heading: Cesium.Math.toRadians(renderHeading),
        pitch: Cesium.Math.toRadians(renderPitch),
        roll: Cesium.Math.toRadians(renderRoll),
      },
    });

    /* soft look-ahead preload */
    try {
      const pre = sampleAhead(path, distM, Math.max(lookM, 10000));
      if ((Math.floor(elapsed * 2) % 7) === 0) {
        viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(pre.lon, pre.lat));
      }
    } catch (_) {}

    if (debugEl) {
      debugEl.textContent = [
        `PHASE ${geo.phase.toUpperCase()}  Q ${geo.quality}`,
        `LEG ${geo.activeWaypointFrom} → ${geo.activeWaypointTo}`,
        `T ${elapsed.toFixed(1)}s / ${FLIGHT_DURATION_SEC}s`,
        `ROUTE ${(routeU * 100).toFixed(1)}%`,
        `LAT ${geo.latitude.toFixed(4)}  LON ${geo.longitude.toFixed(4)}`,
        `ALT ${Math.round(geo.altitudeAMSL)} m  AGL ${Math.round(geo.altitudeAGL)} m`,
        `HDG ${geo.heading.toFixed(0)}°  IAS ${Math.round(geo.indicatedAirspeedKt)}  GS ${Math.round(geo.groundSpeedKt)}`,
        `VIEW yaw ${view.yawOffset.toFixed(1)}°  pitch ${view.pitchOffset.toFixed(1)}°`,
        `FPS ${fpsShow}  DIST ${(path.totalDistM / 1000).toFixed(1)} km`,
      ].join("\n");
    }

    return state;
  }

  function seek(seconds) {
    const t = Math.max(0, Math.min(FLIGHT_DURATION_SEC, Number(seconds) || 0));
    state.elapsedSeconds = t;
    state._heldAtEnd = t >= FLIGHT_DURATION_SEC - 0.05;
    if (state._heldAtEnd) state.elapsedSeconds = FLIGHT_DURATION_SEC;
    state._arrHdgLocked = false;
    state._horizonBias = null;
    /* Reset motion probes so seek doesn't invent sideways GS */
    const distM = timeToDistanceProgress(state.elapsedSeconds, FLIGHT_DURATION_SEC, path.totalDistM);
    const sample = samplePathByDistance(path, distM);
    state._prevLat = sample.lat;
    state._prevLon = sample.lon;
    state._prevAlt = altitudeAtElapsed(state.elapsedSeconds);
    state._gsSmooth = 0;
    const onArr = String(sample.fromId || "").startsWith("ARR_");
    lastHeading = onArr || t >= 73 ? ARR_RWY_HEADING : t < 28 ? DEP_RWY_HEADING : lastHeading;
    console.info(`[cesium] seek t=${state.elapsedSeconds.toFixed(1)}s`);
    return state.elapsedSeconds;
  }

  function seekNormalized(u) {
    return seek(Math.max(0, Math.min(1, Number(u) || 0)) * FLIGHT_DURATION_SEC);
  }

  function resize() {
    viewer.resize();
    applyQuality(lastQuality, isMobile(), viewer);
  }
  window.addEventListener("resize", resize);

  return {
    viewer,
    state,
    path,
    tick,
    seek,
    seekNormalized,
    resize,
    clouds: cloudSys,
    FLIGHT_DURATION_SEC,
    DEPARTURE_TRANSITION,
    ARRIVAL_TRANSITION,
  };
}

function applyQuality(q, mobile, viewer) {
  if (mobile) {
    if (q === "HIGH") {
      viewer.resolutionScale = 0.8;
      viewer.scene.globe.maximumScreenSpaceError = 1.6;
    } else if (q === "MEDIUM") {
      viewer.resolutionScale = 0.7;
      viewer.scene.globe.maximumScreenSpaceError = 2.2;
    } else {
      viewer.resolutionScale = 0.6;
      viewer.scene.globe.maximumScreenSpaceError = 3.2;
    }
    return;
  }
  if (q === "HIGH") {
    viewer.resolutionScale = 1;
    viewer.scene.globe.maximumScreenSpaceError = 0.85;
  } else if (q === "MEDIUM") {
    viewer.resolutionScale = 0.9;
    viewer.scene.globe.maximumScreenSpaceError = 1.4;
  } else {
    viewer.resolutionScale = 0.72;
    viewer.scene.globe.maximumScreenSpaceError = 2.6;
  }
}
