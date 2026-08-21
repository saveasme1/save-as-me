import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";

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
  antialias: !isMobile(),
  powerPreference: "high-performance",
  alpha: false,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.15 : 1.35));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87b8e8, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
mount.appendChild(renderer.domElement);
mount.style.background = "#7eb6e8";

const scene = new THREE.Scene();
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

/* Procedural Sky + photoreal blue dome + moving clouds (2nd sky era) */
const sky = new Sky();
sky.scale.setScalar(45000);
sky.visible = true;
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
scene.add(skyDome);
state._skyDome = skyDome;

loader.load("assets/sky/puresky-2k.jpg", (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  skyDome.material.map = tex;
  skyDome.material.color.set(0xffffff);
  skyDome.material.needsUpdate = true;
  scene.background = tex;
});

new RGBELoader().load("assets/sky/khronos-env.hdr", (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdr;
});

/* Photo cloud layers (parallax) */
const cloudLayers = [];
function addPhotoCloud(url, w, h, z, opacity) {
  loader.load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
      })
    );
    m.position.set(0, h * 0.08, z);
    scene.add(m);
    cloudLayers.push({ mesh: m, baseZ: z, speed: 6 + Math.random() * 10, opacity });
  });
}
addPhotoCloud("assets/sky/clouds-front.jpg", 220, 48, -38, 0.38);
if (!isMobile()) addPhotoCloud("assets/sky/clouds-drama.jpg", 280, 70, -70, 0.28);
if (!isMobile()) addPhotoCloud("assets/sky/sky-clouds.jpg", 360, 90, -140, 0.2);
/* side wings of cloud so side windows match the forward world */
if (!isMobile()) {
  loader.load("assets/sky/clouds-front.jpg", (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    [-1, 1].forEach((side) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 50),
        new THREE.MeshBasicMaterial({
          map: tex.clone(),
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          toneMapped: false,
          side: THREE.DoubleSide,
        })
      );
      m.position.set(side * 55, 12, -20);
      m.rotation.y = side * -0.85;
      scene.add(m);
      cloudLayers.push({ mesh: m, baseZ: -20, speed: 5, opacity: 0.3 });
    });
  });
}

const softCloud = canvasTex((ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  [
    [0.32, 0.55, 0.3],
    [0.52, 0.48, 0.26],
    [0.68, 0.58, 0.22],
    [0.45, 0.64, 0.2],
  ].forEach(([x, y, r]) => {
    const g = ctx.createRadialGradient(w * x, h * y, 0, w * x, h * y, w * r);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.45, "rgba(255,255,255,0.4)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w * x, h * y, w * r, 0, Math.PI * 2);
    ctx.fill();
  });
}, 256, 128);

const cloudGroup = new THREE.Group();
scene.add(cloudGroup);
const clouds = [];
const nCloud = isMobile() ? 6 : 12;
for (let i = 0; i < nCloud; i++) {
  const mat = new THREE.SpriteMaterial({ map: softCloud, transparent: true, depthWrite: false, opacity: 0.5 });
  const s = new THREE.Sprite(mat);
  const sc = 70 + Math.random() * 180;
  s.scale.set(sc, sc * 0.4, 1);
  s.position.set((Math.random() - 0.5) * 2200, 40 + Math.random() * 160, -140 - Math.random() * 1800);
  cloudGroup.add(s);
  clouds.push(s);
}

/* ========== GMP → USN real corridor (not random) ========== */
const ROUTE = {
  /* explicit airway-ish samples: Gimpo → Seoul basin → inland → Daegu → Ulsan coast */
  waypoints: [
    { name: "GMP", lat: 37.5583, lon: 126.7906 },
    { name: "SEL", lat: 37.46, lon: 127.02 },
    { name: "ICN-E", lat: 37.2, lon: 127.35 },
    { name: "CJJ", lat: 36.72, lon: 127.5 },
    { name: "TAE", lat: 35.9, lon: 128.55 },
    { name: "USN", lat: 35.5935, lon: 129.3519 },
  ],
  zoom: 9,
  samples: isMobile() ? 10 : 14,
  cols: isMobile() ? 3 : 5,
};

