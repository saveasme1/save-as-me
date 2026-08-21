/**
 * Soft puff clouds for windshield only (pmndrs/drei-style billboard sprites).
 * Texture: https://github.com/pmndrs/drei-assets (cloud.png)
 * — no landscape photo planes, no UV scroll, no left/right mountain wash.
 */
import * as THREE from "three";

const SOFT_CLOUD_URL = "assets/sky/soft-cloud.png";

function hash01(i, salt = 0) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function approach01(elapsed, start, end) {
  if (elapsed <= start) return 0;
  if (elapsed >= end) return 1;
  const x = (elapsed - start) / (end - start || 1);
  return x * x * (3 - 2 * x);
}

/**
 * @param {THREE.Scene} scene
 * @param {{ mobile?: boolean }} opts
 */
export function createWindshieldClouds(scene, { mobile = false } = {}) {
  const group = new THREE.Group();
  group.name = "windshieldSoftClouds";
  scene.add(group);

  const puffs = [];
  const loader = new THREE.TextureLoader();
  let sharedMap = null;

  const count = mobile ? 18 : 36;
  const farZ = -420;
  const nearZ = -70;

  loader.load(SOFT_CLOUD_URL, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    sharedMap = tex;

    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
        fog: false,
      });
      const s = new THREE.Sprite(mat);
      /* Cluster in forward windshield frustum — not full-screen slabs */
      const lane = (hash01(i, 1) - 0.5) * (mobile ? 28 : 42);
      const elev = 6 + hash01(i, 2) * 18;
      const z0 = farZ - hash01(i, 3) * 280;
      const z1 = nearZ - hash01(i, 4) * 40;
      const sc = (mobile ? 18 : 28) + hash01(i, 5) * (mobile ? 36 : 70);
      /* A few oversized distant banks */
      const huge = i % 7 === 0;
      const scaleX = huge ? sc * 2.4 : sc;
      const scaleY = huge ? sc * 0.95 : sc * 0.55;
      s.scale.set(scaleX, scaleY, 1);
      s.position.set(lane, elev, z0);
      s.renderOrder = 2;
      group.add(s);
      puffs.push({
        sprite: s,
        x0: lane,
        y0: elev,
        farZ: z0,
        nearZ: z1,
        baseScaleX: scaleX,
        baseScaleY: scaleY,
        opacity: huge ? 0.22 : 0.16 + hash01(i, 6) * 0.14,
        bob: hash01(i, 7) * Math.PI * 2,
        approachStart: huge ? 16 : 12,
        approachEnd: huge ? 50 : 34,
      });
    }
  });

  return {
    group,
    /**
     * @param {number} dt
     * @param {number} elapsed
     * @param {number} speedNorm 0..~1.3
     */
    update(dt, elapsed, speedNorm = 0.5) {
      if (!sharedMap) return;
      for (const p of puffs) {
        let a = approach01(elapsed, p.approachStart, p.approachEnd);
        if (elapsed > 95) a *= Math.max(0, 1 - (elapsed - 95) / 14);
        const z = p.farZ + (p.nearZ - p.farZ) * a;
        p.sprite.position.z += (z - p.sprite.position.z) * Math.min(1, dt * 0.85);
        /* Gentle vertical bob only — NO lateral mountain scroll */
        p.sprite.position.x = p.x0;
        p.sprite.position.y = p.y0 + Math.sin(elapsed * 0.35 + p.bob) * 1.2 * a;
        const grow = 1 + a * 0.35;
        p.sprite.scale.set(p.baseScaleX * grow, p.baseScaleY * grow, 1);
        const op = p.opacity * a * (0.85 + Math.min(0.25, speedNorm * 0.15));
        p.sprite.material.opacity += (op - p.sprite.material.opacity) * Math.min(1, dt * 1.2);
      }
    },
  };
}
