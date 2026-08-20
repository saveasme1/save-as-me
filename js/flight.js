import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

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
const camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.04, 40000);
camera.position.set(0, 1.22, 0.88);

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

/* ========== DETAILED COCKPIT ========== */
const cockpit = new THREE.Group();
scene.add(cockpit);

const panelNoise = makePanelNoise();
panelNoise.wrapS = panelNoise.wrapT = THREE.RepeatWrapping;
panelNoise.repeat.set(2.5, 2.5);
const bump = makeBumpMap();
bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
bump.repeat.set(3, 3);
const leatherMap = makeLeather();
leatherMap.wrapS = leatherMap.wrapT = THREE.RepeatWrapping;
leatherMap.repeat.set(2, 2);
const brushed = makeBrushed();
brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping;

const ivory = new THREE.MeshPhysicalMaterial({
  color: 0xe9e5dc, map: panelNoise, bumpMap: bump, bumpScale: 0.012,
  roughness: 0.52, metalness: 0.06, clearcoat: 0.22, clearcoatRoughness: 0.45, envMapIntensity: 0.65,
});
const warmGray = new THREE.MeshPhysicalMaterial({
  color: 0xd0cbc0, map: panelNoise, bumpMap: bump, bumpScale: 0.01,
  roughness: 0.48, metalness: 0.12, clearcoat: 0.15, envMapIntensity: 0.7,
});
const aluminum = new THREE.MeshPhysicalMaterial({
  color: 0xc0c3be, map: brushed, roughness: 0.22, metalness: 0.85,
  clearcoat: 0.35, clearcoatRoughness: 0.25, envMapIntensity: 1.25,
});
const darkBezel = new THREE.MeshPhysicalMaterial({
  color: 0x141618, roughness: 0.35, metalness: 0.45, clearcoat: 0.4, envMapIntensity: 0.55,
});
const seatMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, map: leatherMap, roughness: 0.82, metalness: 0.04, envMapIntensity: 0.25,
});
const plastic = new THREE.MeshPhysicalMaterial({
  color: 0x2c3036, roughness: 0.48, metalness: 0.18, clearcoat: 0.3, envMapIntensity: 0.45,
});
const rubber = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.92, metalness: 0.02 });
const ledGreen = new THREE.MeshStandardMaterial({ color: 0x3d9e6f, emissive: 0x1f7a4a, emissiveIntensity: 0.85 });
const ledAmber = new THREE.MeshStandardMaterial({ color: 0xd4a017, emissive: 0xa87810, emissiveIntensity: 0.7 });
const carpet = new THREE.MeshStandardMaterial({
  color: 0x5a5852, map: panelNoise, roughness: 0.95, metalness: 0, envMapIntensity: 0.1,
});

function applyPBR(mat, { map, nor, rough, color = 0xffffff, repeat = 2 } = {}) {
  const prep = (tex, srgb = false) => {
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    tex.anisotropy = 8;
  };
  if (map)
    loader.load(map, (tex) => {
      prep(tex, true);
      mat.map = tex;
      mat.color.set(color);
      mat.needsUpdate = true;
    });
  if (nor)
    loader.load(nor, (tex) => {
      prep(tex, false);
      mat.normalMap = tex;
      mat.normalScale = new THREE.Vector2(0.55, 0.55);
      mat.needsUpdate = true;
    });
  if (rough)
    loader.load(rough, (tex) => {
      prep(tex, false);
      mat.roughnessMap = tex;
      mat.needsUpdate = true;
    });
}
applyPBR(ivory, { map: "assets/tex/paint_diff.jpg", nor: "assets/tex/paint_nor.jpg", rough: "assets/tex/paint_rough.jpg", color: 0xf0ebe3, repeat: 3 });
applyPBR(warmGray, { map: "assets/tex/paint_diff.jpg", nor: "assets/tex/paint_nor.jpg", rough: "assets/tex/paint_rough.jpg", color: 0xd8d2c6, repeat: 2.5 });
applyPBR(aluminum, { map: "assets/tex/metal_diff.jpg", nor: "assets/tex/metal_nor.jpg", rough: "assets/tex/metal_rough.jpg", color: 0xffffff, repeat: 4 });
applyPBR(seatMat, { map: "assets/tex/leather_diff.jpg", nor: "assets/tex/leather_nor.jpg", rough: "assets/tex/leather_rough.jpg", color: 0x3a3d44, repeat: 2 });