function lonLatToTile(lon, lat, z) {
  const n = 2 ** z;
  const x = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y, n };
}

function lerpRoute(t) {
  const pts = ROUTE.waypoints;
  const clamped = THREE.MathUtils.clamp(t, 0, 0.9999);
  const f = clamped * (pts.length - 1);
  const i = Math.floor(f);
  const u = f - i;
  const a = pts[i];
  const b = pts[Math.min(i + 1, pts.length - 1)];
  return {
    lat: a.lat + (b.lat - a.lat) * u,
    lon: a.lon + (b.lon - a.lon) * u,
    name: u < 0.5 ? a.name : b.name,
  };
}

function loadTileImage(z, x, y) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const done = (v) => {
      clearTimeout(timer);
      resolve(v);
    };
    const timer = setTimeout(() => done(null), 4500);
    img.onload = () => done(img);
    img.onerror = () => done(null);
    img.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  });
}

function gradeAerialCanvas(ctx, w, h) {
  /* wash to distant blue-gray — kill near forest greens */
  ctx.fillStyle = "rgba(90,120,155,0.72)";
  ctx.fillRect(0, 0, w, h);
  const haze = ctx.createLinearGradient(0, 0, 0, h);
  haze.addColorStop(0, "rgba(170,205,235,0.7)");
  haze.addColorStop(0.5, "rgba(130,165,200,0.45)");
  haze.addColorStop(1, "rgba(80,105,130,0.55)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, h);
}

const terrainGroup = new THREE.Group();
/* cruise high — ground is a thin distant band, not a forest wall */
terrainGroup.position.set(0, -85, 0);
scene.add(terrainGroup);
state._terrain = null;
state._routeReady = false;
state.flightHeading = 0;
state.altLift = 85;
state.keys = { left: false, right: false, up: false, down: false };

/* distant muted earth disk only — no near trees */
(function addWorldGround() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const rad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  rad.addColorStop(0, "#4a5a62");
  rad.addColorStop(0.5, "#3a4a55");
  rad.addColorStop(1, "#2a3a4a");
  g.fillStyle = rad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(2400, 64),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: true })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -8;
  terrainGroup.add(ground);
  state._groundTex = tex;
})();

scene.fog = new THREE.FogExp2(0x8eb8e0, 0.00022);

async function buildGmpUsnTerrain() {
  const z = ROUTE.zoom;
  const tileSize = 256;
  const cols = ROUTE.cols;
  const half = Math.floor(cols / 2);
  const rows = ROUTE.samples;
  const canvas = document.createElement("canvas");
  canvas.width = tileSize * cols;
  canvas.height = tileSize * rows;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6a8498";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const jobs = [];
  for (let i = 0; i < rows; i++) {
    const t = i / Math.max(1, rows - 1);
    const { lat, lon } = lerpRoute(t);
    const tile = lonLatToTile(lon, lat, z);
    const cx = Math.floor(tile.x);
    const cy = Math.floor(tile.y);
    jobs.push(
      Promise.all(
        Array.from({ length: cols }, (_, ci) => loadTileImage(z, cx + (ci - half), cy))
      ).then((imgs) => {
        imgs.forEach((img, ci) => {
          if (!img) return;
          ctx.drawImage(img, ci * tileSize, i * tileSize, tileSize, tileSize);
        });
      })
    );
  }
  await Promise.all(jobs);
  gradeAerialCanvas(ctx, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,230,120,0.95)";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("GMP · SEOUL GIMPO", 16, 32);
  ctx.fillText("USN · ULSAN", 16, canvas.height - 18);
  ctx.font = "16px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("ROUTE GMP→SEL→CJJ→TAE→USN", 16, 56);
  ctx.strokeStyle = "rgba(255, 220, 90, 0.55)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.5, 10);
  ctx.lineTo(canvas.width * 0.5, canvas.height - 10);
  ctx.stroke();
  ctx.setLineDash([]);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    toneMapped: false,
    fog: false,
  });
  /* far below horizon only — never fills the windscreen with trees */
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(900, 500, 1, rows), mat);
  strip.rotation.x = -Math.PI / 2.15;
  strip.position.set(0, -35, -220);
  strip.scale.set(1, 1, 1);
  terrainGroup.add(strip);

  state._terrain = { strip, tex, mat };
  state._routeReady = true;
  const label = document.getElementById("routeLabel");
  if (label) label.textContent = "GMP → USN · REAL ROUTE";
}

