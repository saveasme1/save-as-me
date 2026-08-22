import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { createCesiumWorld } from "./cesium-world.js?v=bootcinemascale0823f";
import {
  ROUTE_META,
  formatRouteDuration,
  routeLabelShort,
  FLIGHT_DURATION_SEC,
} from "./gmp-usn-route.js?v=bootcinemascale0823f";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = () => window.innerWidth < 980;

const PROJECTS = [
  {
    eye: "PROJECT 01",
    name: "LOCAL",
    title: "오프라인 상품을<br />온라인에서도 팔 수 있게.",
    body: "실제 로컬 매장의 상품을 온라인 판매용 상품으로 다시 기획했습니다. 패키지, 상세페이지, 스마트스토어 구축, 상품 등록, 쿠팡 확장과 기본 운영 교육까지 연결했습니다.",
    tags: ["상품 기획", "패키지", "스마트스토어", "쿠팡", "운영 교육"],
    link: "https://smartstore.naver.com/_mymura",
    linkLabel: "스마트스토어 보기 ↗",
    art: "assets/symbols/01-local.svg",
    demos: null,
    /* Day → night as missions progress (2nd sky era) */
    env: { turbidity: 1.8, elevation: 32, azimuth: 175, rayleigh: 2.2, exposure: 0.72, ground: 0x7f9a6a },
    alt: 4200,
    hdg: 42,
  },
  {
    eye: "PROJECT 02",
    name: "SAVEAS",
    title: "고객이 직접 만들고<br />그대로 주문하도록.",
    body: "사용자가 웹에서 상품에 이미지와 문구를 넣고 직접 디자인한 뒤 바로 주문할 수 있는 커스텀 상품 쇼핑몰을 개발했습니다.",
    tags: ["Web Editor", "POD", "주문 연동", "미리보기"],
    link: "https://save-as.co.kr",
    linkLabel: "save-as.co.kr ↗",
    art: "assets/symbols/02-saveas.svg",
    demos: null,
    env: { turbidity: 1.4, elevation: 40, azimuth: 160, rayleigh: 1.6, exposure: 0.78, ground: 0xa8b89a },
    alt: 9800,
    hdg: 86,
  },
  {
    eye: "PROJECT 03",
    name: "MAKERBRIDGE",
    title: "기존 쇼핑몰에<br />디자인 기능을 더했습니다.",
    body: "카페24 상품 페이지 안에서 고객이 직접 텍스트와 이미지를 편집하고 제작용 데이터를 생성할 수 있는 웹 편집기 앱입니다.",
    tags: ["Cafe24", "TEXT", "IMAGE", "CUTLINE", "FINISHING"],
    link: null,
    art: "assets/symbols/03-makerbridge.svg",
    demos: [
      { id: "text", label: "TEXT", art: "assets/symbols/03-makerbridge.svg" },
      { id: "image", label: "IMAGE", art: "assets/symbols/02-saveas.svg" },
      { id: "cutline", label: "CUTLINE", art: "assets/symbols/03-makerbridge.svg" },
      { id: "align", label: "ALIGN", art: "assets/symbols/03-makerbridge.svg" },
    ],
    env: { turbidity: 1.1, elevation: 52, azimuth: 150, rayleigh: 1.1, exposure: 0.8, ground: 0x6f8fa8 },
    alt: 12400,
    hdg: 112,
  },
  {
    eye: "PROJECT 04",
    name: "CURSOR MOBILE",
    title: "PC 앞이 아니어도<br />개발은 계속됩니다.",
    body: "PC에서 진행하던 Cursor 작업을 모바일로 이어 사용하고, 클라우드 환경을 통해 PC가 꺼진 상황에서도 작업할 수 있도록 확장한 개발 환경입니다.",
    tags: ["Desktop", "Mobile", "Cloud", "Continuity"],
    link: null,
    art: "assets/symbols/04-cursor.svg",
    demos: null,
    env: { turbidity: 4.5, elevation: 12, azimuth: 205, rayleigh: 2.2, exposure: 0.55, ground: 0x5a4a3a },
    alt: 7600,
    hdg: 148,
  },
  {
    eye: "PROJECT 05",
    name: "PWA",
    title: "웹서비스를<br />앱처럼 사용하도록.",
    body: "별도의 앱스토어 설치 없이 홈 화면에 추가하고 앱처럼 사용할 수 있는 PWA 기반 서비스를 개발합니다.",
    tags: ["PWA", "Installable", "Private", "Mobile"],
    link: null,
    art: "assets/symbols/05-pwa.svg",
    demos: null,
    env: { turbidity: 6.5, elevation: 2, azimuth: 220, rayleigh: 0.6, exposure: 0.38, ground: 0x121820 },
    alt: 2800,
    hdg: 186,
  },
];

const state = {
  project: -1,
  yaw: 0,
  pitch: 0,
  roll: 0,
  tYaw: 0,
  tPitch: 0,
  tRoll: 0,
  /* transient attitude only — never writes into route/heading/altitude path */
  motionPitch: 0,
  tMotionPitch: 0,
  speed: 1,
  tSpeed: 1,
  velocity: 0,
  vibe: 0,
  zoom: 0.28,
  tZoom: 0.28,
  zoomSide: 0,
  tZoomSide: 0,
  snapLift: 0,
  lookSnap: "center",
  _sunEl: 34,
  _sunAz: 168,
  _mfdPhase: 0,
  _mfdScreens: [],
  flightT: 0,
  padActive: false,
  pad: { yaw: 0, pitch: 0, zoom: 0 },
  dragging: false,
  dragMoved: false,
};

/** Look clamps: positive pitch = look down (floor). Mobile tighter down limit. */
function lookPitchLimits() {
  if (isMobile()) return { min: -0.2, max: 0.24 };
  return { min: -0.28, max: 0.42 };
}

function lookYawMax() {
  return 0.32;
}

const el = {
  hero: document.getElementById("heroCard"),
  project: document.getElementById("projectCard"),
  system: document.getElementById("systemCard"),
  contact: document.getElementById("contactCard"),
  metaIndex: document.getElementById("metaIndex"),
  metaName: document.getElementById("metaName"),
  gAlt: document.getElementById("gAlt"),
  gSpd: document.getElementById("gSpd"),
  gHdg: document.getElementById("gHdg"),
  gDep: document.getElementById("gDep"),
  gArr: document.getElementById("gArr"),
  gEte: document.getElementById("gEte"),
  gFlightBar: document.getElementById("gFlightBar"),
  gFlightPct: document.getElementById("gFlightPct"),
  pEye: document.getElementById("pEye"),
  pTitle: document.getElementById("pTitle"),
  pBody: document.getElementById("pBody"),
  pTags: document.getElementById("pTags"),
  pLink: document.getElementById("pLink"),
  dImg: document.getElementById("dImg"),
  dLabel: document.getElementById("dLabel"),
  mbSwitches: document.getElementById("mbSwitches"),
  flightUi: document.getElementById("flightUi"),
  clock: document.getElementById("liveClock"),
};

function canvasTex(draw, w = 512, h = 512) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function makePFD() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#010308";
    ctx.fillRect(0, 0, w, h);
    const mid = h * 0.5;
    const skyG = ctx.createLinearGradient(0, 0, 0, mid);
    skyG.addColorStop(0, "#1a4a8a");
    skyG.addColorStop(1, "#5a9fd4");
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, w, mid);
    const gndG = ctx.createLinearGradient(0, mid, 0, h);
    gndG.addColorStop(0, "#8a6238");
    gndG.addColorStop(1, "#3a2818");
    ctx.fillStyle = gndG;
    ctx.fillRect(0, mid, w, h);
    for (let i = -6; i <= 6; i++) {
      if (i === 0) continue;
      const y = mid + i * 22;
      const len = Math.abs(i) % 2 === 0 ? 55 : 28;
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - len, y);
      ctx.lineTo(w * 0.5 + len, y);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "14px monospace";
      ctx.fillText(String(Math.abs(i) * 10), w * 0.5 + len + 6, y + 4);
    }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.22, mid);
    ctx.lineTo(w * 0.78, mid);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(8, 40, 64, h - 80);
    ctx.fillRect(w - 72, 40, 64, h - 80);
    ctx.fillStyle = "#9ef0c4";
    ctx.font = "bold 20px monospace";
    for (let i = 0; i < 9; i++) {
      ctx.fillText(String(280 + i * 10), 18, 70 + i * 42);
      ctx.fillText(String(120 - i * 4), w - 58, 70 + i * 42);
    }
    ctx.fillStyle = "#f0c45a";
    ctx.fillRect(8, mid - 16, 64, 32);
    ctx.fillRect(w - 72, mid - 16, 64, 32);
    ctx.fillStyle = "#111";
    ctx.font = "bold 18px monospace";
    ctx.fillText("312", 22, mid + 6);
    ctx.fillText("FL124", w - 66, mid + 6);
    ctx.strokeStyle = "#f0c45a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - 36, mid);
    ctx.lineTo(w * 0.5 - 10, mid);
    ctx.moveTo(w * 0.5 + 10, mid);
    ctx.lineTo(w * 0.5 + 36, mid);
    ctx.moveTo(w * 0.5, mid - 14);
    ctx.lineTo(w * 0.5, mid + 14);
    ctx.stroke();
    ctx.fillStyle = "#8ab4ff";
    ctx.font = "13px monospace";
    ctx.fillText("ATT  PFD  FD", 90, 28);
    ctx.fillText("AP1  A/THR", 90, h - 20);
  }, 640, 640);
}

function makeND() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#02060c";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.58;
    ctx.strokeStyle = "#1a4a32";
    for (let r = 30; r < 240; r += 30) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let a = 0; a < 360; a += 10) {
      const rad = ((a - 90) * Math.PI) / 180;
      const inner = a % 30 === 0 ? 220 : 232;
      ctx.strokeStyle = a % 30 === 0 ? "#cfcbc4" : "#4a5560";
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * inner, cy + Math.sin(rad) * inner);
      ctx.lineTo(cx + Math.cos(rad) * 245, cy + Math.sin(rad) * 245);
      ctx.stroke();
    }
    ctx.strokeStyle = "#e84ad0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx + 40, cy - 40, cx + 90, cy - 100, cx + 110, cy - 180);
    ctx.stroke();
    ctx.strokeStyle = "#4dff9a";
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 70, cy - 160);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f0c45a";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx - 12, cy + 14);
    ctx.lineTo(cx + 12, cy + 14);
    ctx.fill();
    ctx.fillStyle = "#9ad4de";
    ctx.font = "14px monospace";
    ctx.fillText("ND  ARC  NAV", 18, 28);
    ctx.fillText("WPT  RNG 40", 18, h - 18);
    ctx.fillText("GS 312", w - 90, 28);
  }, 640, 640);
}

