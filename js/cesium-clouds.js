/**
 * Soft, large cloud sheets the aircraft drifts through — not tiny bird-dots.
 * Prefer translucent photo billboards (sizeInMeters) + a few oversized cumulus.
 */
import { samplePathByDistance } from "./gmp-usn-route.js";

function hash01(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const TEX = ["assets/sky/clouds-drama.jpg", "assets/sky/clouds-front.jpg", "assets/sky/sky-clouds.jpg"];

/**
 * Place wide soft layers along the corridor at altitudes the flight intersects.
 */
export function seedFlightClouds(Cesium, viewer, path, { mobile = false } = {}) {
  const fog = viewer.scene.fog;
  if (fog) {
    fog.enabled = true;
    fog.density = 0.00028;
  }
  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.hueShift = -0.03;
    viewer.scene.skyAtmosphere.saturationShift = -0.1;
    viewer.scene.skyAtmosphere.brightnessShift = 0.06;
  }

  const sheets = mobile ? 22 : 38;
  const entities = [];

  for (let i = 0; i < sheets; i++) {
    const u = (i + 0.08) / sheets;
    const s = samplePathByDistance(path, u * path.totalDistM);
    const sideKm = (hash01(i) - 0.5) * (mobile ? 18 : 28);
    const latOff = sideKm / 111.32;
    const lonOff = ((hash01(i + 2) - 0.5) * 10) / (111.32 * Math.cos((s.lat * Math.PI) / 180));

    /* Three soft bands: under-path, through-path, over-path */
    const bandPick = i % 3;
    let alt;
    if (bandPick === 0) alt = 1400 + hash01(i + 4) * 1200; /* climb / early */
    else if (bandPick === 1) alt = 3800 + hash01(i + 5) * 2200; /* cruise through */
    else alt = 6200 + hash01(i + 6) * 1800; /* above / look-up */

    const wM = 12000 + hash01(i + 7) * 18000; /* 12–30 km wide */
    const hM = 2800 + hash01(i + 8) * 4200;
    const alpha = 0.22 + hash01(i + 9) * 0.28; /* soft wash */

    entities.push(
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(s.lon + lonOff, s.lat + latOff, alt),
        billboard: {
          image: TEX[i % TEX.length],
          width: wM,
          height: hM,
          sizeInMeters: true,
          color: Cesium.Color.WHITE.withAlpha(alpha),
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          heightReference: Cesium.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          alignedAxis: Cesium.Cartesian3.ZERO,
        },
      })
    );
  }

  /* A few huge cumulus volumes if available — still large, not sparrows */
  if (typeof Cesium.CloudCollection === "function") {
    const clouds = viewer.scene.primitives.add(
      new Cesium.CloudCollection({
        noiseDetail: 12.0,
        noiseOffset: Cesium.Cartesian3.ZERO,
      })
    );
    const n = mobile ? 10 : 18;
    for (let i = 0; i < n; i++) {
      const u = 0.08 + (0.84 * (i + 0.5)) / n;
      const s = samplePathByDistance(path, u * path.totalDistM);
      const side = (hash01(i + 40) - 0.5) * 12000;
      const latOff = side / 111320;
      const lonOff = ((hash01(i + 41) - 0.5) * 6000) / (111320 * Math.cos((s.lat * Math.PI) / 180));
      const alt = 2500 + hash01(i + 42) * 3500;
      const sx = 6000 + hash01(i + 43) * 10000;
      const sy = 2200 + hash01(i + 44) * 3500;
      clouds.add({
        position: Cesium.Cartesian3.fromDegrees(s.lon + lonOff, s.lat + latOff, alt),
        scale: new Cesium.Cartesian2(sx, sy),
        maximumSize: new Cesium.Cartesian3(55, 22, 32),
        slice: 0.35 + hash01(i + 45) * 0.35,
        brightness: 0.92,
      });
    }
    console.info(`[cesium] soft cloud sheets=${sheets} cumulus=${n}`);
    return { entities, clouds };
  }

  console.info(`[cesium] soft cloud sheets=${sheets}`);
  return { entities };
}
