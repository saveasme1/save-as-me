/**
 * Three.js towering-cumulus mesh-cluster (CK42BB mesh-cluster path adapted).
 * World-space group (NOT under cameraRig) so look L/R/U/D only changes view, not attachment.
 * Atmospheric time drives slow approach — never routeProgress / compressed GS.
 *
 * WebGPU raymarch (Farazz / three.js webgpu_volume_cloud) intentionally OFF:
 * Cesium Viewer + Three WebGLRenderer already own the GL context; a second WebGPU
 * renderer would break the transparent cockpit stack.
 */
import * as THREE from "three";
import { CLOUD_CONFIG, resolveCloudQuality } from "./cloud-config.js";

const SOFT_TEX = "assets/sky/soft-cloud.png";

function hash01(i, salt = 1) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function phaseDensity(phase) {
  return CLOUD_CONFIG.density[phase] ?? 0.5;
}

/**
 * Visual meters → Three units (cockpit is ~meters; compress far atmosphere for precision).
 * 1 visual km ≈ 18 scene units → 20–48 km reads as distant bulk without ECEF float issues.
 */
const M_TO_SCENE = 18 / 1000;

/**
 * @param {THREE.Scene} scene
 * @param {{ mobile?: boolean, debug?: boolean }} opts
 */
export function createThreeCinematicClouds(scene, { mobile = false, debug = false } = {}) {
  const quality = resolveCloudQuality(CLOUD_CONFIG.qualityMode, mobile);
  const root = new THREE.Group();
  root.name = "cinematicCloudRoot";
  scene.add(root);

  const sun = new THREE.DirectionalLight(0xfff2d6, 1.15);
  sun.position.set(40, 80, -30);
  root.add(sun);
  root.add(new THREE.AmbientLight(0xb8c8e0, 0.35));

  const loader = new THREE.TextureLoader();
  const formations = [];
  const puffsPer =
    quality === "low" ? 5 : quality === "medium" ? 8 : mobile ? 6 : CLOUD_CONFIG.puffsPerFormation.desktop;
  const heroN = quality === "low" ? 2 : CLOUD_CONFIG.maxHeroFormations;

  let sharedMap = null;
  let ready = false;

  loader.load(SOFT_TEX, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    sharedMap = tex;
    for (let f = 0; f < heroN; f++) {
      const g = new THREE.Group();
      root.add(g);
      const forwardKm =
        CLOUD_CONFIG.minDistanceM / 1000 +
        hash01(f, 2) * ((CLOUD_CONFIG.maxDistanceM - CLOUD_CONFIG.minDistanceM) / 1000);
      const rightKm = (hash01(f, 3) - 0.5) * 22;
      const baseY = 28 + hash01(f, 4) * 55;
      const sprites = [];

      for (let i = 0; i < puffsPer; i++) {
        const mat = new THREE.SpriteMaterial({
          map: tex,
          color: new THREE.Color().setHSL(0.06, 0.04, 0.94 - hash01(i, 5) * 0.1),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          depthTest: true,
          toneMapped: true,
          fog: false,
        });
        const s = new THREE.Sprite(mat);
        /* Towering lobes — flat-ish base, cauliflower top (cumulus profile) */
        const w = (140 + hash01(i, 6) * 220) * (quality === "low" ? 0.7 : 1);
        const h = w * (0.5 + hash01(i, 7) * 0.4);
        s.scale.set(w, h, 1);
        s.position.set(
          (hash01(i, 8) - 0.5) * w * 0.55,
          (i / puffsPer) * h * 0.75 + hash01(i, 9) * 12,
          (hash01(i, 10) - 0.5) * w * 0.28
        );
        s.renderOrder = 1;
        g.add(s);
        sprites.push({
          sprite: s,
          baseOpacity: 0.62 + hash01(i, 11) * 0.28,
          baseGray: 0.78 + hash01(i, 12) * 0.16,
        });
      }

      formations.push({
        group: g,
        sprites,
        forwardKm,
        homeForwardKm: forwardKm,
        rightKm,
        baseY,
        fade: 0,
        approachBias: 0.25 + hash01(f, 13) * 0.5,
      });
      /* Place initially far — 1 km ≈ 22 scene units */
      g.position.set(rightKm * 22, baseY, -forwardKm * 22);
    }
    ready = true;
    console.info(
      `[clouds-three] mesh-cluster ready q=${quality} formations=${heroN} puffs=${heroN * puffsPer}`
    );
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
    rendererType: "three-mesh-cluster",
    quality,
    formationCount: heroN,
    puffCount: heroN * puffsPer,
    avgDistanceKm: 0,
    density: 0,
    atmTime: 0,
  };

  /**
   * @param {number} dt
   * @param {string} phase
   */
  function update(dt, phase = "cruise") {
    if (!ready || !CLOUD_CONFIG.enabled) return stats;
    const step = Math.min(0.05, Math.max(0, dt));
    atmTime += step * CLOUD_CONFIG.atmTimeScale;
    const dens = phaseDensity(phase);
    stats.density = dens;
    stats.atmTime = atmTime;

    let distSum = 0;
    for (let fi = 0; fi < formations.length; fi++) {
      const form = formations[fi];
      const want = dens * (fi === 0 ? 1 : fi === 1 ? 0.88 : 0.72);
      if (atmTime < 0.8) form.fade = want;
      else form.fade += (want - form.fade) * Math.min(1, step * 0.55);

      if (phase === "climb" || phase === "cruise") {
        const approachKm = (CLOUD_CONFIG.cinematicApproachMps * step * form.approachBias * dens) / 1000;
        form.forwardKm = Math.max(CLOUD_CONFIG.minDistanceM / 1000 - 2, form.forwardKm - approachKm * 0.35);
      } else if (phase === "departure" || phase === "approach") {
        form.forwardKm += (form.homeForwardKm - form.forwardKm) * Math.min(1, step * 0.12);
      }

      /* Slow lateral wind drift (atm), not route-tied */
      const windR = Math.sin(atmTime * 0.03 + fi) * 0.15;
      const z = -form.forwardKm * 22;
      const x = form.rightKm * 22 + windR * atmTime * 0.4;
      form.group.position.x += (x - form.group.position.x) * Math.min(1, step * 0.8);
      form.group.position.y += (form.baseY - form.group.position.y) * Math.min(1, step);
      form.group.position.z += (z - form.group.position.z) * Math.min(1, step * 0.8);

      /* Soft sunlit top / greyer lower puff */
      for (const p of form.sprites) {
        const yNorm = Math.max(0, Math.min(1, p.sprite.position.y / 80));
        const lit = 0.86 + yNorm * 0.12;
        p.sprite.material.color.setRGB(lit, lit * 0.99, lit * 0.96);
        const distFade = Math.min(1, Math.max(0.5, 1 - (form.forwardKm - 16) / 45));
        const op = p.baseOpacity * form.fade * distFade;
        p.sprite.material.opacity += (op - p.sprite.material.opacity) * Math.min(1, step * 1.5);
      }
      distSum += form.forwardKm;
    }
    stats.avgDistanceKm = formations.length ? distSum / formations.length : 0;

    if (debugEl) {
      debugEl.textContent = [
        `CLOUDS ${stats.rendererType}`,
        `Q ${stats.quality}  dens ${stats.density.toFixed(2)}`,
        `formations ${stats.formationCount}  puffs ${stats.puffCount}`,
        `avgDist ${stats.avgDistanceKm.toFixed(1)} km`,
        `atmT ${stats.atmTime.toFixed(1)}s  phase ${phase}`,
        `WebGPU volumetric: off (WebGL stack)`,
        `tex ${sharedMap ? "soft-cloud.png" : "loading"}`,
      ].join("\n");
    }
    return stats;
  }

  return { root, update, stats, quality, rendererType: stats.rendererType };
}
