/**
 * Distant discrete cumulus — soft impostors only.
 * Priority: never paint a white wash across the windshield.
 * Organic canvas alpha (not a near-opaque soft blob).
 */
import * as THREE from "three";
import { CLOUD_CONFIG, resolveCloudQuality } from "./cloud-config.js";

const KM = 32;

function hash01(i, salt = 1) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function phaseDensity(phase) {
  return CLOUD_CONFIG.density[phase] ?? 0.5;
}

/** Irregular cumulus silhouette with soft edges; peak alpha kept modest */
function makeCumulusTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const lobes = [
    [0.5, 0.55, 0.28],
    [0.32, 0.5, 0.2],
    [0.68, 0.48, 0.22],
    [0.45, 0.38, 0.18],
    [0.58, 0.36, 0.16],
    [0.4, 0.62, 0.14],
  ];
  for (const [ux, uy, ur] of lobes) {
    const g = ctx.createRadialGradient(ux * size, uy * size, 0, ux * size, uy * size, ur * size);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(0.45, "rgba(248,250,252,0.32)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ux * size, uy * size, ur * size, 0, Math.PI * 2);
    ctx.fill();
  }
  /* flatter greyer base */
  const base = ctx.createRadialGradient(0.5 * size, 0.68 * size, 0, 0.5 * size, 0.68 * size, 0.34 * size);
  base.addColorStop(0, "rgba(210,218,228,0.28)");
  base.addColorStop(1, "rgba(210,218,228,0)");
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.ellipse(0.5 * size, 0.7 * size, 0.34 * size, 0.14 * size, 0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * @param {THREE.Scene} scene
 * @param {{ mobile?: boolean, debug?: boolean }} opts
 */
export function createThreeCinematicClouds(scene, { mobile = false, debug = false } = {}) {
  const quality = resolveCloudQuality(CLOUD_CONFIG.qualityMode, mobile);
  const root = new THREE.Group();
  root.name = "cinematicCloudRoot";
  scene.add(root);

  if (!CLOUD_CONFIG.enabled) {
    return {
      root,
      update: () => ({ rendererType: "disabled" }),
      stats: { rendererType: "disabled" },
      quality,
      rendererType: "disabled",
    };
  }

  const tex = makeCumulusTexture();
  const formations = [];
  const puffsPer = quality === "low" ? 3 : 4;
  const heroN = 2; /* only two hero masses — leave sky open */

  const layouts = [
    { forwardKm: 36, rightKm: -14, baseY: 120 },
    { forwardKm: 42, rightKm: 18, baseY: 135 },
  ];

  for (let f = 0; f < heroN; f++) {
    const g = new THREE.Group();
    root.add(g);
    const layout = layouts[f];
    const sprites = [];
    for (let i = 0; i < puffsPer; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        color: new THREE.Color(0xeef3f8),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        fog: false,
        alphaTest: 0.04,
      });
      const s = new THREE.Sprite(mat);
      const w = 14 + hash01(f * 10 + i, 6) * 12;
      const h = w * (0.65 + hash01(i, 7) * 0.25);
      s.scale.set(w, h, 1);
      s.position.set(
        (hash01(i, 8) - 0.5) * 10,
        hash01(i, 9) * 8,
        (hash01(i, 10) - 0.5) * 6
      );
      s.renderOrder = 2;
      g.add(s);
      sprites.push({
        sprite: s,
        baseOpacity: 0.22 + hash01(i, 11) * 0.12,
      });
    }
    formations.push({
      group: g,
      sprites,
      forwardKm: layout.forwardKm,
      homeForwardKm: layout.forwardKm,
      rightKm: layout.rightKm,
      baseY: layout.baseY,
      fade: 0,
      approachBias: 0.12 + hash01(f, 13) * 0.15,
    });
    g.position.set(layout.rightKm * KM, layout.baseY, -layout.forwardKm * KM);
  }

  console.info(`[clouds-three] discrete canvas-cumulus q=${quality} n=${heroN}`);

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
    rendererType: "three-canvas-cumulus",
    quality,
    formationCount: heroN,
    puffCount: heroN * puffsPer,
    avgDistanceKm: 0,
    density: 0,
    atmTime: 0,
  };

  function update(dt, phase = "cruise") {
    const step = Math.min(0.05, Math.max(0, dt));
    atmTime += step;
    const dens = phaseDensity(phase);
    stats.density = dens;
    stats.atmTime = atmTime;

    let distSum = 0;
    for (let fi = 0; fi < formations.length; fi++) {
      const form = formations[fi];
      const want = dens * (fi === 0 ? 0.85 : 0.7);
      form.fade += (want - form.fade) * Math.min(1, step * 0.35);

      if (phase === "climb" || phase === "cruise") {
        form.forwardKm = Math.max(30, form.forwardKm - (0.008 * dens * form.approachBias));
      } else if (phase === "departure" || phase === "approach") {
        form.forwardKm += (form.homeForwardKm - form.forwardKm) * Math.min(1, step * 0.08);
      }

      const wind = Math.sin(atmTime * 0.015 + fi) * 0.05;
      form.group.position.set(
        form.rightKm * KM + wind * atmTime * 0.2,
        form.baseY,
        -form.forwardKm * KM
      );

      for (const p of form.sprites) {
        const op = Math.min(0.38, p.baseOpacity * form.fade);
        p.sprite.material.opacity += (op - p.sprite.material.opacity) * Math.min(1, step);
      }
      distSum += form.forwardKm;
    }
    stats.avgDistanceKm = formations.length ? distSum / formations.length : 0;

    if (debugEl) {
      debugEl.textContent = [
        `CLOUDS ${stats.rendererType}`,
        `Q ${stats.quality} dens ${stats.density.toFixed(2)}`,
        `formations ${stats.formationCount} puffs ${stats.puffCount}`,
        `avgDist ${stats.avgDistanceKm.toFixed(1)} km`,
        `phase ${phase}  (sky must stay mostly open)`,
      ].join("\n");
    }
    return stats;
  }

  return { root, update, stats, quality, rendererType: stats.rendererType };
}