function makeEICAS() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#03050a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#8ab4ff";
    ctx.font = "14px monospace";
    ctx.fillText("EICAS  synoptic", 20, 28);
    const rows = [
      ["ENG 1", "N1 88.2", "EGT 612"],
      ["ENG 2", "N1 87.9", "EGT 608"],
      ["HYD", "A 3000", "B 2980"],
      ["ELEC", "AC 115", "DC 28"],
      ["FUEL", "L 6.2T", "R 6.1T"],
      ["CABIN", "ALT 6200", "dP 7.8"],
    ];
    rows.forEach((row, i) => {
      const y = 48 + i * 78;
      ctx.fillStyle = "#101622";
      ctx.fillRect(18, y, w - 36, 66);
      ctx.fillStyle = "#3d9e6f";
      ctx.fillRect(18, y, 6, 66);
      ctx.fillStyle = "#e8e6e1";
      ctx.font = "bold 18px monospace";
      ctx.fillText(row[0], 34, y + 28);
      ctx.fillStyle = "#9ef0c4";
      ctx.font = "15px monospace";
      ctx.fillText(row[1], 34, y + 52);
      ctx.fillText(row[2], 160, y + 52);
      ctx.fillStyle = "#3d9e6f";
      ctx.font = "bold 16px monospace";
      ctx.fillText("NORMAL", w - 130, y + 36);
      ctx.fillStyle = "#1a3040";
      ctx.fillRect(w - 130, y + 44, 90, 8);
      ctx.fillStyle = "#3d9e6f";
      ctx.fillRect(w - 130, y + 44, 70 - i * 4, 8);
    });
  }, 640, 640);
}

function makeOverhead() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#cfc9be";
    ctx.fillRect(0, 0, w, h);
    const sections = ["AIR", "ELEC", "FUEL", "HYD", "ANTI-ICE", "LIGHTS", "APU", "FIRE"];
    sections.forEach((name, si) => {
      const col = si % 4;
      const row = Math.floor(si / 2 / 2);
      const x0 = 12 + col * (w / 4);
      const y0 = 10 + Math.floor(si / 4) * (h / 2 - 20);
      ctx.fillStyle = "#b8b2a6";
      ctx.fillRect(x0, y0, w / 4 - 16, h / 2 - 36);
      ctx.fillStyle = "#5a5853";
      ctx.font = "bold 13px monospace";
      ctx.fillText(name, x0 + 8, y0 + 18);
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const px = x0 + 10 + x * 28;
          const py = y0 + 28 + y * 32;
          ctx.fillStyle = "#2a2e34";
          ctx.fillRect(px, py, 18, 24);
          const lit = (x + y + si) % 5 === 0;
          ctx.fillStyle = lit ? "#3d9e6f" : (x + y) % 7 === 0 ? "#c45a2a" : "#6a7078";
          ctx.beginPath();
          ctx.arc(px + 9, py + 8, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    ctx.fillStyle = "#4a4844";
    ctx.font = "16px monospace";
    ctx.fillText("OVERHEAD  ·  SYS", 16, h - 12);
  }, 1024, 640);
}

function makeFMC() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#1a1d22";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#0a1a12";
    ctx.fillRect(24, 20, w - 48, 90);
    ctx.fillStyle = "#3d9e6f";
    ctx.font = "20px monospace";
    ctx.fillText("SAVEAS / RTE 1", 40, 55);
    ctx.fillText("ACTIVATE >", 40, 85);
    const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    keys.split("").forEach((k, i) => {
      const x = 24 + (i % 10) * 46;
      const y = 130 + Math.floor(i / 10) * 42;
      ctx.fillStyle = "#2a2e34";
      ctx.fillRect(x, y, 40, 34);
      ctx.fillStyle = "#d8d4cb";
      ctx.font = "16px monospace";
      ctx.fillText(k, x + 14, y + 22);
    });
  }, 512, 360);
}

function makePanelNoise() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#e2ddd3";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 16000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.09})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
    }
    for (let i = 0; i < 50; i++) {
      ctx.strokeStyle = `rgba(80,70,55,${0.04 + Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * h);
      ctx.lineTo(w, Math.random() * h);
      ctx.stroke();
    }
  }, 512, 512);
}

function makeBumpMap() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = 100 + Math.random() * 55;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, 256, 256);
}

function makeLeather() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#2e3138";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = `rgba(${30 + Math.random() * 40},${32 + Math.random() * 40},${38 + Math.random() * 40},${0.35})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 1 + Math.random() * 2, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
  }, 256, 256);
}

function makeBrushed() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#b8bbb6";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const a = 0.04 + Math.random() * 0.08;
      ctx.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (Math.random() - 0.5) * 1.5);
      ctx.stroke();
    }
  }, 256, 256);
}

/* ========== renderer / scene ========== */
const mount = document.getElementById("webgl");
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 2 : 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
mount.appendChild(renderer.domElement);
mount.style.background = "transparent";

const scene = new THREE.Scene();
scene.background = null;
scene.fog = null;
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 40000);
camera.position.set(0, 1.15, 1.35);

const cameraRig = new THREE.Group();
cameraRig.add(camera);
scene.add(cameraRig);

const hemi = new THREE.HemisphereLight(0xb8d8ff, 0x8a9a70, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d0, 2.4);
sun.position.set(40, 60, -20);
sun.castShadow = false;
scene.add(sun);
const cabin = new THREE.PointLight(0xfff4e6, 1.35, 12);
cabin.position.set(0, 1.65, 0.45);
scene.add(cabin);
const dashLight = new THREE.SpotLight(0xfff8ef, 1.05, 8, Math.PI / 2.4, 0.5, 1);
dashLight.position.set(0, 2.05, 1.0);
dashLight.target.position.set(0, 0.7, -0.55);
scene.add(dashLight, dashLight.target);
const screenGlow = new THREE.PointLight(0x6ec8ff, 0.45, 4.5);
screenGlow.position.set(0, 0.9, -0.15);
scene.add(screenGlow);
const windowFillL = new THREE.DirectionalLight(0xb8d8ff, 0.55);
windowFillL.position.set(-4, 3, -6);
scene.add(windowFillL);
const windowFillR = new THREE.DirectionalLight(0xffe8c8, 0.4);
windowFillR.position.set(5, 2.5, -4);
scene.add(windowFillR);
const rim = new THREE.PointLight(0xfff0d8, 0.55, 6);
rim.position.set(0, 1.8, -0.9);
scene.add(rim);

/* Fake exterior disabled — Cesium geographic world is the only exterior */
const sky = new Sky();
sky.scale.setScalar(45000);
sky.visible = false;
scene.add(sky);
const skyU = sky.material.uniforms;
skyU.turbidity.value = 1.8;
skyU.rayleigh.value = 2.2;
skyU.mieCoefficient.value = 0.003;
skyU.mieDirectionalG.value = 0.75;
const sunPos = new THREE.Vector3();
function setSun(elDeg, az) {
  const phi = THREE.MathUtils.degToRad(90 - elDeg);
  const theta = THREE.MathUtils.degToRad(az);
  sunPos.setFromSphericalCoords(1, phi, theta);
  skyU.sunPosition.value.copy(sunPos);
  sun.position.copy(sunPos).multiplyScalar(140);
}
setSun(34, 168);
state._skyScroll = 0;

const loader = new THREE.TextureLoader();

const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(4200, 64, 32),
  new THREE.MeshBasicMaterial({
    color: 0x7eb6e8,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
  })
);
skyDome.visible = false;
scene.add(skyDome);
state._skyDome = skyDome;
/* photoreal sky textures intentionally not applied (Cesium atmosphere) */

/* Clouds: Cesium CloudCollection only (see cesium-cinematic-clouds.js) — no Three windshield sprites */
const cloudLayers = [];
const cloudGroup = new THREE.Group();
cloudGroup.visible = false;
scene.add(cloudGroup);
const clouds = [];

/* Old OSM strip terrain removed — Cesium World Terrain is the exterior */
const terrainGroup = new THREE.Group();
terrainGroup.visible = false;
scene.add(terrainGroup);
state._terrain = null;
state.altLift = 85;

state._routeReady = true;
state.flightHeading = 0;
state.altLift = 85;
state.keys = { left: false, right: false, up: false, down: false };
state._cesium = null;
state._tabVisible = true;

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(2, 8),
  new THREE.MeshBasicMaterial({ visible: false })
);
ground.visible = false;
scene.add(ground);

const cityGroup = new THREE.Group();
cityGroup.visible = false;
scene.add(cityGroup);

const label = document.getElementById("routeLabel");
if (label) label.textContent = `${routeLabelShort()} · CESIUM`;


function makeProjectPreview(project, index, highlight = false) {
  /* square canvas — matches A320 DU black bezels */
  const S = 512;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, highlight ? "#243044" : "#152030");
  g.addColorStop(1, highlight ? "#2e3e55" : "#1c2a3c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = highlight ? "rgba(240,196,90,0.9)" : "rgba(120,160,190,0.4)";
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, S - 16, S - 16);
  ctx.fillStyle = "#f0c45a";
  ctx.font = "600 26px monospace";
  ctx.fillText(`PROJECT ${String(index + 1).padStart(2, "0")}`, 28, 52);
  ctx.fillStyle = "#e8e6e1";
  ctx.font = "700 42px sans-serif";
  ctx.fillText((project.name || "").slice(0, 14), 28, 110);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(24, 140, S - 48, 280);
  ctx.fillStyle = "#cfd8e3";
  ctx.font = "22px sans-serif";
  const plain = project.title.replace(/<br\s*\/?>/gi, " ");
  const words = plain.split(/\s+/);
  let line = "";
  let y = 185;
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > S - 70) {
      ctx.fillText(line, 36, y);
      line = w;
      y += 32;
    } else line = test;
  });
  if (line) ctx.fillText(line, 36, y);
  ctx.fillStyle = "#9ad4de";
  ctx.font = "18px monospace";
  ctx.fillText("TAP · OPEN MISSION", 28, S - 36);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.center.set(0.5, 0.5);
  tex.rotation = -Math.PI / 2;
  return tex;
}

