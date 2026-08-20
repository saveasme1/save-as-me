import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

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
    env: { turbidity: 4.5, elevation: 12, azimuth: 188, rayleigh: 2.2, exposure: 1.05, ground: 0x6a5040 },
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
    env: { turbidity: 5.0, elevation: 10, azimuth: 195, rayleigh: 2.0, exposure: 1.08, ground: 0x7a5a40 },
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
    env: { turbidity: 3.8, elevation: 14, azimuth: 180, rayleigh: 1.8, exposure: 1.1, ground: 0x8a6a50 },
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
    env: { turbidity: 6.0, elevation: 8, azimuth: 200, rayleigh: 2.4, exposure: 0.95, ground: 0x5a4030 },
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
    env: { turbidity: 7.2, elevation: 6, azimuth: 210, rayleigh: 2.6, exposure: 0.9, ground: 0x4a3828 },
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
  _sunEl: 14,
  _sunAz: 190,
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
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile(), powerPreference: "high-performance", alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.4 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = !isMobile();
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);
mount.style.background = "center / cover no-repeat url('assets/tex/cockpit-ref.jpg'), #ff8a3a";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 40000);
camera.position.set(0, 1.15, 1.35);

const cameraRig = new THREE.Group();
cameraRig.add(camera);
scene.add(cameraRig);

const hemi = new THREE.HemisphereLight(0xffc080, 0xd09060, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xff9a40, 3.4);
sun.position.set(40, 60, -20);
sun.castShadow = !isMobile();
if (sun.castShadow) {
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  sun.shadow.bias = -0.0004;
}
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

/* Photoreal golden sunset only — procedural Sky was overpainting the vista */
const sky = new Sky();
sky.scale.setScalar(45000);
sky.visible = false;
scene.add(sky);
const skyU = sky.material.uniforms;
skyU.turbidity.value = 5.5;
skyU.rayleigh.value = 2.4;
skyU.mieCoefficient.value = 0.006;
skyU.mieDirectionalG.value = 0.88;
const sunPos = new THREE.Vector3();
function setSun(elDeg, az) {
  const phi = THREE.MathUtils.degToRad(90 - elDeg);
  const theta = THREE.MathUtils.degToRad(az);
  sunPos.setFromSphericalCoords(1, phi, theta);
  skyU.sunPosition.value.copy(sunPos);
  sun.position.copy(sunPos).multiplyScalar(140);
}
setSun(8, 200);
scene.background = null;

const loader = new THREE.TextureLoader();

/* Rotating photoreal sky dome — continuous flight motion */
const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(1200, 64, 32),
  new THREE.MeshBasicMaterial({
    color: 0xffb070,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
  })
);
scene.add(skyDome);
state._skyDome = skyDome;
state._skyScroll = 0;

loader.load("assets/tex/cockpit-ref.jpg", (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  skyDome.material.map = tex;
  skyDome.material.color.set(0xffffff);
  skyDome.material.needsUpdate = true;
});

/* Soft scrolling cloud veil (same sunset warmth — no mountain plate) */
loader.load("assets/tex/cockpit-ref.jpg", (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(1.35, 1);
  const layer = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 70),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      toneMapped: false,
    })
  );
  layer.position.set(0, 5, -48);
  scene.add(layer);
  state._cloudLayer = layer;
  state._farCloud = null;
});

new RGBELoader().load("assets/sky/khronos-env.hdr", (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdr;
});

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(12000, 96),
  new THREE.MeshStandardMaterial({ color: 0xc48848, roughness: 1, metalness: 0, envMapIntensity: 0.2 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -180;
ground.visible = false;
scene.add(ground);

/* No floating photo-planes / film / sprites — sky dome only (keeps window view clean) */
const clouds = [];

const cityGroup = new THREE.Group();
cityGroup.visible = false;
scene.add(cityGroup);
const cityMat = new THREE.MeshStandardMaterial({ color: 0xffd090, emissive: 0xffaa55, emissiveIntensity: 0.45 });
for (let i = 0; i < (isMobile() ? 45 : 120); i++) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2 + Math.random() * 10, 2.2), cityMat);
  m.position.set((Math.random() - 0.5) * 800, -115 + Math.random() * 8, -280 - Math.random() * 1400);
  cityGroup.add(m);
}

/* ========== A320 FLIGHTDECK (IDG-A32X fd_complete) ========== */
const cockpit = new THREE.Group();
scene.add(cockpit);
state._cockpitReady = false;
state._camBase = { x: 0, y: 1.15, z: 1.35 };

function prepareCockpitMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = !isMobile();
    o.receiveShadow = !isMobile();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if (!m) return;
      const n = String(m.name || "").toLowerCase();
      if (n.includes("glass") || n.includes("visor")) {
        m.transparent = true;
        m.opacity = Math.min(m.opacity || 0.25, 0.35);
        m.depthWrite = false;
        m.side = THREE.DoubleSide;
      } else if (m.transparent && m.opacity < 0.2) {
        /* keep intentional near-invisible helpers hidden */
        m.depthWrite = false;
      } else {
        m.transparent = false;
        m.opacity = 1;
        m.depthWrite = true;
      }
      if ("envMapIntensity" in m) m.envMapIntensity = 1.05;
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
    const root = gltf.scene;
    prepareCockpitMaterials(root);
    cockpit.add(root);
    fitCockpitView(root);
    /* Cabin fill so textured panels read clearly */
    const fill = new THREE.HemisphereLight(0xffe2c4, 0x2a3038, 0.85);
    cockpit.add(fill);
    const key = new THREE.DirectionalLight(0xfff0dd, 1.35);
    key.position.set(0.4, 2.2, 1.2);
    cockpit.add(key);
    document.body.classList.add("is-cockpit-ready");
  },
  undefined,
  (err) => {
    console.error("A320 cockpit GLB failed", err);
  }
);