buildGmpUsnTerrain().catch((err) => console.warn("terrain", err));

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(12000, 96),
  new THREE.MeshStandardMaterial({ color: 0x7f9a6a, roughness: 1, metalness: 0, envMapIntensity: 0.2 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -180;
ground.visible = false;
scene.add(ground);

const cityGroup = new THREE.Group();
cityGroup.visible = false;
scene.add(cityGroup);
const cityMat = new THREE.MeshStandardMaterial({ color: 0xffd090, emissive: 0xffaa55, emissiveIntensity: 0.45 });
for (let i = 0; i < (isMobile() ? 20 : 50); i++) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2 + Math.random() * 10, 2.2), cityMat);
  m.position.set((Math.random() - 0.5) * 800, -115 + Math.random() * 8, -280 - Math.random() * 1400);
  cityGroup.add(m);
}


function makeProjectPreview(project, index, highlight = false) {
  /* square canvas — matches A320 DU black bezels */
  const S = 512;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, highlight ? "#1a2433" : "#0c121c");
  g.addColorStop(1, highlight ? "#243044" : "#151c28");
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
  return tex;
}

function paintMfdScreens() {
  const screens = state._mfdScreens || [];
  if (!screens.length) return;
  screens.forEach((slot) => {
    const projectIndex = Math.max(0, slot.projectIndex) % PROJECTS.length;
    const highlight = state.project === projectIndex;
    const tex = makeProjectPreview(PROJECTS[projectIndex], projectIndex, highlight);
    const apply = (mesh) => {
      if (!mesh?.material) return;
      const prev = mesh.material.map;
      mesh.material.map = tex;
      mesh.material.needsUpdate = true;
      if (prev && prev !== tex) prev.dispose();
    };
    apply(slot.decal);
    /* pop plate gets its own texture copy so dispose stays safe */
    if (slot.mesh?.material) {
      const popTex = makeProjectPreview(PROJECTS[projectIndex], projectIndex, highlight);
      const prev = slot.mesh.material.map;
      slot.mesh.material.map = popTex;
      slot.mesh.material.needsUpdate = true;
      if (prev && prev !== popTex) prev.dispose();
    }
    slot.liveIndex = projectIndex;
  });
}

function tickMfdPop() {
  const screens = state._mfdScreens || [];
  if (!screens.length) return;
  const camPos = camera.getWorldPosition(new THREE.Vector3());
  screens.forEach((slot) => {
    const want = state.project === slot.projectIndex ? 1 : 0;
    slot.pop = THREE.MathUtils.lerp(slot.pop || 0, want, 0.16);
    if (slot.decal) {
      slot.decal.visible = slot.pop < 0.85;
      if (slot.decal.material) {
        slot.decal.material.transparent = true;
        slot.decal.material.opacity = 1 - slot.pop * 0.9;
      }
    }
    if (!slot.mesh || !slot.basePos) return;
    if (!slot.popDir) slot.popDir = new THREE.Vector3(0, 0, 1);
    slot.popDir.copy(camPos).sub(slot.basePos).normalize();
    const lift = slot.pop * 0.11;
    const sc = 0.92 + slot.pop * 0.22;
    slot.mesh.visible = slot.pop > 0.02;
    slot.mesh.position.copy(slot.basePos).addScaledVector(slot.popDir, lift);
    slot.mesh.scale.setScalar(sc);
    slot.mesh.lookAt(camPos);
    slot.mesh.material.depthTest = false;
    slot.mesh.renderOrder = 6;
  });
}