function paintMfdScreens() {
  const screens = state._mfdScreens || [];
  screens.forEach((slot) => {
    if (!slot.mesh?.material) return;
    const projectIndex = slot.liveIndex ?? slot.projectIndex;
    const highlight = state.project === slot.projectIndex;
    const tex = makeProjectPreview(PROJECTS[projectIndex], projectIndex, highlight);
    const prev = slot.mesh.material.map;
    slot.mesh.material.map = tex;
    slot.mesh.material.needsUpdate = true;
    if (prev && prev !== tex) prev.dispose();
  });
}

function tickMfdPop() {
  const screens = state._mfdScreens || [];
  if (!screens.length) return;
  screens.forEach((slot) => {
    if (!slot.mesh) return;
    const want = state.project === slot.projectIndex ? 1 : 0;
    slot.pop = THREE.MathUtils.lerp(slot.pop || 0, want, 0.18);
    const sc = 1 + slot.pop * 0.02;
    slot.mesh.scale.setScalar(sc);
    slot.mesh.visible = true;
    if (slot.mesh.material) {
      slot.mesh.material.depthTest = false;
      slot.mesh.material.depthWrite = false;
      slot.mesh.material.opacity = 1;
      slot.mesh.material.transparent = true;
    }
    slot.mesh.renderOrder = 20;
  });
}

function collectBlackMeshes(root) {
  const black = [];
  root.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some((m) => String(m?.name || "").toLowerCase() === "black")) black.push(o);
  });
  return black;
}

function mfdLookBias() {
  return (isMobile() ? 0.02 : 0.04) - state.zoom * 0.04;
}

function applyViewportFov() {
  const aspect = Math.max(0.35, renderer.domElement.width / Math.max(1, renderer.domElement.height));
  let baseFov = 68;
  if (isMobile()) {
    const targetHFov = 78;
    baseFov = THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(targetHFov * 0.5)) / aspect)
    );
    baseFov = THREE.MathUtils.clamp(baseFov, 78, 108);
  }
  camera.fov = baseFov - state.zoom * 4 + Math.abs(state.yaw) * 1.5;
  camera.updateProjectionMatrix();
}

function syncMfdCamera() {
  applyViewportFov();
  const lookBias = mfdLookBias();
  const base = state._camBase || { x: 0, y: 1.15, z: 1.35 };
  const dolly = (state.zoom - 0.28) * (isMobile() ? 0.38 : 0.45);
  cameraRig.rotation.set(state.pitch + state.motionPitch + lookBias, state.yaw, state.roll);
  camera.position.set(
    base.x + state.zoomSide,
    base.y - state.zoom * 0.03 + (state.snapLift || 0),
    base.z - dolly
  );
  cameraRig.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
}


function assignProjectsLeftToRight(centers) {
  return (centers || [])
    .slice()
    .sort((a, b) => a.px - b.px)
    .slice(0, 5)
    .map((c, i) => ({ ...c, projectIndex: i }));
}

function centersFromSeatNorm(w, h) {
  const norm = state._mfdSeatNorm;
  if (!norm || norm.length !== 5) return null;
  return norm.map((n, i) => ({
    projectIndex: i,
    px: Math.round(n.fx * w),
    py: Math.round(n.fy * h),
    wPx: Math.max(18, Math.round(n.fw * w)),
    hPx: Math.max(18, Math.round(n.fh * h)),
    n: 100,
  }));
}