/* ========== UI ========== */
function show(card) {
  [el.hero, el.project, el.system, el.contact].forEach((c) => c.classList.add("is-hidden"));
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
}

function applyProject(index, { maneuver = true } = {}) {
  state.project = index;
  document.querySelectorAll(".route-item").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.index) === index);
  });

  if (index < 0) {
    show(el.hero);
    el.metaIndex.textContent = "— / 05";
    el.metaName.textContent = "READY";
    setEnv(PROJECTS[0].env);
    cityGroup.visible = false;
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
  const alt = p.alt + state.speed * 35 + Math.sin(state.vibe) * 10;
  const spd = 240 + state.speed * 90 + state.velocity * 35;
  const hdg = (p.hdg + state.yaw * 35 + 360) % 360;
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
  if (state.project < 0) show(el.hero);
  else show(el.project);
});

window.addEventListener(
  "pointermove",
  (e) => {
    if (reduce) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    state.tYaw = nx * (isMobile() ? 0.28 : 0.62);
    state.tPitch = -ny * (isMobile() ? 0.12 : 0.22);
    if (el.flightUi) {
      el.flightUi.style.setProperty("--ui-x", `${nx * 5}px`);
      el.flightUi.style.setProperty("--ui-y", `${ny * 3}px`);
      el.flightUi.classList.add("is-tilted");
    }
  },
  { passive: true }
);

window.addEventListener(
  "wheel",
  (e) => {
    state.velocity = Math.min(1.6, Math.abs(e.deltaY) / 70);
    state.tSpeed = 1 + Math.min(1.15, state.velocity);
    state._scrollAcc = (state._scrollAcc || 0) + e.deltaY;
    if (state._scrollAcc > 400) {
      state._scrollAcc = 0;
      applyProject(Math.min(4, state.project < 0 ? 0 : state.project + 1));
    } else if (state._scrollAcc < -400) {
      state._scrollAcc = 0;
      applyProject(state.project <= 0 ? -1 : state.project - 1);
    }
  },
  { passive: true }
);

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") applyProject(Math.min(4, state.project < 0 ? 0 : state.project + 1));
  if (e.key === "ArrowUp") applyProject(state.project <= 0 ? -1 : state.project - 1);
  if (e.key === "c" || e.key === "C") {
    show(el.contact);
    cityGroup.visible = true;
    setEnv(PROJECTS[4].env);
  }
});

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.35 : 2));
});

let prev = performance.now();
function animate(now) {
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;

  state.speed += (state.tSpeed - state.speed) * 0.045;
  state.velocity *= 0.93;
  if (state.velocity < 0.02) {
    state.velocity = 0;
    state.tSpeed += (1 - state.tSpeed) * 0.035;
  }
  state.yaw += (state.tYaw - state.yaw) * 0.14;
  state.pitch += (state.tPitch - state.pitch) * 0.12;
  state.roll += (state.tRoll - state.roll) * 0.1;
  state.vibe += dt;

  const vx = reduce ? 0 : Math.sin(state.vibe * 1.4) * 0.0018;
  const vy = reduce ? 0 : Math.cos(state.vibe * 1.15) * 0.002;
  const base = state._camBase || { x: 0, y: 1.15, z: 1.35 };
  const lookBias = isMobile() ? -0.015 : -0.04;
  cameraRig.rotation.set(state.pitch + vy * 2 + lookBias, state.yaw, state.roll + vx * 2);
  camera.position.set(base.x + vx * 4, base.y + vy * 3, base.z);

  if (state._skyDome) {
    state._skyDome.rotation.y += dt * (0.03 + state.speed * 0.045);
  }
  state._skyScroll = (state._skyScroll || 0) + dt * (1.1 + state.speed * 1.6);
  mount.style.setProperty("--sky-x", `${50 + state.yaw * -28 - state._skyScroll * 3.2}%`);
  mount.style.setProperty("--sky-y", `${42 + state.pitch * 22 + Math.sin(state.vibe * 0.35) * 1.5}%`);

  if (state._cloudLayer) {
    state._cloudLayer.position.x = state.yaw * -14;
    state._cloudLayer.position.y = 5 + state.pitch * 5;
    if (state._cloudLayer.material.map) {
      state._cloudLayer.material.map.offset.x += dt * (0.045 + state.speed * 0.07);
    }
  }

  for (const s of clouds) {
    s.position.z += dt * (22 + state.speed * 55);
    s.position.x += state.yaw * dt * 12;
    if (s.position.z > 90) {
      s.position.z = -1600 - Math.random() * 500;
      s.position.x = (Math.random() - 0.5) * 2200;
    }
  }

  ground.rotation.z = state.yaw * 0.12;

  tickEnv();
  updateGauges();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

applyProject(-1, { maneuver: false });
requestAnimationFrame(animate);
setTimeout(() => document.body.classList.add("is-ready"), 700);
