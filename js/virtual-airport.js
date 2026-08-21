/**
 * Procedural cinematic airports (no airfield GLB in repo; cockpit-only assets).
 * Places readable runway / lights / terminal so takeoff & landing read as airports
 * even where Bing blurs real RKSS/RKPU.
 */

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

function offsetPoint(lat, lon, bearingDeg, rightM, alongM = 0) {
  const along = alongM ? destPoint(lat, lon, bearingDeg, alongM) : { lat, lon };
  return destPoint(along.lat, along.lon, (bearingDeg + 90) % 360, rightM);
}

/**
 * @param {object} Cesium
 * @param {import('cesium').Viewer} viewer
 * @param {{ lat:number, lon:number, heading:number, elevM?:number, label:string, runwayLenM?:number }} opts
 */
export function addVirtualAirport(Cesium, viewer, opts) {
  const {
    lat,
    lon,
    heading,
    elevM = 20,
    label = "FIELD",
    runwayLenM = 2800,
    widthM = 58,
  } = opts;

  const thr = { lat, lon };
  const end = destPoint(lat, lon, heading, runwayLenM);
  const mid = destPoint(lat, lon, heading, runwayLenM * 0.5);
  const entities = [];

  const asphalt = Cesium.Color.fromCssColorString("#1c1d22").withAlpha(0.92);
  const mark = Cesium.Color.fromCssColorString("#e8e6df").withAlpha(0.95);
  const edge = Cesium.Color.fromCssColorString("#c9a227").withAlpha(0.85);
  const pad = Cesium.Color.fromCssColorString("#2a2c33").withAlpha(0.88);

  /* Main runway strip */
  entities.push(
    viewer.entities.add({
      name: `${label}-rwy`,
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray([thr.lon, thr.lat, end.lon, end.lat]),
        width: widthM,
        material: asphalt,
        clampToGround: true,
        classificationType: Cesium.ClassificationType.TERRAIN,
      },
    })
  );

  /* Edge lines */
  for (const side of [-1, 1]) {
    const a = offsetPoint(thr.lat, thr.lon, heading, side * (widthM * 0.48));
    const b = offsetPoint(end.lat, end.lon, heading, side * (widthM * 0.48));
    entities.push(
      viewer.entities.add({
        corridor: {
          positions: Cesium.Cartesian3.fromDegreesArray([a.lon, a.lat, b.lon, b.lat]),
          width: 1.4,
          material: edge,
          clampToGround: true,
        },
      })
    );
  }

  /* Centerline dashes */
  const dashLen = 28;
  const gap = 42;
  for (let d = 80; d < runwayLenM - 80; d += dashLen + gap) {
    const a = destPoint(thr.lat, thr.lon, heading, d);
    const b = destPoint(thr.lat, thr.lon, heading, d + dashLen);
    entities.push(
      viewer.entities.add({
        corridor: {
          positions: Cesium.Cartesian3.fromDegreesArray([a.lon, a.lat, b.lon, b.lat]),
          width: 1.1,
          material: mark,
          clampToGround: true,
        },
      })
    );
  }

  /* Threshold bars */
  for (let i = 0; i < 6; i++) {
    const along = 12 + i * 9;
    const a = offsetPoint(thr.lat, thr.lon, heading, -widthM * 0.35, along);
    const b = offsetPoint(thr.lat, thr.lon, heading, widthM * 0.35, along);
    entities.push(
      viewer.entities.add({
        corridor: {
          positions: Cesium.Cartesian3.fromDegreesArray([a.lon, a.lat, b.lon, b.lat]),
          width: 2.2,
          material: mark,
          clampToGround: true,
        },
      })
    );
  }

  /* Parallel taxiway */
  const taxA = offsetPoint(thr.lat, thr.lon, heading, widthM * 1.35, 120);
  const taxB = offsetPoint(end.lat, end.lon, heading, widthM * 1.35, -200);
  entities.push(
    viewer.entities.add({
      corridor: {
        positions: Cesium.Cartesian3.fromDegreesArray([taxA.lon, taxA.lat, taxB.lon, taxB.lat]),
        width: 22,
        material: pad,
        clampToGround: true,
      },
    })
  );

  /* Terminal / hangar blocks beside midfield */
  const term = offsetPoint(mid.lat, mid.lon, heading, widthM * 2.4);
  const hang = offsetPoint(mid.lat, mid.lon, heading, -widthM * 2.2, -400);
  for (const [p, w, d, h, color] of [
    [term, 90, 55, 28, "#6b7280"],
    [hang, 70, 45, 18, "#4b5563"],
  ]) {
    entities.push(
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, elevM),
        box: {
          dimensions: new Cesium.Cartesian3(w, d, h),
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.92),
          outline: true,
          outlineColor: Cesium.Color.BLACK.withAlpha(0.35),
        },
        orientation: Cesium.Transforms.headingPitchRollQuaternion(
          Cesium.Cartesian3.fromDegrees(p.lon, p.lat, elevM),
          new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), 0, 0)
        ),
      })
    );
  }

  /* Approach / runway edge lights (PointGraphics) */
  const lightColor = Cesium.Color.fromCssColorString("#ffe08a");
  for (let d = -900; d < runwayLenM + 200; d += 90) {
    if (d < 0) {
      /* approach centerline lights */
      const c = destPoint(thr.lat, thr.lon, heading, d);
      entities.push(
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, elevM + 1.5),
          point: {
            pixelSize: 5,
            color: Cesium.Color.fromCssColorString("#ff6b4a"),
            outlineColor: Cesium.Color.WHITE.withAlpha(0.4),
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        })
      );
      continue;
    }
    for (const side of [-1, 1]) {
      const p = offsetPoint(thr.lat, thr.lon, heading, side * (widthM * 0.52), d);
      entities.push(
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, elevM + 1.2),
          point: {
            pixelSize: 4,
            color: lightColor,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        })
      );
    }
  }

  /* Soft label */
  entities.push(
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(term.lon, term.lat, elevM + 40),
      label: {
        text: label,
        font: "600 13px ui-sans-serif, system-ui, sans-serif",
        fillColor: Cesium.Color.WHITE.withAlpha(0.85),
        outlineColor: Cesium.Color.BLACK.withAlpha(0.6),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        show: true,
      },
    })
  );

  return { entities, thr, end, mid, heading, runwayLenM };
}

/** Destination helper exported for route builders */
export { destPoint };