function findBlackDuCenters(w, h) {
  /* square black DU windows — fill the full bezel */
  const expect = [
    { fx: 0.318, fy: 0.652 },
    { fx: 0.383, fy: 0.652 },
    { fx: 0.501, fy: 0.651 },
    { fx: 0.612, fy: 0.653 },
    { fx: 0.677, fy: 0.654 },
  ];
  const side = Math.floor(Math.min(w, h) * 0.088);
  return expect.map((e, i) => ({
    projectIndex: i,
    px: Math.floor(w * e.fx),
    py: Math.floor(h * e.fy),
    wPx: side,
    hPx: side,
    n: 100,
  }));
}

function placeMfdOnBlackDus(root) {
  const w = renderer.domElement.width;
  const h = renderer.domElement.height;
  if (!w || !h) return false;

  const prevPop = new Map();
  (state._mfdScreens || []).forEach((s) => prevPop.set(s.projectIndex, s.pop || 0));

  if (state._mfdGroup) state._mfdGroup.visible = false;
  renderer.render(scene, camera);
  const centers = findBlackDuCenters(w, h);
  if (state._mfdGroup) state._mfdGroup.visible = true;
  if (centers.length < 5) return false;
  centers.length = 5;

  const meshes = [];
  root.traverse((o) => {
    if (o.isMesh && o.visible) meshes.push(o);
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const camPos = camera.getWorldPosition(new THREE.Vector3());
  const toward = new THREE.Vector3();
  const eye = new THREE.Euler();

  (state._mfdScreens || []).forEach((s) => {
    [s.decal, s.mesh].forEach((m) => {
      if (!m) return;
      if (m.parent) m.parent.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (m.material.map) m.material.map.dispose();
        m.material.dispose();
      }
    });
  });
  if (state._mfdGroup) cockpit.remove(state._mfdGroup);

  const group = new THREE.Group();
  group.name = "mfdPanelScreens";
  state._mfdScreens = [];

  centers.forEach((c) => {
    ndc.set((c.px / w) * 2 - 1, -((c.py / h) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(meshes, false);
    const hit =
      hits.find((hh) => {
        const mats = Array.isArray(hh.object.material) ? hh.object.material : [hh.object.material];
        return mats.some((m) => String(m?.name || "").toLowerCase().includes("black"));
      }) || hits[0];
    if (!hit || !hit.face) return;

    toward.subVectors(camPos, hit.point).normalize();
    const dist = hit.distance;
    const worldH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const aspect = w / h;
    const duSide = worldH * Math.min(aspect * (c.wPx / w), c.hPx / h) * 1.35;
    const duW = duSide;
    const duH = duSide;
    /* thin projection volume — thick decals look like mid-air slabs */
    const duD = 0.022;

    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
    if (n.dot(toward) < 0) n.negate();
    /* panel-aligned orientation (pitch with MIP), yaw from face normal */
    const yaw = Math.atan2(n.x, n.z);
    eye.set(-0.34, yaw, 0);

    const tex = makeProjectPreview(PROJECTS[c.projectIndex], c.projectIndex, false);
    const decalMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      toneMapped: false,
    });
    let decal = null;
    try {
      const geo = new DecalGeometry(hit.object, hit.point.clone(), eye, new THREE.Vector3(duW, duH, duD));
      decal = new THREE.Mesh(geo, decalMat);
      decal.renderOrder = 2;
      decal.userData.mfd = true;
      scene.add(decal);
    } catch (err) {
      console.warn("[mfd-decal]", err);
    }

    const popMat = new THREE.MeshBasicMaterial({
      map: tex,
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(duW, duH), popMat);
    mesh.visible = false;
    mesh.userData.mfd = true;
    mesh.renderOrder = 6;
    group.add(mesh);

    state._mfdScreens.push({
      mesh,
      decal,
      projectIndex: c.projectIndex,
      liveIndex: c.projectIndex,
      basePos: hit.point.clone().addScaledVector(toward, 0.004),
      popDir: toward.clone(),
      pop: prevPop.get(c.projectIndex) || 0,
      detect: { px: Math.round(c.px), py: Math.round(c.py), parent: hit.object.name },
    });
  });

  cockpit.add(group);
  state._mfdGroup = group;
  paintMfdScreens();
  tickMfdPop();
  console.info("[mfd-panel] " + JSON.stringify(state._mfdScreens.map((s) => s.detect)));
  return state._mfdScreens.length >= 5;
}

function installMfdScreens(root) {
  root.updateMatrixWorld(true);
  state._mfdScreens = [];
  state._mfdGroup = new THREE.Group();
  state._mfdGroup.name = "mfdPanelScreens";
  cockpit.add(state._mfdGroup);
  state._mfdRoot = root;
  window.__SAVEAS_DEBUG = {
    state,
    camera,
    THREE,
    placeMfdOnBlackDus: () => placeMfdOnBlackDus(root),
  };
  let tries = 0;
  const refine = () => {
    tries += 1;
    if (typeof frameSideScreens === "function") frameSideScreens("center");
    cameraRig.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    if (placeMfdOnBlackDus(root) || tries >= 14) return;
    requestAnimationFrame(refine);
  };
  setTimeout(() => requestAnimationFrame(refine), 700);
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
  /* Slightly aft of cabin center, high enough to see panel + both seats + pedestal */
  state._camBase = {
    x: center.x,
    y: box.min.y + Math.min(Math.max(size.y * 0.52, 1.05), 1.45),
    z: center.z + size.z * 0.12,
  };
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
  ground.material.color.lerp(new THREE.Color(e.ground), k);
  /* night: dim cloud layers */
  const night = Math.max(0, 1 - e.elevation / 40);
  for (const layer of cloudLayers) {
    layer.mesh.material.opacity += (layer.opacity * (1 - night * 0.75) - layer.mesh.material.opacity) * k;
  }
  hemi.intensity += ((0.95 - night * 0.55) - hemi.intensity) * k;
  sun.intensity += ((2.4 - night * 1.6) - sun.intensity) * k;
}

function applyProject(index, { maneuver = true } = {}) {
  state.project = index;
  document.querySelectorAll(".route-item").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.index) === index);
  });

  if (index < 0) {
    clearStage();
    el.metaIndex.textContent = "— / 05";
    el.metaName.textContent = "READY";
    setEnv(PROJECTS[0].env);
    cityGroup.visible = false;
    paintMfdScreens();
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

function updateGauges() {
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
  const targets = (state._mfdScreens || []).flatMap((s) => [s.decal, s.mesh].filter(Boolean));
  if (!targets.length) return false;
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(targets, false);
  if (!hits.length) return false;
  const slot = state._mfdScreens.find(
    (s) => s.mesh === hits[0].object || s.decal === hits[0].object
  );
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
  if (!state.dragging || reduce) return;
  const dx = e.clientX - dragLastX;
  const dy = e.clientY - dragLastY;
  dragLastX = e.clientX;
  dragLastY = e.clientY;
  if (Math.hypot(e.clientX - dragDownX, e.clientY - dragDownY) > 8) {
    state.dragMoved = true;
    state.lookSnap = null;
  }
  const sens = isMobile() ? 0.0036 : 0.0028;
  /* keep look inside the windscreen — no fuselage/exterior peek */
  const yawMax = THREE.MathUtils.clamp(0.34 - state.zoom * 0.12, 0.2, 0.34);
  const pitchMin = -0.18;
  const pitchMax = 0.08;
  state.yaw = THREE.MathUtils.clamp(state.yaw - dx * sens, -yawMax, yawMax);
  state.pitch = THREE.MathUtils.clamp(state.pitch - dy * sens, pitchMin, pitchMax);
  state.tYaw = state.yaw;
  state.tPitch = state.pitch;
});