function mesh(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = !isMobile();
  m.receiveShadow = !isMobile();
  cockpit.add(m);
  return m;
}
function box(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz);
}
function rbox(w, h, d, r, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  return mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z, rx, ry, rz);
}
function cyl(rTop, rBot, h, mat, x, y, z, rx = 0, ry = 0, rz = 0, seg = 20) {
  return mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat, x, y, z, rx, ry, rz);
}
function bolt(x, y, z, s = 0.012) {
  cyl(s, s, s * 0.7, aluminum, x, y, z, Math.PI / 2, 0, 0, 10);
}
function toggle(x, y, z, on = false, rx = 0, ry = 0) {
  rbox(0.028, 0.018, 0.038, 0.004, plastic, x, y, z, rx, ry, 0);
  box(0.008, 0.028, 0.008, on ? ledGreen : aluminum, x, y + 0.018, z, 0.35 * (on ? 1 : -0.4), ry, 0);
}
function knob(x, y, z, r = 0.016) {
  cyl(r, r * 0.9, 0.014, plastic, x, y, z, Math.PI / 2, 0, 0, 16);
  cyl(r * 0.35, r * 0.35, 0.01, aluminum, x, y, z + 0.008, Math.PI / 2, 0, 0, 10);
}
function rocker(x, y, z) {
  rbox(0.04, 0.012, 0.055, 0.003, plastic, x, y, z);
  box(0.036, 0.006, 0.022, darkBezel, x, y + 0.008, z - 0.01, -0.25, 0, 0);
}

function pillar(x, y, z, h, rx, ry, thick = 0.1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.set(rx, ry, 0);
  const core = new THREE.Mesh(new RoundedBoxGeometry(thick, h, thick * 1.25, 2, 0.014), ivory);
  const trim = new THREE.Mesh(new RoundedBoxGeometry(thick * 1.15, h * 0.98, thick * 0.28, 2, 0.008), aluminum);
  trim.position.z = thick * 0.55;
  const gasket = new THREE.Mesh(new RoundedBoxGeometry(thick * 1.05, h * 0.94, thick * 0.08, 2, 0.006), rubber);
  gasket.position.z = thick * 0.78;
  [core, trim, gasket].forEach((m) => {
    m.castShadow = !isMobile();
    m.receiveShadow = !isMobile();
    g.add(m);
  });
  cockpit.add(g);
  return g;
}

function buildYoke(x, y, z, scale = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  const col = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.42, 6, 12), aluminum);
  col.position.y = 0.05;
  const hub = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.05, 0.08, 2, 0.012), darkBezel);
  hub.position.y = 0.32;
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.022, 14, 36, Math.PI * 1.4), rubber);
  wheel.rotation.set(Math.PI / 2, 0.12, 0);
  wheel.position.set(0, 0.34, 0.02);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.032, 0.04, 2, 0.008), darkBezel);
  bar.position.set(0, 0.34, 0.02);
  const gripL = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.05, 4, 8), rubber);
  gripL.position.set(-0.13, 0.34, 0.02);
  const gripR = gripL.clone();
  gripR.position.x = 0.13;
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.012, 10), ledAmber);
  btn.rotation.x = Math.PI / 2;
  btn.position.set(0.05, 0.355, 0.04);
  [col, hub, wheel, bar, gripL, gripR, btn].forEach((m) => {
    m.castShadow = !isMobile();
    g.add(m);
  });
  cockpit.add(g);
  return g;
}

