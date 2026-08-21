/**
 * Soft cumulus field along the flight corridor (Cesium CloudCollection).
 * Falls back to billboard sprites if CloudCollection is unavailable.
 */
import { samplePathByDistance } from "./gmp-usn-route.js";

function hash01(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function seedFlightClouds(Cesium, viewer, path, { mobile = false } = {}) {
  const count = mobile ? 48 : 110;
  const fog = viewer.scene.fog;
  if (fog) {
    fog.enabled = true;
    fog.density = 0.00022;
  }
  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.hueShift = -0.02;
    viewer.scene.skyAtmosphere.saturationShift = -0.08;
    viewer.scene.skyAtmosphere.brightnessShift = 0.04;
  }

  if (typeof Cesium.CloudCollection === "function") {
    const clouds = viewer.scene.primitives.add(
      new Cesium.CloudCollection({
        noiseDetail: 16.0,
        noiseOffset: Cesium.Cartesian3.ZERO,
      })
    );

    for (let i = 0; i < count; i++) {
      const u = (i + 0.15) / count;
      const s = samplePathByDistance(path, u * path.totalDistM);
      const side = (hash01(i) - 0.5) * (mobile ? 14000 : 22000);
      const ahead = (hash01(i + 3) - 0.5) * 4000;
      const brg = (s.lon * 0 + 90) * (Math.PI / 180); /* lateral in meters ≈ lon */
      const latOff = (side * Math.cos(brg) + ahead * Math.sin(brg)) / 111320;
      const lonOff =
        (side * Math.sin(brg) - ahead * Math.cos(brg)) / (111320 * Math.cos((s.lat * Math.PI) / 180));
      const band = u < 0.12 || u > 0.88 ? 900 + hash01(i + 1) * 1100 : 1800 + hash01(i + 2) * 3200;
      const alt = band + hash01(i + 5) * 800;
      const sx = 900 + hash01(i + 7) * 2800;
      const sy = 380 + hash01(i + 9) * 900;
      clouds.add({
        position: Cesium.Cartesian3.fromDegrees(s.lon + lonOff, s.lat + latOff, alt),
        scale: new Cesium.Cartesian2(sx, sy),
        maximumSize: new Cesium.Cartesian3(50, 18, 28),
        slice: 0.25 + hash01(i + 11) * 0.45,
        brightness: 0.88 + hash01(i + 13) * 0.18,
      });
    }
    console.info(`[cesium] CloudCollection n=${count}`);
    return clouds;
  }

  /* Billboard fallback using existing sky photo */
  const n = mobile ? 24 : 48;
  const entities = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.2) / n;
    const s = samplePathByDistance(path, u * path.totalDistM);
    const side = (hash01(i) - 0.5) * 16000;
    const latOff = side / 111320;
    const lonOff = ((hash01(i + 2) - 0.5) * 8000) / (111320 * Math.cos((s.lat * Math.PI) / 180));
    const alt = 1200 + hash01(i + 4) * 2500;
    entities.push(
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(s.lon + lonOff, s.lat + latOff, alt),
        billboard: {
          image: "assets/sky/clouds-drama.jpg",
          width: 420 + hash01(i + 6) * 380,
          height: 160 + hash01(i + 8) * 120,
          color: Cesium.Color.WHITE.withAlpha(0.45 + hash01(i + 10) * 0.25),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
        },
      })
    );
  }
  console.info(`[cesium] cloud billboards n=${n}`);
  return entities;
}