function endDrag(e) {
  if (!state.dragging) return;
  state.dragging = false;
  canvasEl.style.cursor = "grab";
  try {
    canvasEl.releasePointerCapture(e.pointerId);
  } catch (_) {}
  if (!state.dragMoved) tryOpenMfdAt(e.clientX, e.clientY);
}
canvasEl.addEventListener("pointerup", endDrag);
canvasEl.addEventListener("pointercancel", endDrag);

/* Aim at captain / FO panel LCDs — no floating focus plates */
const LOOK_PRESETS = {
  left: { yaw: 0.26, pitch: -0.06, zoom: 0.58, side: -0.1, lift: 0.02 },
  center: { yaw: 0, pitch: -0.02, zoom: 0.28, side: 0, lift: 0 },
  right: { yaw: -0.26, pitch: -0.06, zoom: 0.58, side: 0.1, lift: 0.02 },
};

function frameSideScreens(side) {
  const p = LOOK_PRESETS[side] || LOOK_PRESETS.center;
  state.lookSnap = side;
  state.tYaw = p.yaw;
  state.tPitch = p.pitch;
  state.yaw = p.yaw;
  state.pitch = p.pitch;
  state.tZoom = p.zoom;
  state.zoom = p.zoom;
  state.tRoll = 0;
  state.roll = 0;
  state.tZoomSide = p.side;
  state.zoomSide = p.side;
  state.snapLift = p.lift;
  document.querySelectorAll(".snap-btn").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.look === side);
  });
}