function buildSeat(x, z, flip = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.12, 0.48, 3, 0.04), seatMat);
  base.position.set(0, 0.38, 0);
  const cushion = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.1, 0.42, 3, 0.045), seatMat);
  cushion.position.set(0, 0.48, 0.02);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.72, 0.1, 3, 0.04), seatMat);
  back.position.set(0, 0.85, 0.22);
  back.rotation.x = -0.12;
  const head = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.16, 0.1, 3, 0.04), seatMat);
  head.position.set(0, 1.28, 0.18);
  const arm = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.05, 0.32, 2, 0.02), plastic);
  arm.position.set(0.28 * flip, 0.7, 0.02);
  const rail = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.35, 4, 8), aluminum);
  rail.position.set(0.28 * flip, 0.55, 0.05);
  rail.rotation.x = Math.PI / 2;
  [base, cushion, back, head, arm, rail].forEach((m) => {
    m.castShadow = !isMobile();
    m.receiveShadow = !isMobile();
    g.add(m);
  });
  cockpit.add(g);
}

rbox(3.5, 0.06, 2.7, 0.02, carpet, 0, 0.0, 0.3);
rbox(0.95, 0.05, 0.75, 0.015, darkBezel, -0.72, 0.05, 0.4);
rbox(0.95, 0.05, 0.75, 0.015, darkBezel, 0.72, 0.05, 0.4);
rbox(0.35, 0.04, 0.55, 0.01, rubber, 0, 0.04, 0.55);

rbox(2.95, 0.06, 1.05, 0.025, ivory, 0, 1.14, -0.9, 0.46, 0, 0);
rbox(2.85, 0.045, 0.55, 0.02, warmGray, 0, 1.22, -0.72, 0.55, 0, 0);
rbox(3.0, 0.09, 0.14, 0.02, aluminum, 0, 1.02, -0.48, 0.1, 0, 0);
rbox(2.92, 0.035, 0.07, 0.01, rubber, 0, 1.08, -0.4);
rbox(2.7, 0.03, 0.12, 0.008, darkBezel, 0, 1.28, -1.15, 0.65, 0, 0);
[-1.1, -0.55, 0, 0.55, 1.1].forEach((x) => bolt(x, 1.05, -0.42));

rbox(2.75, 0.55, 0.2, 0.03, ivory, 0, 0.76, -0.4, -0.4, 0, 0);
rbox(2.7, 0.09, 0.72, 0.02, ivory, 0, 0.52, -0.28, -0.1, 0, 0);
rbox(2.65, 0.045, 0.55, 0.012, aluminum, 0, 0.46, -0.14);
rbox(2.55, 0.03, 0.5, 0.008, darkBezel, 0, 0.49, -0.12);
[-0.28, 0.28].forEach((x) => rbox(0.04, 0.42, 0.08, 0.008, plastic, x, 0.82, -0.32, -0.4, 0, 0));

rbox(0.5, 0.58, 1.28, 0.035, warmGray, 0, 0.34, 0.3);
rbox(0.46, 0.05, 1.0, 0.015, darkBezel, 0, 0.66, 0.2);
rbox(0.42, 0.04, 0.35, 0.01, plastic, 0, 0.7, 0.55);
const fmcTex = makeFMC();
mesh(
  new THREE.PlaneGeometry(0.34, 0.24),
  new THREE.MeshStandardMaterial({
    map: fmcTex, emissiveMap: fmcTex, emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.35,
  }),
  0, 0.74, 0.48, -1.05, 0, 0
);
for (let i = 0; i < 8; i++) {
  rbox(0.032, 0.012, 0.028, 0.004, plastic, -0.14 + (i % 4) * 0.09, 0.72, 0.62 + Math.floor(i / 4) * 0.06);
}
[-0.11, 0.0, 0.11].forEach((x, i) => {
  const lean = 0.35 + i * 0.04;
  cyl(0.014, 0.014, 0.32, aluminum, x, 0.84, 0.02, lean, 0, 0, 14);
  cyl(0.026, 0.022, 0.055, rubber, x, 0.98, -0.04, lean, 0, 0, 14);
  rbox(0.04, 0.02, 0.03, 0.006, darkBezel, x, 1.01, -0.06, lean, 0, 0);
});
box(0.012, 0.18, 0.012, aluminum, -0.2, 0.78, 0.22, 0.55, 0, 0.2);
box(0.012, 0.18, 0.012, aluminum, 0.2, 0.78, 0.22, 0.55, 0, -0.2);
cyl(0.018, 0.018, 0.025, ledAmber, -0.2, 0.88, 0.15, Math.PI / 2, 0, 0);
cyl(0.018, 0.018, 0.025, ledGreen, 0.2, 0.88, 0.15, Math.PI / 2, 0, 0);
[-0.22, 0.22].forEach((x) => {
  cyl(0.075, 0.075, 0.018, plastic, x, 0.52, 0.58, 0, 0, Math.PI / 2, 24);
  cyl(0.02, 0.02, 0.022, aluminum, x, 0.52, 0.58, 0, 0, Math.PI / 2, 12);
});
for (let i = 0; i < 6; i++) knob(-0.16 + i * 0.065, 0.69, 0.08, 0.012);

