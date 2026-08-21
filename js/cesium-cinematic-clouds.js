/**
 * Cesium world-space cumulus — close, large, horizon-banded so they read in the windshield.
 */
import { CLOUD_CONFIG, resolveCloudQuality } from "./cloud-config.js";

function hash01(i, salt = 1) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function destPoint(lat, lon, bearingDeg, distM) {
  const R = 6371000;
  const δ = distM / R;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: (φ2 * 180) / Math.PI, lon: (((λ2 * 180) / Math.PI + 540) % 360) - 180 };
}

function phaseDensity(phase) {
  return CLOUD_CONFIG.density[phase] ?? 0.5;
}

export function createCesiumCinematicClouds(Cesium, viewer, { mobile = false, debug = false } = {}) {
  if (!CLOUD_CONFIG.enabled) {
    return {
      update: () => ({ rendererType: "disabled" }),
      dispose: () => {},
      stats: { rendererType: "disabled" },
    };
  }
  if (typeof Cesium.CloudCollection !== "function") {
    console.warn("[clouds] CloudCollection missing");
    return {
      update: () => ({ rendererType: "unavailable" }),
      dispose: () => {},
      stats: { rendererType: "unavailable" },
    };
  }

  const quality = resolveCloudQuality(CLOUD_CONFIG.qualityMode, mobile);
  const collection = viewer.scene.primitives.add(
    new Cesium.CloudCollection({
      noiseDetail: quality === "high" ? 16.0 : 12.0,
      noiseOffset: Cesium.Cartesian3.ZERO,
    })
  );

  const heroN = Math.min(4, CLOUD_CONFIG.maxHeroFormations);
  const puffsPer = quality === "low" ? 5 : mobile ? 5 : CLOUD_CONFIG.puffsPerFormation.desktop;

  /* Close + large + straddling horizon so windshield actually shows them */
  const layouts = [
    { forwardM: 2800, rightM: -2200, altOffM: -180, bearingBias: -18 },
    { forwardM: 4200, rightM: 2600, altOffM: 120, bearingBias: 14 },
    { forwardM: 6200, rightM: -900, altOffM: 450, bearingBias: -6 },
    { forwardM: 8500, rightM: 1800, altOffM: 900, bearingBias: 8 },
  ].slice(0, heroN);

  const formations = layouts.map((layout, f) => {
    const puffs = [];
    for (let i = 0; i < puffsPer; i++) {
      const w = 520 + hash01(f * 20 + i, 2) * 780;
      const h = 220 + hash01(f * 20 + i, 3) * 320;
      const d = 280 + hash01(f * 20 + i, 4) * 360;
      const cloud = collection.add({
        show: true,
        position: Cesium.Cartesian3.ZERO,
        scale: new Cesium.Cartesian2(w, h),
        maximumSize: new Cesium.Cartesian3(w, h * 0.6, d),
        slice: 0.28 + hash01(i, 5) * 0.35,
        brightness: 1.0,
      });
      puffs.push({
        cloud,
        latOffM: (hash01(i, 6) - 0.5) * w * 1.1,
        lonOffM: (hash01(i, 7) - 0.5) * w * 0.7,
        upM: (i / puffsPer) * h * 0.55 + hash01(i, 8) * 60,
        bright: 0.9 + hash01(i, 9) * 0.1,
      });
    }
    return {
      puffs,
      forwardM: layout.forwardM,
      homeForwardM: layout.forwardM,
      rightM: layout.rightM,
      altOffM: layout.altOffM,
      bearingBias: layout.bearingBias,
      fade: 0.35,
      approachBias: 0.2 + hash01(f, 10) * 0.3,
    };
  });

  let atmTime = 0;
  let debugEl = null;
  if (debug || new URLSearchParams(location.search).has("cloudDebug")) {
    debugEl = document.createElement("pre");
    debugEl.id = "cloudDebug";
    debugEl.style.cssText =
      "position:fixed;left:8px;top:48px;z-index:45;margin:0;padding:8px 10px;font:11px/1.35 ui-monospace,monospace;background:rgba(0,0,0,.55);color:#cfe8ff;border-radius:8px;pointer-events:none;max-width:300px";
    document.body.appendChild(debugEl);
  }

  const stats = {
    rendererType: "cesium-CloudCollection",
    quality,
    formationCount: heroN,
    puffCount: heroN * puffsPer,
    avgDistanceKm: 0,
    density: 0,
    atmTime: 0,
  };

  function update(dt, geo) {
    if (!geo) return stats;
    const step = Math.min(0.05, Math.max(0, dt));
    atmTime += step * (CLOUD_CONFIG.atmTimeScale || 1);
    const dens = phaseDensity(geo.phase);
    stats.density = dens;
    stats.atmTime = atmTime;

    let distSum = 0;
    for (let fi = 0; fi < formations.length; fi++) {
      const form = formations[fi];
      const want = Math.max(0.2, dens) * (fi === 0 ? 1 : fi === 1 ? 0.95 : 0.8);
      form.fade += (want - form.fade) * Math.min(1, step * 0.9);

      if (geo.phase === "climb" || geo.phase === "cruise") {
        const approach = (CLOUD_CONFIG.cinematicApproachMps || 18) * step * form.approachBias * dens;
        form.forwardM = Math.max(2200, form.forwardM - approach);
      } else if (geo.phase === "departure" || geo.phase === "approach") {
        form.forwardM += (form.homeForwardM - form.forwardM) * Math.min(1, step * 0.15);
      }

      const bearing = (geo.heading + form.bearingBias + 360) % 360;
      const rightBearing = (bearing + 90) % 360;
      const windAlong = Math.sin(atmTime * 0.025 + fi) * 50;

      for (const puff of form.puffs) {
        const along = form.forwardM + puff.lonOffM + windAlong;
        const right = form.rightM + puff.latOffM;
        let p = destPoint(geo.latitude, geo.longitude, bearing, Math.max(1800, along));
        p = destPoint(p.lat, p.lon, rightBearing, right);
        /* Keep band near horizon altitude so a sky-framed view still catches them */
        const alt = Math.max(
          400,
          (geo.altitudeAMSL || 500) + form.altOffM + puff.upM - Math.min(800, (geo.altitudeAMSL || 0) * 0.04)
        );
        puff.cloud.position = Cesium.Cartesian3.fromDegrees(p.lon, p.lat, alt);
        puff.cloud.show = form.fade > 0.08;
        puff.cloud.brightness = Math.min(1.0, Math.max(0.35, puff.bright * form.fade));
        distSum += along;
      }
    }
    stats.avgDistanceKm = formations.length ? distSum / (formations.length * puffsPer) / 1000 : 0;

    if (debugEl) {
      debugEl.textContent = [
        `CLOUDS ${stats.rendererType}`,
        `Q ${stats.quality} dens ${stats.density.toFixed(2)}`,
        `formations ${stats.formationCount} puffs ${stats.puffCount}`,
        `avgDist ${stats.avgDistanceKm.toFixed(1)} km`,
        `atmT ${stats.atmTime.toFixed(1)}s phase ${geo.phase}`,
      ].join("\n");
    }
    return stats;
  }

  function dispose() {
    try {
      viewer.scene.primitives.remove(collection);
    } catch (_) {}
    if (debugEl?.parentNode) debugEl.parentNode.removeChild(debugEl);
  }

  console.info(`[clouds] CloudCollection q=${quality} n=${heroN}×${puffsPer}`);
  return { update, dispose, stats, quality, rendererType: stats.rendererType };
}