document.querySelectorAll(".snap-btn[data-look]").forEach((btn) => {
  btn.addEventListener("click", () => {
    frameSideScreens(btn.dataset.look);
    if (btn.dataset.look === "center" && state._mfdRoot) {
      requestAnimationFrame(() => {
        setTimeout(() => placeMfdOnBlackDus(state._mfdRoot), 120);
      });
    }
  });
});

const hint = document.createElement("div");
hint.className = "view-hint";
hint.textContent = "←→ 살짝 선회 · ↑ 상승 · ↓ 하강(한계) · LCD 탭 · 드래그 시선";
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

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.15 : 1.35));
});

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

  /* arrow keys: mild bank/turn, climb/descend with floors */
  const k = state.keys || {};
  const turnRate = 0.16;
  const pitchRate = 0.55;
  const rollMax = 0.16;
  const headingMax = 0.38;
  if (k.left) {
    state.tRoll = Math.min(rollMax, state.tRoll + dt * 0.7);
    state.flightHeading = THREE.MathUtils.clamp(
      state.flightHeading + dt * turnRate,
      -headingMax,
      headingMax
    );
    state.tYaw = THREE.MathUtils.clamp(state.tYaw + dt * 0.12, -0.22, 0.22);
  } else if (k.right) {
    state.tRoll = Math.max(-rollMax, state.tRoll - dt * 0.7);
    state.flightHeading = THREE.MathUtils.clamp(
      state.flightHeading - dt * turnRate,
      -headingMax,
      headingMax
    );
    state.tYaw = THREE.MathUtils.clamp(state.tYaw - dt * 0.12, -0.22, 0.22);
  } else if (!state.dragging) {
    state.tRoll += (0 - state.tRoll) * Math.min(1, dt * 3.5);
  }
  /* ↑ climb (nose UP) / ↓ descend (nose DOWN) — Three.js +X pitch looks down, so invert */
  if (k.up) {
    state.altLift = Math.min(140, state.altLift + dt * 38);
    state.tPitch = THREE.MathUtils.clamp(state.tPitch - dt * pitchRate, -0.2, 0.12);
  } else if (k.down) {
    /* floor: stay above the terrain band */
    state.altLift = Math.max(55, state.altLift - dt * 28);
    state.tPitch = THREE.MathUtils.clamp(state.tPitch + dt * pitchRate, -0.2, 0.12);
  } else if (!state.dragging && Math.abs(state.tPitch) > 0.015) {
    state.tPitch += (0 - state.tPitch) * Math.min(1, dt * 1.8);
  }
  if (k.left || k.right || k.up || k.down) {
    state.tSpeed = Math.max(state.tSpeed, 1.15);
  }

  /* while not dragging, ease toward held pose — always stay inside windscreen */
  const yawMax = 0.28;
  const pitchMin = -0.2;
  const pitchMax = 0.12;
  state.tYaw = THREE.MathUtils.clamp(state.tYaw, -yawMax, yawMax);
  state.tPitch = THREE.MathUtils.clamp(state.tPitch, pitchMin, pitchMax);
  state.yaw += (state.tYaw - state.yaw) * (state.dragging ? 1 : 0.28);
  state.pitch += (state.tPitch - state.pitch) * (state.dragging ? 1 : 0.28);
  state.yaw = THREE.MathUtils.clamp(state.yaw, -yawMax, yawMax);
  state.pitch = THREE.MathUtils.clamp(state.pitch, pitchMin, pitchMax);
  state.roll += (state.tRoll - state.roll) * 0.22;
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
  /* slight nose-up bias so horizon sits in the windshield, not under the dash */
  const lookBias = (isMobile() ? 0.02 : 0.04) - state.zoom * 0.04;
  cameraRig.rotation.set(state.pitch + vy * 2 + lookBias, state.yaw, state.roll + vx * 2);
  const dolly = (state.zoom - 0.28) * (isMobile() ? 0.38 : 0.45);
  camera.position.set(
    base.x + vx * 3 + state.zoomSide,
    base.y + vy * 2 - state.zoom * 0.03 + state.snapLift,
    base.z - dolly
  );
  const baseFov = isMobile() ? 66 : 68;
  camera.fov = baseFov - state.zoom * 5 + Math.abs(state.yaw) * 2;
  camera.updateProjectionMatrix();


  if (state._skyDome) {
    /* forward flight: sky scrolls opposite heading (not reverse) */
    state._skyDome.rotation.y = -state.flightHeading * 0.35 - state.flightT * Math.PI * 2 * 0.04;
  }

  /* compressed GMP→USN — scroll so ground moves aft (forward flight) */
  state.flightT = (state.flightT + dt * (0.09 + state.speed * 0.12)) % 1;
  if (state._terrain?.tex) {
    state._terrain.tex.offset.y = state.flightT;
  }
  if (state._groundTex) {
    state._groundTex.offset.y = (state._groundTex.offset.y + dt * (0.08 + state.speed * 0.1)) % 1;
    state._groundTex.offset.x = -state.flightHeading * 0.15;
  }
  /* world turns with banked heading — side windows see same ground */
  terrainGroup.rotation.y = -state.flightHeading;
  terrainGroup.rotation.z = -state.roll * 0.25;
  terrainGroup.position.x = 0;
  terrainGroup.position.y = -state.altLift;

  for (const layer of cloudLayers) {
    layer.mesh.position.x = Math.sin(-state.flightHeading) * (-8 - layer.speed * 0.6);
    layer.mesh.position.y = layer.mesh.geometry.parameters.height * 0.08 + state.pitch * 3;
    if (layer.mesh.material.map) {
      /* clouds drift aft / sideways with turn — not toward the nose */
      layer.mesh.material.map.offset.x -= dt * (0.018 + state.speed * 0.025);
    }
  }

  for (const s of clouds) {
    /* move toward +Z past the ship (from ahead → aft = forward flight) */
    s.position.z += dt * (40 + state.speed * 70);
    s.position.x += (-state.flightHeading * 40 + state.yaw * 8) * dt;
    if (s.position.z > 90) {
      s.position.z = -1200 - Math.random() * 400;
      s.position.x = (Math.random() - 0.5) * 1800;
    }
  }

  tickEnv();
  tickMfdPop();
  if ((gaugeTick++ & 3) === 0) updateGauges();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

applyProject(-1, { maneuver: false });
requestAnimationFrame(animate);
setTimeout(() => document.body.classList.add("is-ready"), 700);