rbox(0.48, 0.78, 1.55, 0.04, ivory, -1.34, 0.55, 0.1, 0, 0.18, 0);
rbox(0.44, 0.7, 1.4, 0.035, ivory, 1.36, 0.5, 0.1, 0, -0.16, 0);
rbox(0.4, 0.035, 1.15, 0.01, darkBezel, -1.34, 0.9, 0.02, 0, 0.18, 0);
rbox(0.36, 0.035, 1.05, 0.01, darkBezel, 1.36, 0.82, 0.02, 0, -0.16, 0);
for (let i = 0; i < 12; i++) {
  toggle(-1.3, 0.94, -0.4 + i * 0.09, i % 4 === 0, 0, 0.18);
  rocker(1.32, 0.86, -0.35 + i * 0.09);
}
for (let i = 0; i < 5; i++) knob(-1.28, 0.88, 0.55 + i * 0.08, 0.014);
cyl(0.015, 0.015, 1.1, aluminum, -1.55, 1.15, 0.05, 0, 0, Math.PI / 2, 12);
cyl(0.015, 0.015, 1.0, aluminum, 1.58, 1.1, 0.05, 0, 0, Math.PI / 2, 12);

rbox(2.9, 0.08, 0.22, 0.02, aluminum, 0, 0.95, -1.05, 0.15, 0, 0);
/* Windshield frame as one assembly — post shares Z with sill + header */
(() => {
  const z = -1.1;
  const ySill = 1.0;
  const yHead = 2.5;
  const postH = yHead - ySill;
  const postY = (ySill + yHead) / 2;
  rbox(3.45, 0.12, 0.24, 0.025, aluminum, 0, ySill, z, 0.08, 0, 0);
  rbox(3.45, 0.16, 0.28, 0.03, aluminum, 0, yHead, z, 0.12, 0, 0);
  /* Roof mass: header → overhead, no crack of sky above the post */
  rbox(3.4, 0.55, 0.95, 0.04, ivory, 0, 2.48, -0.35, 0.55, 0, 0);
  rbox(3.35, 0.2, 0.55, 0.03, warmGray, 0, 2.42, -0.7, 0.4, 0, 0);
  rbox(0.07, postH + 0.08, 0.16, 0.018, ivory, 0, postY + 0.02, z, 0.04, 0, 0);
  rbox(0.09, postH, 0.06, 0.014, aluminum, 0, postY, z + 0.07, 0.04, 0, 0);
  rbox(0.7, 0.12, 0.2, 0.025, aluminum, 0, yHead, z + 0.04, 0.1, 0, 0);
  rbox(0.65, 0.1, 0.18, 0.02, aluminum, 0, ySill, z + 0.04, 0.08, 0, 0);
})();

rbox(2.35, 0.1, 1.45, 0.03, warmGray, 0, 2.32, -0.05, 0.88, 0, 0);
mesh(
  new THREE.PlaneGeometry(1.75, 1.0),
  new THREE.MeshStandardMaterial({ map: makeOverhead(), roughness: 0.55, metalness: 0.05, envMapIntensity: 0.35 }),
  0,
  2.14,
  0.28,
  0.98,
  0,
  0
);
const ohRows = isMobile() ? 3 : 5;
const ohCols = isMobile() ? 8 : 14;
for (let row = 0; row < ohRows; row++) {
  for (let col = 0; col < ohCols; col++) {
    const x = -0.78 + col * 0.115;
    const z = -0.2 + row * 0.13;
    const y = 2.02 - row * 0.015;
    if ((col + row) % 5 === 0) knob(x, y, z, 0.011);
    else if ((col + row) % 3 === 0) rocker(x, y, z);
    else toggle(x, y, z, (col + row) % 7 === 0, 0.95, 0);
  }
}