function measureBlackDuCenters(root, w, h) {
  const black = collectBlackMeshes(root);
  if (!black.length) return [];
  syncMfdCamera();
  root.updateMatrixWorld(true);
  const raycaster = new THREE.Raycaster();
  const hitAt = (px, py) => {
    if (px < 0 || py < 0 || px >= w || py >= h) return false;
    raycaster.setFromCamera(new THREE.Vector2((px / w) * 2 - 1, -((py / h) * 2 - 1)), camera);
    return raycaster.intersectObjects(black, false).length > 0;
  };

  const mobile = isMobile();
  const hits = [];
  const step = mobile ? 2 : 2;
  const y0 = Math.floor(h * (mobile ? 0.48 : 0.62));
  const y1 = Math.floor(h * (mobile ? 0.92 : 0.78));
  const x0 = Math.floor(w * (mobile ? 0.04 : 0.28));
  const x1 = Math.floor(w * (mobile ? 0.96 : 0.72));
  for (let py = y0; py <= y1; py += step) {
    for (let px = x0; px <= x1; px += step) {
      if (hitAt(px, py)) hits.push({ px, py });
    }
  }
  // #region agent log
  fetch("http://127.0.0.1:7719/ingest/981fe459-55aa-4b6a-b93e-29a4ea52759b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "88eb62" },
    body: JSON.stringify({
      sessionId: "88eb62",
      runId: "mo5",
      hypothesisId: "A",
      location: "flight.js:measure",
      message: "scan_hits",
      data: { hits: hits.length, w, h, mobile, y0, y1, x0, x1 },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (hits.length < (mobile ? 12 : 30)) return [];

  const yHist = new Map();
  hits.forEach((hh) => {
    const b = Math.round(hh.py / 4) * 4;
    yHist.set(b, (yHist.get(b) || 0) + 1);
  });
  let modeY = Math.floor(h * 0.685);
  let modeN = 0;
  yHist.forEach((n, y) => {
    if (n > modeN) {
      modeN = n;
      modeY = y;
    }
  });

  /* mobile: contiguous black runs at modeY → exact 5 DU islands */
  if (mobile) {
    const fromRuns = measureByBlackRuns(hitAt, w, h, modeY, x0, x1);
    // #region agent log
    fetch("http://127.0.0.1:7719/ingest/981fe459-55aa-4b6a-b93e-29a4ea52759b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "88eb62" },
      body: JSON.stringify({
        sessionId: "88eb62",
        runId: "mo5",
        hypothesisId: "A",
        location: "flight.js:measure",
        message: "runs_result",
        data: {
          modeY,
          n: fromRuns.length,
          sample: fromRuns.map((c) => ({ i: c.projectIndex, px: c.px, py: c.py, wPx: c.wPx, hPx: c.hPx })),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (fromRuns.length === 5) return assignProjectsLeftToRight(fromRuns);
  }

  const seeds = mobile
    ? [0.22, 0.36, 0.5, 0.64, 0.78]
    : [0.339, 0.406, 0.5, 0.589, 0.656];
  const snapMax = Math.floor(w * (mobile ? 0.1 : 0.05));
  const out = [];
  for (let i = 0; i < seeds.length; i++) {
    let sx = Math.floor(w * seeds[i]);
    let sy = modeY;
    let found = false;
    for (let dx = 0; dx <= snapMax; dx += 2) {
      for (const sdx of dx === 0 ? [0] : [dx, -dx]) {
        const x = sx + sdx;
        for (const dy of [0, 4, -4, 8, -8, 12, -12, 16, -16, 24, -24, 32, -32, 40, -40]) {
          if (hitAt(x, modeY + dy)) {
            sx = x;
            sy = modeY + dy;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (!found) {
      if (mobile) {
        const gap = measureByGapSplit(hits, w, h);
        if (gap.length === 5) return assignProjectsLeftToRight(gap);
      }
      return [];
    }

    const grown = growDuRect(hitAt, w, h, sx, sy, mobile);
    if (!grown) {
      if (mobile) {
        const gap = measureByGapSplit(hits, w, h);
        if (gap.length === 5) return assignProjectsLeftToRight(gap);
      }
      return [];
    }
    out.push({ ...grown, projectIndex: i });
  }
  return assignProjectsLeftToRight(out);
}

function growDuRect(hitAt, w, h, sx, sy, mobile) {
  let minPx = sx;
  let maxPx = sx;
  while (minPx > 8 && hitAt(minPx - 2, sy)) minPx -= 2;
  while (maxPx < w - 8 && hitAt(maxPx + 2, sy)) maxPx += 2;
  const cx = Math.round((minPx + maxPx) / 2);
  let minPy = sy;
  let maxPy = sy;
  while (minPy > 8 && hitAt(cx, minPy - 2)) minPy -= 2;
  while (maxPy < h - 8 && hitAt(cx, maxPy + 2)) maxPy += 2;
  let bw = maxPx - minPx;
  let bh = maxPy - minPy;
  if (bh > bw * 1.4) {
    const mid = (minPy + maxPy) / 2;
    const half = (bw * 1.08) / 2;
    minPy = Math.round(mid - half);
    maxPy = Math.round(mid + half);
    bh = maxPy - minPy;
  }
  const minSide = mobile ? 14 : 24;
  if (bw < minSide || bh < minSide) return null;
  return {
    px: cx,
    py: Math.round((minPy + maxPy) / 2),
    minPx,
    maxPx,
    minPy,
    maxPy,
    wPx: bw,
    hPx: bh,
    n: Math.round((bw * bh) / 4),
  };
}

function measureByBlackRuns(hitAt, w, h, modeY, x0, x1) {
  const tryY = [modeY, modeY - 6, modeY + 6, modeY - 12, modeY + 12, modeY - 20, modeY + 20];
  let best = null;
  let bestScore = -1e9;
  for (const y of tryY) {
    if (y < 8 || y > h - 8) continue;
    const runs = [];
    let start = null;
    for (let px = x0; px <= x1; px += 2) {
      if (hitAt(px, y)) {
        if (start == null) start = px;
      } else if (start != null) {
        runs.push({ min: start, max: px - 2 });
        start = null;
      }
    }
    if (start != null) runs.push({ min: start, max: x1 });
    const dus = runs
      .map((r) => ({ ...r, w: r.max - r.min }))
      .filter((r) => r.w >= Math.max(16, Math.floor(w * 0.022)))
      .sort((a, b) => a.min - b.min);
    if (dus.length < 5) continue;
    /* prefer 5 consecutive runs with similar widths that include screen center */
    for (let i = 0; i <= dus.length - 5; i++) {
      const slice = dus.slice(i, i + 5);
      const widths = slice.map((r) => r.w);
      const mean = widths.reduce((a, b) => a + b, 0) / 5;
      const varW = widths.reduce((a, b) => a + (b - mean) * (b - mean), 0) / 5;
      const mid = (slice[0].min + slice[4].max) / 2;
      const coversCenter = slice[0].min <= w * 0.5 && slice[4].max >= w * 0.5;
      if (!coversCenter) continue;
      /* reward leftmost captain DU near ~22–38% on mobile */
      const leftBias = -Math.abs(slice[0].min / w - 0.18) * 40;
      const score = 500 - varW * 0.02 - Math.abs(mid - w * 0.5) * 0.05 + leftBias + mean * 0.01;
      if (score > bestScore) {
        bestScore = score;
        best = { y, slice };
      }
    }
  }
  if (!best) return [];
  const out = [];
  for (let i = 0; i < 5; i++) {
    const r = best.slice[i];
    const sx = Math.round((r.min + r.max) / 2);
    const grown = growDuRect(hitAt, w, h, sx, best.y, true);
    if (!grown) return [];
    out.push({ ...grown, projectIndex: i });
  }
  return assignProjectsLeftToRight(out);
}

function measureByGapSplit(hits, w, h) {
  const col = new Map();
  hits.forEach((hh) => col.set(hh.px, (col.get(hh.px) || 0) + 1));
  const xs = [...col.keys()].sort((a, b) => a - b);
  if (xs.length < 10) return [];
  const gaps = [];
  for (let i = 1; i < xs.length; i++) gaps.push({ i, d: xs[i] - xs[i - 1] });
  gaps.sort((a, b) => b.d - a.d);
  const cuts = gaps
    .slice(0, 4)
    .map((g) => g.i)
    .sort((a, b) => a - b);
  const ranges = [];
  let start = 0;
  cuts.forEach((cut) => {
    ranges.push(xs.slice(start, cut));
    start = cut;
  });
  ranges.push(xs.slice(start));
  if (ranges.length !== 5 || ranges.some((r) => r.length < 2)) return [];
  return ranges.map((isle, i) => {
    const set = new Set(isle);
    const g = hits.filter((hh) => set.has(hh.px));
    const minPx = Math.min(...g.map((hh) => hh.px));
    const maxPx = Math.max(...g.map((hh) => hh.px));
    const minPy = Math.min(...g.map((hh) => hh.py));
    const maxPy = Math.max(...g.map((hh) => hh.py));
    let px = Math.round((minPx + maxPx) / 2);
    let wPx = Math.max(36, maxPx - minPx);
    if (wPx > w * 0.14) {
      /* merged island — bias center toward outer third for i 0/4 */
      const t = i <= 1 ? 0.28 : i >= 3 ? 0.72 : 0.5;
      px = Math.round(minPx + (maxPx - minPx) * t);
      wPx = Math.max(36, Math.floor((maxPx - minPx) * 0.38));
    }
    return {
      projectIndex: i,
      px,
      py: Math.round((minPy + maxPy) / 2),
      wPx,
      hPx: Math.max(36, maxPy - minPy + 12),
      n: g.length,
    };
  });
}

function findBlackDuCenters(w, h) {
  const mobile = isMobile();
  const expect = mobile
    ? [
        { fx: 0.22, fy: 0.7 },
        { fx: 0.36, fy: 0.7 },
        { fx: 0.5, fy: 0.7 },
        { fx: 0.64, fy: 0.7 },
        { fx: 0.78, fy: 0.7 },
      ]
    : [
        { fx: 0.339, fy: 0.685 },
        { fx: 0.406, fy: 0.685 },
        { fx: 0.5, fy: 0.685 },
        { fx: 0.589, fy: 0.685 },
        { fx: 0.656, fy: 0.685 },
      ];
  const wPx = Math.floor(w * 0.078);
  const hPx = Math.floor(h * 0.08);
  return expect.map((e, i) => ({
    projectIndex: i,
    px: Math.floor(w * e.fx),
    py: Math.floor(h * e.fy),
    wPx,
    hPx,
    n: 100,
  }));
}

function ensureMfdClipLayer() {
  let layer = document.getElementById("mfdClipLayer");
  if (layer) return layer;
  layer = document.createElement("div");
  layer.id = "mfdClipLayer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  return layer;
}

function drawMfdClipCanvas(project, index, highlight) {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, highlight ? "#243044" : "#152030");
  g.addColorStop(1, highlight ? "#2e3e55" : "#1c2a3c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = highlight ? "rgba(240,196,90,0.95)" : "rgba(120,160,190,0.45)";
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, S - 16, S - 16);
  ctx.fillStyle = "#f0c45a";
  ctx.font = "600 26px monospace";
  ctx.fillText("PROJECT " + String(index + 1).padStart(2, "0"), 28, 52);
  ctx.fillStyle = "#e8e6e1";
  ctx.font = "700 42px sans-serif";
  ctx.fillText((project.name || "").slice(0, 14), 28, 110);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(24, 140, S - 48, 280);
  ctx.fillStyle = "#cfd8e3";
  ctx.font = "22px sans-serif";
  const plain = String(project.title || "").replace(/<br\s*\/?>/gi, " ");
  const words = plain.split(/\s+/);
  let line = "";
  let y = 185;
  words.forEach((w) => {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > S - 70) {
      ctx.fillText(line, 36, y);
      line = w;
      y += 32;
    } else line = test;
  });
  if (line) ctx.fillText(line, 36, y);
  ctx.fillStyle = "#9ad4de";
  ctx.font = "18px monospace";
  ctx.fillText("TAP · OPEN MISSION", 28, S - 36);
  return c;
}

function clearMfdClipOverlay() {
  const layer = document.getElementById("mfdClipLayer");
  if (layer) layer.remove();
}


function placeMfdOnBlackDus(root, opts = {}) {
  const force = !!opts.force;
  if (!force && state._mfdSeated && (state._mfdScreens || []).length >= 5) {
    return true;
  }

  const w = renderer.domElement.width;
  const h = renderer.domElement.height;
  if (!w || !h) {
    return false;
  }

  clearMfdClipOverlay();
  syncMfdCamera();
  root.updateMatrixWorld(true);

  const prev = (state._mfdScreens || []).slice();

  let centers = null;
  /* resize: reuse locked NDC seats so project order never reshuffles */
  if (force && state._mfdSeatNorm && state._mfdSeatNorm.length === 5 && !opts.remeasure) {
    centers = centersFromSeatNorm(w, h);
  }
  if (!centers || centers.length < 5) {
    centers = measureBlackDuCenters(root, w, h);
  }
  if (centers.length < 5) centers = findBlackDuCenters(w, h);
  if (centers.length < 5) {
    return false;
  }
  centers = assignProjectsLeftToRight(centers);

  const leftFx = centers[0].px / w;
  const midFx = centers[2].px / w;
  const seatOk = leftFx < 0.38 && midFx > 0.4 && midFx < 0.6;
  if (!seatOk && !opts.remeasure) {
    state._mfdSeatNorm = null;
    return placeMfdOnBlackDus(root, { force: true, remeasure: true });
  }

  // #region agent log
  fetch("http://127.0.0.1:7719/ingest/981fe459-55aa-4b6a-b93e-29a4ea52759b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "88eb62" },
    body: JSON.stringify({
      sessionId: "88eb62",
      runId: "mfd-ltr",
      hypothesisId: "LTR",
      location: "flight.js:placeMfd",
      message: "centers_ltr",
      data: {
        w,
        h,
        mobile: isMobile(),
        usedNorm: !!(state._mfdSeatNorm && opts.force && !opts.remeasure),
        centers: centers.map((c) => ({
          i: c.projectIndex,
          px: c.px,
          py: c.py,
          wPx: c.wPx,
          hPx: c.hPx,
        })),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const black = collectBlackMeshes(root);
  if (!black.length) {
    return false;
  }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const camPos = camera.getWorldPosition(new THREE.Vector3());
  const toward = new THREE.Vector3();

  const sized = [];
  for (const c0 of centers) {
    let hit = null;
    let c = c0;
    outer: for (let dx = 0; dx <= 28; dx += 2) {
      for (const sx of dx === 0 ? [0] : [dx, -dx]) {
        for (let dy = 0; dy <= 24; dy += 2) {
          for (const sy of dy === 0 ? [0] : [dy, -dy]) {
            const px = c0.px + sx;
            const py = c0.py + sy;
            ndc.set((px / w) * 2 - 1, -((py / h) * 2 - 1));
            raycaster.setFromCamera(ndc, camera);
            hit = raycaster.intersectObjects(black, false)[0];
            if (hit?.face) {
              c = { ...c0, px, py };
              break outer;
            }
          }
        }
      }
    }
    if (!hit?.face && isMobile()) {
      for (let py = Math.floor(h * 0.45); py <= Math.floor(h * 0.95); py += 3) {
        for (const ox of [0, 6, -6, 12, -12, 18, -18]) {
          const px = c0.px + ox;
          ndc.set((px / w) * 2 - 1, -((py / h) * 2 - 1));
          raycaster.setFromCamera(ndc, camera);
          hit = raycaster.intersectObjects(black, false)[0];
          if (hit?.face) {
            c = { ...c0, px, py };
            break;
          }
        }
        if (hit?.face) break;
      }
    }
    if (!hit?.face) {
      console.warn("[mfd-panel] miss seed", c0.projectIndex);
      // #region agent log
      fetch("http://127.0.0.1:7719/ingest/981fe459-55aa-4b6a-b93e-29a4ea52759b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "88eb62" },
        body: JSON.stringify({
          sessionId: "88eb62",
          runId: "mfd-ltr",
          hypothesisId: "C",
          location: "flight.js:placeMfd",
          message: "fail_ray_miss",
          data: { projectIndex: c0.projectIndex, px: c0.px, py: c0.py, mobile: isMobile() },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return false;
    }
    /* re-grow size at final hit px for tight LCD fit */
    const grown = growDuRect(
      (px, py) => {
        if (px < 0 || py < 0 || px >= w || py >= h) return false;
        raycaster.setFromCamera(new THREE.Vector2((px / w) * 2 - 1, -((py / h) * 2 - 1)), camera);
        return raycaster.intersectObjects(black, false).length > 0;
      },
      w,
      h,
      c.px,
      c.py,
      isMobile()
    );
    if (grown) {
      c = { ...c, ...grown, projectIndex: c0.projectIndex };
    }
    sized.push({ c, hit });
  }

  /* final LTR by actual hit px — 01 always leftmost */
  sized.sort((a, b) => a.c.px - b.c.px);
  sized.forEach((item, i) => {
    item.c.projectIndex = i;
  });

  prev.forEach((slot) => {
    if (slot.el) slot.el.remove();
    if (!slot.mesh) return;
    if (slot.mesh.parent) slot.mesh.parent.remove(slot.mesh);
    if (slot.mesh.geometry) slot.mesh.geometry.dispose();
    if (slot.mesh.material) {
      if (slot.mesh.material.map) slot.mesh.material.map.dispose();
      slot.mesh.material.dispose();
    }
  });
  if (state._mfdGroup) cockpit.remove(state._mfdGroup);

  const group = new THREE.Group();
  group.name = "mfdPanelScreens";
  state._mfdScreens = [];

  sized.forEach(({ c, hit }) => {
    toward.subVectors(camPos, hit.point).normalize();
    const dist = hit.distance;
    const worldH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const aspect = w / h;
    /* seat flush in black LCD — no oversize inflate */
    const fill = 1.0;
    const duW = worldH * aspect * (c.wPx / w) * fill;
    const duH = worldH * (c.hPx / h) * fill;

    const parent = hit.object;
    const local = hit.point.clone();
    parent.worldToLocal(local);
    let nLocal = hit.face.normal.clone().normalize();
    const nWorld = nLocal.clone().transformDirection(parent.matrixWorld).normalize();
    if (nWorld.dot(toward) < 0) nLocal = nLocal.negate();
    local.addScaledVector(nLocal, 0.0003);

    const pw = new THREE.Vector3();
    parent.getWorldScale(pw);
    const sx = Math.max(1e-4, Math.abs(pw.x));
    const sy = Math.max(1e-4, Math.abs(pw.y));
    const sc = Math.max(sx, sy, Math.abs(pw.z) || 1e-4);
    const gw = duW / sc;
    const gh = duH / sc;

    const mat = new THREE.MeshBasicMaterial({
      map: makeProjectPreview(PROJECTS[c.projectIndex], c.projectIndex, false),
      color: 0xffffff,
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), mat);
    mesh.position.copy(local);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nLocal);
    mesh.renderOrder = 5;
    mesh.userData.mfd = true;
    mesh.visible = true;
    parent.add(mesh);

    state._mfdScreens.push({
      mesh,
      projectIndex: c.projectIndex,
      liveIndex: c.projectIndex,
      basePos: local.clone(),
      popDir: nLocal.clone(),
      pop: 0,
      detect: {
        px: Math.round(c.px),
        py: Math.round(c.py),
        wPx: Math.round(c.wPx),
        hPx: Math.round(c.hPx),
        parent: parent.name,
        side: +duW.toFixed(3),
        h: +duH.toFixed(3),
        n: c.n,
        mode: "lcd3d",
        dist: +dist.toFixed(4),
      },
    });
  });

  cockpit.add(group);
  state._mfdGroup = group;
  state._mfdSeated = state._mfdScreens.length >= 5;
  if (state._mfdSeated) {
    state._mfdSeatNorm = state._mfdScreens.map((slot) => ({
      fx: slot.detect.px / w,
      fy: slot.detect.py / h,
      fw: slot.detect.wPx / w,
      fh: slot.detect.hPx / h,
    }));
  }
  if (typeof applyProject === "function") applyProject(-1, { maneuver: false });
  paintMfdScreens();
  tickMfdPop();
  console.info("[mfd-panel] " + JSON.stringify(state._mfdScreens.map((slot) => slot.detect)));
  // #region agent log
  fetch("http://127.0.0.1:7719/ingest/981fe459-55aa-4b6a-b93e-29a4ea52759b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "88eb62" },
    body: JSON.stringify({
      sessionId: "88eb62",
      runId: "mfd-ltr",
      hypothesisId: "D",
      location: "flight.js:placeMfd",
      message: "place_ok",
      data: {
        n: state._mfdScreens.length,
        mobile: isMobile(),
        order: state._mfdScreens.map((s) => s.projectIndex),
        px: state._mfdScreens.map((s) => s.detect.px),
        sizes: state._mfdScreens.map((s) => ({ w: s.detect.wPx, h: s.detect.hPx })),
        vw: window.innerWidth,
        fov: +camera.fov.toFixed(1),
        aspect: +(renderer.domElement.width / Math.max(1, renderer.domElement.height)).toFixed(3),
        edgeFx: {
          L: +(state._mfdScreens[0].detect.px / renderer.domElement.width).toFixed(3),
          R: +(state._mfdScreens[4].detect.px / renderer.domElement.width).toFixed(3),
        },
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return state._mfdScreens.length >= 5;
}

function installMfdScreens(root) {
  root.updateMatrixWorld(true);
  state._mfdScreens = [];
  state._mfdSeated = false;
  state._mfdSeatNorm = null;
  state._mfdGroup = new THREE.Group();
  state._mfdGroup.name = "mfdPanelScreens";
  cockpit.add(state._mfdGroup);
  state._mfdRoot = root;
  window.__SAVEAS_DEBUG = {
    state,
    camera,
    THREE,
    placeMfdOnBlackDus: () => placeMfdOnBlackDus(root, { force: true }),
  };
  let tries = 0;
  const maxTries = 24;
  const attempt = () => {
    if (state._mfdSeated && (state._mfdScreens || []).length >= 5) return;
    tries += 1;
    /* do NOT frameSideScreens here — pitch thrash caused late seat (takeoff) */
    cameraRig.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    root.updateMatrixWorld(true);
    if (isMobile() && tries === 1) frameSideScreens("center");
    const ok = placeMfdOnBlackDus(root, { force: true, remeasure: true });
    if (ok) {
      console.info("[mfd-panel] seat ok tries=" + tries + " fov=" + camera.fov.toFixed(1));
      // #region agent log
      fetch("http://127.0.0.1:7719/ingest/981fe459-55aa-4b6a-b93e-29a4ea52759b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "88eb62" },
        body: JSON.stringify({
          sessionId: "88eb62",
          runId: "fov-fit",
          hypothesisId: "FOV",
          location: "flight.js:installMfd",
          message: "seat_framed",
          data: {
            fov: +camera.fov.toFixed(1),
            zoom: +state.zoom.toFixed(3),
            pitch: +state.pitch.toFixed(3),
            edgeFx: state._mfdScreens?.length
              ? {
                  L: +(state._mfdScreens[0].detect.px / renderer.domElement.width).toFixed(3),
                  R: +(state._mfdScreens[4].detect.px / renderer.domElement.width).toFixed(3),
                }
              : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return;
    }
    if (tries < maxTries) setTimeout(attempt, 200);
    else {
    }
  };
  setTimeout(attempt, 200);
  const onCesium = () => {
    [400, 1200].forEach((ms) =>
      setTimeout(() => {
        if (state._mfdSeated) return;
        placeMfdOnBlackDus(root, { force: true });
      }, ms)
    );
  };
  if (document.body.classList.contains("is-cesium-ready")) onCesium();
  else {
    const obs = new MutationObserver(() => {
      if (!document.body.classList.contains("is-cesium-ready")) return;
      obs.disconnect();
      onCesium();
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }
}

/* ========== A320 FLIGHTDECK (IDG-A32X fd_complete) ========== */
const cockpit = new THREE.Group();
scene.add(cockpit);
state._cockpitReady = false;
state._camBase = { x: 0, y: 1.15, z: 1.35 };

function prepareCockpitMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = false;
    o.receiveShadow = false;
    const meshName = String(o.name || "").toLowerCase();
    if (meshName === "hud" || meshName.includes("hudscreen")) {
      o.visible = false;
      return;
    }
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const cleaned = mats.map((m) => {
      if (!m) return m;
      const n = String(m.name || "").toLowerCase();
      /* FG baked exterior gallery blocked the real sky — punch it out */
      if (n.includes("front_gallery") || n.includes("gallery")) {
        const ghost = m.clone();
        ghost.name = `${m.name}_ghost`;
        ghost.transparent = true;
        ghost.opacity = 0;
        ghost.depthWrite = false;
        ghost.colorWrite = false;
        ghost.needsUpdate = true;
        return ghost;
      }
      return m;
    });
    o.material = cleaned.length === 1 ? cleaned[0] : cleaned;

    const useMats = Array.isArray(o.material) ? o.material : [o.material];
    useMats.forEach((m) => {
      if (!m || m.visible === false) return;
      const n = String(m.name || "").toLowerCase();
      if (n.includes("front_gallery") || n.includes("gallery")) return;
      const isGlass =
        (n.includes("glass") || n.includes("visor") || /mat\d*gla/i.test(n)) &&
        !n.includes("glare");
      if (isGlass) {
        m.transparent = true;
        m.opacity = 0.04;
        m.depthWrite = false;
        m.depthTest = true;
        m.side = THREE.DoubleSide;
        if ("alphaTest" in m) m.alphaTest = 0;
        if ("metalness" in m) m.metalness = 0;
        if ("roughness" in m) m.roughness = 0.02;
        if ("envMapIntensity" in m) m.envMapIntensity = 0.15;
        if (m.map) m.map = null;
        m.color?.set?.(0xffe8d0);
        m.emissive?.set?.(0x000000);
      } else if (n === "black") {
        /* LCD glass stays for depth/ray hits; project planes paint the pixels */
        m.polygonOffset = true;
        m.polygonOffsetFactor = 2;
        m.polygonOffsetUnits = 2;
      } else if (m.transparent && m.opacity < 0.2) {
        m.depthWrite = false;
      } else {
        m.transparent = false;
        m.opacity = 1;
        m.depthWrite = true;
      }
      if ("envMapIntensity" in m && !isGlass) m.envMapIntensity = 1.05;
      m.needsUpdate = true;
    });
  });
}

function fitCockpitView(root) {
  /*
    Blender/FG Z-up exported via glTF → Three Y-up.
    Rotate Y -90 so FG +X (nose) faces camera -Z.
  */
  root.rotation.set(0, -Math.PI / 2, 0);
  root.position.set(0, 0, 0);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  /* Seat: start forward of cabin mid — never so aft that seat backs fill the frame */
  state._camBase = {
    x: center.x,
    y: box.min.y + Math.min(Math.max(size.y * 0.52, 1.05), 1.45),
    z: center.z + size.z * (isMobile() ? -0.02 : 0.02),
  };
  state.tZoom = isMobile() ? 0.38 : 0.42;
  state.zoom = state.tZoom;
  if (isMobile()) {
    state.tPitch = 0.05;
    state.pitch = 0.05;
  }
  state._cockpitReady = true;
  console.info("[cockpit]", {
    size: size.toArray().map((v) => +v.toFixed(2)),
    cam: { ...state._camBase },
  });
}

new GLTFLoader().load(
  "assets/models/a320-cockpit.glb",
  (gltf) => {
    try {
      const root = gltf.scene;
      prepareCockpitMaterials(root);
      cockpit.add(root);
      fitCockpitView(root);
      installMfdScreens(root);
      const fill = new THREE.HemisphereLight(0xffe2c4, 0x2a3038, 0.85);
      cockpit.add(fill);
      const key = new THREE.DirectionalLight(0xfff0dd, 1.35);
      key.position.set(0.4, 2.2, 1.2);
      cockpit.add(key);
      document.body.classList.add("is-cockpit-ready");
    } catch (err) {
      console.error("A320 cockpit init failed", err);
    }
  },
  undefined,
  (err) => {
    console.error("A320 cockpit GLB failed", err);
  }
);

/* ========== UI ========== */
function clearStage() {
  [el.hero, el.project, el.system, el.contact].forEach((c) => c.classList.add("is-hidden"));
}

function show(card) {
  clearStage();
  card.classList.remove("is-hidden");
  scheduleMobileFloatGauges();
}

function setEnv(env) {
  state._envTarget = env;
}

function tickEnv() {
  if (!state._envTarget) return;
  const e = state._envTarget;
  const k = 0.05;
  skyU.turbidity.value += (e.turbidity - skyU.turbidity.value) * k;
  skyU.rayleigh.value += (e.rayleigh - skyU.rayleigh.value) * k;
  renderer.toneMappingExposure += (e.exposure - renderer.toneMappingExposure) * k;
  state._sunEl += (e.elevation - state._sunEl) * k;
  state._sunAz += (e.azimuth - state._sunAz) * k;
  setSun(state._sunEl, state._sunAz);
  const night = Math.max(0, 1 - e.elevation / 40);
  hemi.intensity += ((0.95 - night * 0.55) - hemi.intensity) * k;
  sun.intensity += ((2.4 - night * 1.6) - sun.intensity) * k;
  for (const layer of cloudLayers) {
    /* photo planes removed */
  }
}

function applyProject(index, { maneuver = true } = {}) {
  state.project = index;
  document.querySelectorAll(".route-item").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.index) === index);
  });
  scheduleMobileFloatGauges();

  if (index < 0) {
    clearStage();
    el.metaIndex.textContent = "— / 05";
    el.metaName.textContent = "READY";
    setEnv(PROJECTS[0].env);
    cityGroup.visible = false;
    paintMfdScreens();
    scheduleMobileFloatGauges();
    return;
  }

  const p = PROJECTS[index];
  show(el.project);
  el.metaIndex.textContent = `${String(index + 1).padStart(2, "0")} / 05`;
  el.metaName.textContent = p.name;
  el.pEye.textContent = p.eye;
  el.pTitle.innerHTML = p.title;
  el.pBody.textContent = p.body;
  el.pTags.innerHTML = p.tags.map((t) => `<span>${t}</span>`).join("");
  el.dImg.src = p.art;
  el.dImg.style.display = "block";
  el.dLabel.textContent = p.name;
  if (p.link) {
    el.pLink.hidden = false;
    el.pLink.href = p.link;
    el.pLink.textContent = p.linkLabel;
  } else el.pLink.hidden = true;

  if (p.demos) {
    el.mbSwitches.hidden = false;
    el.mbSwitches.innerHTML = p.demos
      .map((d, i) => `<button type="button" data-art="${d.art}" class="${i === 0 ? "on" : ""}">${d.label}</button>`)
      .join("");
    el.mbSwitches.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        el.mbSwitches.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
        btn.classList.add("on");
        el.dImg.src = btn.dataset.art;
      });
    });
  } else {
    el.mbSwitches.hidden = true;
    el.mbSwitches.innerHTML = "";
  }

  setEnv(p.env);
  cityGroup.visible = index === 4;
  paintMfdScreens();
  scheduleMobileFloatGauges();

  if (maneuver && !reduce) {
    state.tRoll = index % 2 === 0 ? -0.05 : 0.045;
    state.tYaw = (index - 2) * 0.025;
    state.tSpeed = 1.5;
    setTimeout(() => {
      state.tRoll = 0;
      state.tSpeed = 1;
    }, 1000);
  }
}

function syncRouteHud() {
  if (el.gDep) el.gDep.textContent = `${ROUTE_META.depName} · ${ROUTE_META.depIcao}`;
  if (el.gArr) el.gArr.textContent = `${ROUTE_META.arrName} · ${ROUTE_META.arrIcao}`;
  if (el.gEte) el.gEte.textContent = formatRouteDuration(ROUTE_META.durationSec);
  const label = document.getElementById("routeLabel");
  if (label) label.textContent = `${routeLabelShort()} · ${formatRouteDuration()}`;
}
syncRouteHud();

/* Click / drag progress to jump flight time (inspect any segment) */
function scrubFlightFromEvent(ev) {
  const world = state._cesium;
  if (!world?.seekNormalized) return;
  const track = document.getElementById("fgProgressTrack") || document.getElementById("fgProgress");
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const clientX = ev.touches?.[0]?.clientX ?? ev.clientX;
  const u = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
  world.seekNormalized(u);
  updateGauges();
}
const fgProgress = document.getElementById("fgProgress");
if (fgProgress) {
  let dragging = false;
  const start = (ev) => {
    dragging = true;
    scrubFlightFromEvent(ev);
    ev.preventDefault();
  };
  const move = (ev) => {
    if (!dragging) return;
    scrubFlightFromEvent(ev);
    ev.preventDefault();
  };
  const end = () => {
    dragging = false;
  };
  fgProgress.addEventListener("pointerdown", start);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  fgProgress.addEventListener("keydown", (ev) => {
    const world = state._cesium;
    if (!world?.seek) return;
    const cur = world.state?.elapsedSeconds || 0;
    if (ev.key === "ArrowRight" || ev.key === "ArrowUp") {
      world.seek(cur + 2);
      ev.preventDefault();
    } else if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") {
      world.seek(cur - 2);
      ev.preventDefault();
    }
    updateGauges();
  });
}

function updateGauges() {
  const fs = state._cesium?.state;
  if (fs) {
    const altFt = Math.round(fs.altitudeAMSL * 3.28084);
    const spd = Math.round(fs.indicatedAirspeedKt || fs.groundSpeedKt || 0);
    const hdg = ((fs.heading % 360) + 360) % 360;
    el.gAlt.textContent = altFt.toLocaleString("en-US");
    el.gSpd.textContent = String(spd);
    el.gHdg.textContent = `${String(Math.round(hdg)).padStart(3, "0")}°`;
    const remain = Math.max(0, FLIGHT_DURATION_SEC - (fs.elapsedSeconds || 0));
    if (el.gEte) el.gEte.textContent = formatRouteDuration(remain);
    const prog = Math.max(0, Math.min(1, (fs.elapsedSeconds || 0) / FLIGHT_DURATION_SEC));
    if (el.gFlightBar) el.gFlightBar.style.transform = `scaleX(${prog})`;
    if (el.gFlightPct) el.gFlightPct.textContent = `${Math.round(prog * 100)}%`;
    const scrub = document.getElementById("fgProgress");
    if (scrub) scrub.setAttribute("aria-valuenow", String(Math.round(prog * 100)));
    return;
  }
  const p = state.project >= 0 ? PROJECTS[state.project] : PROJECTS[0];
  const alt = 22000 + state.altLift * 220 + state.speed * 40 + Math.sin(state.vibe) * 12;
  const spd = 240 + state.speed * 90 + state.velocity * 35;
  const hdg = (p.hdg + state.flightHeading * (180 / Math.PI) + state.yaw * 35 + 3600) % 360;
  el.gAlt.textContent = Math.round(alt).toLocaleString("en-US");
  el.gSpd.textContent = String(Math.round(spd));
  el.gHdg.textContent = `${String(Math.round(hdg)).padStart(3, "0")}°`;
}

document.querySelectorAll(".route-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyProject(Number(btn.dataset.index));
    document.body.classList.remove("is-routes-open");
    const t = document.getElementById("mRouteBtn");
    if (t) t.setAttribute("aria-expanded", "false");
  });
});
document.getElementById("mRouteBtn")?.addEventListener("click", () => {
  const open = document.body.classList.toggle("is-routes-open");
  document.getElementById("mRouteBtn")?.setAttribute("aria-expanded", open ? "true" : "false");
});
document.getElementById("viewSystem")?.addEventListener("click", () => show(el.system));
document.getElementById("viewContact")?.addEventListener("click", () => {
  show(el.contact);
  cityGroup.visible = true;
  setEnv(PROJECTS[4].env);
});
document.getElementById("closeSystem")?.addEventListener("click", () => {
  if (state.project < 0) clearStage();
  else show(el.project);
});

window.addEventListener(
  "pointermove",
  (e) => {
    /* UI panels: never steer the view — only drag on canvas does */
    if (el.flightUi && !isMobile()) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      el.flightUi.style.setProperty("--ui-x", `${nx * 4}px`);
      el.flightUi.style.setProperty("--ui-y", `${ny * 2}px`);
      el.flightUi.classList.add("is-tilted");
    }
  },
  { passive: true }
);

window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault?.();
    state.velocity = Math.min(1.6, Math.abs(e.deltaY) / 70);
    state.tSpeed = 1 + Math.min(0.8, state.velocity * 0.6);
    /* scroll = move toward / away from captain panel (zoom/dolly) */
    state.tZoom = THREE.MathUtils.clamp(state.tZoom - Math.sign(e.deltaY) * 0.055, 0, 0.72);
  },
  { passive: false }
);

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    state.keys.left = true;
    e.preventDefault();
  }
  if (e.key === "ArrowRight") {
    state.keys.right = true;
    e.preventDefault();
  }
  if (e.key === "ArrowUp") {
    state.keys.up = true;
    e.preventDefault();
  }
  if (e.key === "ArrowDown") {
    state.keys.down = true;
    e.preventDefault();
  }
  if (e.key === "=" || e.key === "+") {
    state.tZoom = THREE.MathUtils.clamp(state.tZoom + 0.08, 0, 1);
  }
  if (e.key === "-" || e.key === "_") {
    state.tZoom = THREE.MathUtils.clamp(state.tZoom - 0.08, 0, 1);
  }
  if (e.key === "Escape") applyProject(-1, { maneuver: false });
  if (e.key === "c" || e.key === "C") {
    show(el.contact);
    cityGroup.visible = true;
    setEnv(PROJECTS[4].env);
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") state.keys.left = false;
  if (e.key === "ArrowRight") state.keys.right = false;
  if (e.key === "ArrowUp") state.keys.up = false;
  if (e.key === "ArrowDown") state.keys.down = false;
});

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
function tryOpenMfdAt(clientX, clientY) {
  const targets = (state._mfdScreens || []).map((s) => s.mesh).filter(Boolean);
  if (!targets.length) return false;
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(targets, false);
  if (!hits.length) return false;
  const slot = state._mfdScreens.find((s) => s.mesh === hits[0].object);
  if (!slot) return false;
  applyProject(slot.liveIndex ?? 0);
  return true;
}

/* 360-style orbit: drag canvas to look, release keeps pose (Naver car-view pattern) */
let dragLastX = 0;
let dragLastY = 0;
let dragDownX = 0;
let dragDownY = 0;
const canvasEl = renderer.domElement;
canvasEl.style.cursor = "grab";
canvasEl.style.touchAction = "none";


/* Mobile two-finger pinch = zoom toward / away from panel (route unchanged) */
let pinchDist0 = 0;
let pinchZoom0 = 0;
function touchDist(touches) {
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
canvasEl.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length < 2) return;
    state.pinching = true;
    state.dragging = false;
    pinchDist0 = touchDist(e.touches) || 1;
    pinchZoom0 = state.tZoom;
  },
  { passive: true }
);
canvasEl.addEventListener(
  "touchmove",
  (e) => {
    if (!state.pinching || e.touches.length < 2) return;
    e.preventDefault();
    const d = touchDist(e.touches);
    if (!d || !pinchDist0) return;
    const delta = (d / pinchDist0 - 1) * 0.7;
    state.tZoom = THREE.MathUtils.clamp(pinchZoom0 + delta, 0, 0.72);
  },
  { passive: false }
);
function endPinch() {
  state.pinching = false;
}
canvasEl.addEventListener("touchend", endPinch, { passive: true });
canvasEl.addEventListener("touchcancel", endPinch, { passive: true });


canvasEl.addEventListener("pointerdown", (e) => {
  if (e.button != null && e.button !== 0) return;
  state.dragging = true;
  state.dragMoved = false;
  dragLastX = dragDownX = e.clientX;
  dragLastY = dragDownY = e.clientY;
  try {
    canvasEl.setPointerCapture(e.pointerId);
  } catch (_) {}
  canvasEl.style.cursor = "grabbing";
});

canvasEl.addEventListener("pointermove", (e) => {
  if (!state.dragging || state.pinching || reduce) return;
  const dx = e.clientX - dragLastX;
  const dy = e.clientY - dragLastY;
  dragLastX = e.clientX;
  dragLastY = e.clientY;
  if (Math.hypot(e.clientX - dragDownX, e.clientY - dragDownY) > 8) {
    state.dragMoved = true;
    state.lookSnap = null;
  }
  if (state._cesium?.nudgeLook) {
    state._cesium.nudgeLook(dx, dy);
    const yawDeg = state._cesium.state.userYawOffset || 0;
    const pitchDeg = state._cesium.state.userPitchOffset || 0;
    const { min: pitchMin, max: pitchMax } = lookPitchLimits();
    const yawMax = lookYawMax();
    state.yaw = THREE.MathUtils.clamp((yawDeg * Math.PI) / 180, -yawMax, yawMax);
    state.pitch = THREE.MathUtils.clamp((-pitchDeg * Math.PI) / 180, pitchMin, pitchMax);
    state.tYaw = state.yaw;
    state.tPitch = state.pitch;
  } else {
    const sens = isMobile() ? 0.0048 : 0.0032;
    const yawMax = THREE.MathUtils.clamp(0.4 - state.zoom * 0.1, 0.24, lookYawMax());
    const { min: pitchMin, max: pitchMax } = lookPitchLimits();
    state.yaw = THREE.MathUtils.clamp(state.yaw + dx * sens, -yawMax, yawMax);
    state.pitch = THREE.MathUtils.clamp(state.pitch + dy * sens, pitchMin, pitchMax);
    state.tYaw = state.yaw;
    state.tPitch = state.pitch;
  }
  /* Transient bank / bob — route unchanged; restored on pointerup */
  state.tRoll = THREE.MathUtils.clamp(state.tRoll + dx * 0.0018, -0.14, 0.14);
  state.tMotionPitch = THREE.MathUtils.clamp(state.tMotionPitch + dy * 0.0012, -0.09, 0.09);
  // #region agent log
  if (!window.__lookDbgN) window.__lookDbgN = 0;
  if (window.__lookDbgN < 8) {
    window.__lookDbgN += 1;
    fetch("http://127.0.0.1:7719/ingest/981fe459-55aa-4b6a-b93e-29a4ea52759b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "88eb62" },
      body: JSON.stringify({
        sessionId: "88eb62",
        runId: "look-fix",
        hypothesisId: "LOOK",
        location: "flight.js:pointermove",
        message: "look_delta",
        data: {
          dx,
          dy,
          yaw: +state.yaw.toFixed(4),
          pitch: +state.pitch.toFixed(4),
          cesiumPitch: state._cesium?.state?.userPitchOffset ?? null,
          cesiumYaw: state._cesium?.state?.userYawOffset ?? null,
          mobile: isMobile(),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
});

function endDrag(e) {
  if (!state.dragging) return;
  state.dragging = false;
  canvasEl.style.cursor = "grab";
  try {
    canvasEl.releasePointerCapture(e.pointerId);
  } catch (_) {}
  /* Drop attitude motion immediately; free-look pose can stay */
  state.tRoll = 0;
  state.tMotionPitch = 0;
  if (!state.dragMoved) tryOpenMfdAt(e.clientX, e.clientY);
}
canvasEl.addEventListener("pointerup", endDrag);
canvasEl.addEventListener("pointercancel", endDrag);

/* Aim at captain / FO panel LCDs — no floating focus plates */
const LOOK_PRESETS = {
  left: { yaw: 0.26, pitch: -0.06, zoom: 0.58, side: -0.1, lift: 0.02 },
  center: { yaw: 0, pitch: -0.02, zoom: 0.42, side: 0, lift: 0 },
  right: { yaw: -0.26, pitch: -0.06, zoom: 0.58, side: 0.1, lift: 0.02 },
};
const LOOK_PRESETS_MOBILE = {
  left: { yaw: 0.2, pitch: 0.06, zoom: 0.42, side: -0.06, lift: 0.01 },
  center: { yaw: 0, pitch: 0.05, zoom: 0.38, side: 0, lift: 0 },
  right: { yaw: -0.2, pitch: 0.06, zoom: 0.42, side: 0.06, lift: 0.01 },
};

function frameSideScreens(side) {
  const table = isMobile() ? LOOK_PRESETS_MOBILE : LOOK_PRESETS;
  const p = table[side] || table.center;
  state._cesium?.resetLook?.();
  state.lookSnap = side;
  state.tYaw = p.yaw;
  state.tPitch = p.pitch;
  state.yaw = p.yaw;
  state.pitch = p.pitch;
  state.tZoom = p.zoom;
  state.zoom = p.zoom;
  state.tRoll = 0;
  state.roll = 0;
  state.tMotionPitch = 0;
  state.motionPitch = 0;
  state.tZoomSide = p.side;
  state.zoomSide = p.side;
  state.snapLift = p.lift;
  document.querySelectorAll(".snap-btn").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.look === side);
  });
  /* MFDs stay on LCD parents — never remeasure on look (was reshuffling 01↔05) */
}

document.querySelectorAll(".snap-btn[data-look]").forEach((btn) => {
  btn.addEventListener("click", () => {
    frameSideScreens(btn.dataset.look);
    /* keep seated order on center snap */
  });
});

const hint = document.createElement("div");
hint.className = "view-hint";
hint.textContent = "←→ 기울기 · ↑↓ 기수(경로 고정) · LCD 탭 · 드래그 시선";
document.body.appendChild(hint);
requestAnimationFrame(() => hint.classList.add("is-on"));
setTimeout(() => hint.classList.remove("is-on"), 4500);
setInterval(() => {
  if (reduce) return;
  /* only refresh textures when nothing is selected — avoid fighting the pop highlight */
  if (state.project >= 0) return;
  paintMfdScreens();
}, 5500);

setInterval(() => {
  const d = new Date();
  el.clock.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}, 1000);

function layoutMobileFloatGauges() {
  const fg = document.getElementById("floatGauges");
  const route = document.getElementById("routeNav");
  const stage = document.getElementById("stage");
  if (!fg) return;
  if (!isMobile() || !route) {
    fg.style.top = "";
    if (stage) stage.style.removeProperty("--stage-top");
    return;
  }
  const rr = route.getBoundingClientRect();
  if (rr.width < 8 || rr.height < 8) return;
  let anchorBottom = rr.bottom;
  let anchor = "route";
  const cards = [el.project, el.system, el.contact, el.hero].filter(Boolean);
  for (const card of cards) {
    if (card.classList.contains("is-hidden")) continue;
    const cr = card.getBoundingClientRect();
    if (cr.height < 8 || cr.width < 8) continue;
    if (cr.top < window.innerHeight * 0.55 && cr.bottom > anchorBottom) {
      anchorBottom = cr.bottom;
      anchor = card.id || "card";
    }
  }
  const top = Math.round(anchorBottom + 8);
  fg.style.top = top + "px";
  fg.style.bottom = "auto";
  if (stage) {
    stage.style.setProperty("--stage-top", Math.round(rr.bottom + 6) + "px");
  }
  // #region agent log
  fetch("http://127.0.0.1:7719/ingest/981fe459-55aa-4b6a-b93e-29a4ea52759b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "88eb62" },
    body: JSON.stringify({
      sessionId: "88eb62",
      runId: "fg-expand",
      hypothesisId: "UI",
      location: "flight.js:layoutMobileFloatGauges",
      message: "fg_top",
      data: {
        top,
        anchor,
        routeBottom: +rr.bottom.toFixed(1),
        routeH: +rr.height.toFixed(1),
        activeIdx: state.project,
        projectHidden: !!el.project?.classList.contains("is-hidden"),
        vw: window.innerWidth,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function scheduleMobileFloatGauges() {
  layoutMobileFloatGauges();
  requestAnimationFrame(() => {
    layoutMobileFloatGauges();
    requestAnimationFrame(layoutMobileFloatGauges);
  });
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 2 : 1.75));
  scheduleMobileFloatGauges();
  /* mobile orientation / chrome UI resize invalidates NDC seats */
  if (state._mfdRoot) {
    window.clearTimeout(window.__mfdResizeT);
    window.__mfdResizeT = window.setTimeout(() => {
      state._mfdSeated = false;
      placeMfdOnBlackDus(state._mfdRoot, { force: true, remeasure: false });
    }, 280);
  }
});
scheduleMobileFloatGauges();
setTimeout(scheduleMobileFloatGauges, 400);
setTimeout(scheduleMobileFloatGauges, 1200);
if (typeof ResizeObserver !== "undefined") {
  const ro = new ResizeObserver(() => scheduleMobileFloatGauges());
  const routeEl = document.getElementById("routeNav");
  if (routeEl) ro.observe(routeEl);
  [el.project, el.system, el.contact, el.hero].forEach((n) => n && ro.observe(n));
}

let prev = performance.now();
let gaugeTick = 0;
function animate(now) {
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;

  state.speed += (state.tSpeed - state.speed) * 0.08;
  state.velocity *= 0.9;
  if (state.velocity < 0.02) {
    state.velocity = 0;
    state.tSpeed += (1 - state.tSpeed) * 0.06;
  }

  /* Arrow / pad: attitude MOTION only — never rewrite route heading or altitude path */
  const k = state.keys || {};
  const rollMax = 0.14;
  const motionPitchMax = 0.1;
  const restore = Math.min(1, dt * 10);
  if (k.left) {
    state.tRoll = Math.min(rollMax, state.tRoll + dt * 1.4);
  } else if (k.right) {
    state.tRoll = Math.max(-rollMax, state.tRoll - dt * 1.4);
  } else if (!state.dragging) {
    state.tRoll += (0 - state.tRoll) * restore;
  }
  if (k.up) {
    state.tMotionPitch = Math.max(-motionPitchMax, state.tMotionPitch - dt * 1.1);
  } else if (k.down) {
    state.tMotionPitch = Math.min(motionPitchMax, state.tMotionPitch + dt * 1.1);
  } else if (!state.dragging) {
    state.tMotionPitch += (0 - state.tMotionPitch) * restore;
  }

  if (!state._cesium) {
    /* legacy non-Cesium: still no path rewrite — look assist only while keys held */
    const pitchRate = 0.35;
    if (k.left) {
      state.tYaw = THREE.MathUtils.clamp(state.tYaw + dt * 0.1, -0.22, 0.22);
    } else if (k.right) {
      state.tYaw = THREE.MathUtils.clamp(state.tYaw - dt * 0.1, -0.22, 0.22);
    } else if (!state.dragging) {
      state.tYaw += (0 - state.tYaw) * restore;
    }
    if (k.up) {
      state.tPitch = THREE.MathUtils.clamp(state.tPitch - dt * pitchRate, -0.2, 0.12);
    } else if (k.down) {
      state.tPitch = THREE.MathUtils.clamp(state.tPitch + dt * pitchRate, -0.2, 0.12);
    } else if (!state.dragging) {
      state.tPitch += (0 - state.tPitch) * restore;
    }
  } else if (!state.dragging) {
    const yawDeg = state._cesium.state.userYawOffset || 0;
    const pitchDeg = state._cesium.state.userPitchOffset || 0;
    const { min: pMin, max: pMax } = lookPitchLimits();
    const yawMax = lookYawMax();
    state.tYaw = THREE.MathUtils.clamp((yawDeg * Math.PI) / 180, -yawMax, yawMax);
    state.tPitch = THREE.MathUtils.clamp((-pitchDeg * Math.PI) / 180, pMin, pMax);
  }
  if (k.left || k.right || k.up || k.down) {
    state.tSpeed = Math.max(state.tSpeed, 1.15);
  }

  /* while not dragging, ease toward held pose — always stay inside windscreen */
  const yawMax = lookYawMax();
  const { min: pitchMin, max: pitchMax } = lookPitchLimits();
  state.tYaw = THREE.MathUtils.clamp(state.tYaw, -yawMax, yawMax);
  state.tPitch = THREE.MathUtils.clamp(state.tPitch, pitchMin, pitchMax);
  state.yaw += (state.tYaw - state.yaw) * (state.dragging ? 1 : 0.28);
  state.pitch += (state.tPitch - state.pitch) * (state.dragging ? 1 : 0.28);
  state.yaw = THREE.MathUtils.clamp(state.yaw, -yawMax, yawMax);
  state.pitch = THREE.MathUtils.clamp(state.pitch, pitchMin, pitchMax);
  state.roll += (state.tRoll - state.roll) * (state.dragging || k.left || k.right ? 0.45 : 0.55);
  state.motionPitch += (state.tMotionPitch - state.motionPitch) * (state.dragging || k.up || k.down ? 0.45 : 0.55);
  state.vibe += dt;

  const vx = reduce ? 0 : Math.sin(state.vibe * 1.4) * 0.0012;
  const vy = reduce ? 0 : Math.cos(state.vibe * 1.15) * 0.0014;
  const base = state._camBase || { x: 0, y: 1.15, z: 1.35 };
  state.zoom += (state.tZoom - state.zoom) * 0.16;
  /* modest lateral bias only — never slide outside the cabin */
  if (state.lookSnap !== "left" && state.lookSnap !== "right") {
    state.tZoomSide = THREE.MathUtils.clamp(-state.yaw * (0.18 + state.zoom * 0.22), -0.18, 0.18);
    state.snapLift += (0 - state.snapLift) * 0.18;
  }
  state.zoomSide += (state.tZoomSide - state.zoomSide) * 0.28;
  /* slight nose-up bias so horizon sits in the windshield, not under the dash (eacc0b6 / MD) */
  const lookBias = (isMobile() ? 0.02 : 0.04) - state.zoom * 0.04;
  cameraRig.rotation.set(
    state.pitch + state.motionPitch + vy * 2 + lookBias,
    state.yaw,
    state.roll + vx * 2
  );
  const dolly = (state.zoom - 0.28) * (isMobile() ? 0.38 : 0.45);
  camera.position.set(
    base.x + vx * 3 + state.zoomSide,
    base.y + vy * 2 - state.zoom * 0.03 + state.snapLift,
    base.z - dolly
  );
  applyViewportFov();


  if (state._skyDome) {
    state._skyDome.visible = false;
  }

  if (state._cesium) {
    state._cesium.tick(dt, state.keys, state._tabVisible, {
      holdLook: state.lookSnap == null,
      motionRollDeg: state.roll * (180 / Math.PI),
      motionPitchDeg: -state.motionPitch * (180 / Math.PI),
    });
    const fs = state._cesium.state;
    if (fs) {
      const norm = Math.min(1.35, (fs.indicatedAirspeedKt || 0) / 420);
      state.speed += (norm - state.speed) * Math.min(1, dt * 2);
      state.flightHeading = ((fs.heading || 0) * Math.PI) / 180;
    }
  }

  tickEnv();
  tickMfdPop();
  if ((gaugeTick++ & 3) === 0) updateGauges();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

document.addEventListener("visibilitychange", () => {
  state._tabVisible = document.visibilityState === "visible";
});

/* Boot UI first so Cesium ready/fail can always dismiss overlay */
const bootFill = document.getElementById("bootLoadFill");
const bootPct = document.getElementById("bootLoadPct");
const bootLabel = document.getElementById("bootLoadLabel");

let bootProgress = 0;
let bootDone = false;
let bootFailSafe = 0;
function setBootProgress(p) {
  bootProgress = Math.max(0, Math.min(1, p));
  if (bootFill) bootFill.style.transform = `scaleX(${bootProgress})`;
  if (bootPct) bootPct.textContent = `${Math.round(bootProgress * 100)}%`;
}
const bootTimer = setInterval(() => {
  if (bootDone) return;
  setBootProgress(Math.min(0.9, bootProgress + (bootProgress < 0.7 ? 0.012 : 0.004)));
}, 80);
function finishBootLoad() {
  if (bootDone) return;
  bootDone = true;
  clearInterval(bootTimer);
  if (bootFailSafe) clearTimeout(bootFailSafe);
  setBootProgress(1);
  if (bootLabel) bootLabel.textContent = "READY";
  requestAnimationFrame(() => {
    setTimeout(() => document.body.classList.add("is-ready"), 220);
  });
}
bootFailSafe = setTimeout(() => {
  console.warn("[boot] failsafe — forcing ready");
  finishBootLoad();
}, 18000);

createCesiumWorld({ debug: new URLSearchParams(location.search).has("flightDebug") })
  .then((world) => {
    state._cesium = world;
    window.__SAVEAS_SEEK = (u) => {
      world.seekNormalized(u);
      updateGauges();
    };
    finishBootLoad();
    console.info(
      `[cesium] ready routeKm=${world.path.totalDistM / 1000} duration=${world.FLIGHT_DURATION_SEC}s`
    );
  })
  .catch((err) => {
    console.error("[cesium] init failed", err);
    finishBootLoad();
  });

applyProject(-1, { maneuver: false });
requestAnimationFrame(animate);