/* No transmission glass — Physical transmission was blacking out the view */
const glassMat = new THREE.MeshStandardMaterial({
  color: 0xffe8d0,
  transparent: true,
  opacity: 0.04,
  roughness: 0.05,
  metalness: 0,
  depthWrite: false,
  envMapIntensity: 0.25,
});

// One continuous glass pane + single center post already built into header/sill
mesh(new THREE.PlaneGeometry(5.1, 1.6), glassMat, 0, 1.72, -1.13, 0.04, 0, 0);
mesh(new THREE.PlaneGeometry(1.1, 1.0), glassMat, -1.78, 1.38, 0.08, 0.03, Math.PI / 2.05, 0);
mesh(new THREE.PlaneGeometry(1.05, 0.95), glassMat, 1.8, 1.36, 0.1, 0.03, -Math.PI / 2.05, 0);

function screen(tex, w, h, x, y, z, rx) {
  rbox(w + 0.07, h + 0.07, 0.055, 0.012, darkBezel, x, y, z - 0.01, rx, 0, 0);
  rbox(w + 0.04, h + 0.04, 0.02, 0.006, plastic, x, y, z + 0.008, rx, 0, 0);
  rbox(w + 0.018, h + 0.018, 0.008, 0.003, aluminum, x, y, z + 0.016, rx, 0, 0);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
    cyl(0.005, 0.005, 0.01, aluminum, x + sx * (w * 0.48), y + sy * (h * 0.48), z + 0.02, Math.PI / 2, 0, 0, 8);
  });
  const panel = mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: 0xffffff,
      emissiveIntensity: 1.05,
      roughness: 0.22,
      metalness: 0.08,
    }),
    x, y, z + 0.028, rx, 0, 0
  );
  mesh(
    new THREE.PlaneGeometry(w * 0.995, h * 0.995),
    new THREE.MeshStandardMaterial({
      color: 0xa8c8e8,
      transparent: true,
      opacity: 0.12,
      roughness: 0.05,
      metalness: 0.4,
      depthWrite: false,
    }),
    x, y, z + 0.032, rx, 0, 0
  );
  return panel;
}
screen(makePFD(), 0.5, 0.44, -0.58, 0.88, -0.26, -0.5);
screen(makeND(), 0.5, 0.44, 0.0, 0.88, -0.28, -0.5);
screen(makeEICAS(), 0.44, 0.5, 0.58, 0.86, -0.24, -0.5);
screen(makeND(), 0.28, 0.22, -0.35, 0.58, -0.02, -0.7);
screen(makePFD(), 0.28, 0.22, 0.35, 0.58, -0.02, -0.7);
for (let i = 0; i < 10; i++) {
  knob(-0.9 + i * 0.2, 0.55, -0.05, 0.013);
  if (i % 2 === 0) toggle(-0.8 + i * 0.2, 0.52, 0.05, i % 4 === 0);
}

buildYoke(0.58, 0.42, 0.42, 1);
buildYoke(-0.55, 0.4, 0.48, 0.92);
buildSeat(-0.58, 0.98, -1);
buildSeat(0.58, 0.98, 1);

rbox(3.2, 2.2, 0.12, 0.04, warmGray, 0, 1.4, 1.65);
rbox(1.2, 0.8, 0.08, 0.03, ivory, 0, 1.5, 1.58);
cyl(0.04, 0.04, 0.5, aluminum, -1.2, 1.8, 1.5, 0, 0, Math.PI / 2);
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
  const camY = isMobile() ? 1.18 : 1.22;
  const camZ = isMobile() ? 0.82 : 0.88;
  const lookBias = isMobile() ? -0.02 : -0.06;
  cameraRig.rotation.set(state.pitch + vy * 2 + lookBias, state.yaw, state.roll + vx * 2);
  camera.position.set(vx * 5, camY + vy * 4, camZ);

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
