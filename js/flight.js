import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
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
  _sunEl: 34,
  _sunAz: 168,
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
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    const mid = h * 0.5;
    ctx.fillStyle = "#2f6fad";
    ctx.fillRect(0, 0, w, mid);
    ctx.fillStyle = "#6b4a2e";
    ctx.fillRect(0, mid, w, h);
    for (let i = -4; i <= 4; i++) {
      const y = mid + i * 28;
      ctx.strokeStyle = i === 0 ? "#fff" : "rgba(255,255,255,0.55)";
      ctx.lineWidth = i === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.35, y);
      ctx.lineTo(w * 0.65, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#0a0c10";
    ctx.fillRect(0, 0, 70, h);
    ctx.fillRect(w - 70, 0, 70, h);
    ctx.fillStyle = "#9ef0c4";
    ctx.font = "bold 26px monospace";
    ctx.fillText("312", 14, mid);
    ctx.fillText("FL124", w - 62, mid - 40);
    ctx.fillStyle = "#f0c45a";
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - 28, mid);
    ctx.lineTo(w * 0.5 - 8, mid);
    ctx.moveTo(w * 0.5 + 8, mid);
    ctx.lineTo(w * 0.5 + 28, mid);
    ctx.moveTo(w * 0.5, mid - 10);
    ctx.lineTo(w * 0.5, mid + 10);
    ctx.strokeStyle = "#f0c45a";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#8a8780";
    ctx.font = "16px monospace";
    ctx.fillText("PFD", 18, h - 18);
  }, 512, 512);
}

function makeND() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#03060c";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#163528";
    for (let r = 36; r < 230; r += 36) {
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.62, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "#e84ad0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.62);
    ctx.quadraticCurveTo(w * 0.72, h * 0.38, w * 0.8, h * 0.14);
    ctx.stroke();
    ctx.strokeStyle = "#4dff9a";
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.62);
    ctx.lineTo(w * 0.4, h * 0.2);
    ctx.stroke();
    ctx.fillStyle = "#f0c45a";
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.56);
    ctx.lineTo(w / 2 - 12, h * 0.7);
    ctx.lineTo(w / 2 + 12, h * 0.7);
    ctx.fill();
    ctx.fillStyle = "#8a8780";
    ctx.font = "16px monospace";
    ctx.fillText("ND / ROUTE", 18, h - 18);
  }, 512, 512);
}

function makeEICAS() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#05070c";
    ctx.fillRect(0, 0, w, h);
    ["ENG 1", "ENG 2", "HYD", "ELEC", "FUEL", "CABIN"].forEach((label, i) => {
      const y = 42 + i * 72;
      ctx.fillStyle = "#141a26";
      ctx.fillRect(28, y, w - 56, 52);
      ctx.fillStyle = i < 2 ? "#3d9e6f" : "#d4a017";
      ctx.fillRect(28, y, 7, 52);
      ctx.fillStyle = "#e8e6e1";
      ctx.font = "22px monospace";
      ctx.fillText(label, 48, y + 34);
      ctx.fillStyle = "#3d9e6f";
      ctx.fillText("NORMAL", w - 160, y + 34);
    });
  }, 512, 640);
}

function makeOverhead() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#d2cec4";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 20; x++) {
        const px = 14 + x * 24.5;
        const py = 12 + y * 38;
        ctx.fillStyle = "#2c3036";
        ctx.fillRect(px, py, 14, 20);
        ctx.fillStyle = (x * 3 + y) % 7 === 0 ? "#3d9e6f" : (x + y) % 11 === 0 ? "#c45a2a" : "#5a6068";
        ctx.beginPath();
        ctx.arc(px + 7, py + 7, 2.6, 0, Math.PI * 2);
        ctx.fill();
        if ((x + y) % 9 === 0) {
          ctx.fillStyle = "#1a1c20";
          ctx.beginPath();
          ctx.arc(px + 7, py + 16, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.fillStyle = "#5a5853";
    ctx.font = "18px monospace";
    ctx.fillText("OVERHEAD PANEL", 16, h - 14);
  }, 640, 480);
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
    for (let i = 0; i < 12000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
    }
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(80,70,55,${0.04 + Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * h);
      ctx.lineTo(w, Math.random() * h);
      ctx.stroke();
    }
  }, 512, 512);
}

/* ========== renderer / scene ========== */
const mount = document.getElementById("webgl");
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile(), powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.35 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.05, 40000);
camera.position.set(0, 1.28, 0.95);

const cameraRig = new THREE.Group();
cameraRig.add(camera);
scene.add(cameraRig);

const hemi = new THREE.HemisphereLight(0xb8d8ff, 0xe8dfd2, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
sun.position.set(40, 60, -20);
scene.add(sun);
const cabin = new THREE.PointLight(0xfff4e6, 1.15, 10);
cabin.position.set(0, 1.55, 0.35);
scene.add(cabin);
const dashLight = new THREE.SpotLight(0xffffff, 0.85, 7, Math.PI / 2.6, 0.45);
dashLight.position.set(0, 1.9, 0.9);
dashLight.target.position.set(0, 0.75, -0.7);
scene.add(dashLight, dashLight.target);
const screenGlow = new THREE.PointLight(0x6ec8ff, 0.35, 4);
screenGlow.position.set(0, 0.85, -0.2);
scene.add(screenGlow);

/* Procedural sky fill + photoreal equirect dome */
const sky = new Sky();
sky.scale.setScalar(45000);
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

const loader = new THREE.TextureLoader();
const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(4200, 64, 32),
  new THREE.MeshBasicMaterial({ color: 0x7eb6e8, side: THREE.BackSide, depthWrite: false })
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

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(12000, 96),
  new THREE.MeshStandardMaterial({ color: 0x7f9a6a, roughness: 1, metalness: 0, envMapIntensity: 0.35 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -120;
scene.add(ground);

/* Photo cloud layers (parallax) */
const cloudLayers = [];
function addPhotoCloud(url, w, h, z, opacity) {
  loader.load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    m.position.set(0, h * 0.08, z);
    scene.add(m);
    cloudLayers.push({ mesh: m, baseZ: z, speed: 6 + Math.random() * 10, opacity });
  });
}
addPhotoCloud("assets/sky/clouds-front.jpg", 110, 42, -38, 0.42);
addPhotoCloud("assets/sky/clouds-drama.jpg", 160, 60, -70, 0.32);
addPhotoCloud("assets/sky/sky-clouds.jpg", 220, 80, -140, 0.22);

/* Scrolling cloud film (motion without broken stock video) */
const filmCanvas = document.createElement("canvas");
filmCanvas.width = 1024;
filmCanvas.height = 512;
const filmCtx = filmCanvas.getContext("2d");
const filmTex = new THREE.CanvasTexture(filmCanvas);
filmTex.colorSpace = THREE.SRGBColorSpace;
filmTex.wrapS = THREE.RepeatWrapping;
const filmMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(55, 55, 28, 48, 1, true),
  new THREE.MeshBasicMaterial({
    map: filmTex,
    transparent: true,
    opacity: 0.5,
    side: THREE.BackSide,
    depthWrite: false,
  })
);
filmMesh.position.set(0, 10, -20);
filmMesh.scale.x = -1;
scene.add(filmMesh);
state._film = { canvas: filmCanvas, ctx: filmCtx, tex: filmTex, mesh: filmMesh, imgs: [], offset: 0 };
["assets/sky/clouds-front.jpg", "assets/sky/clouds-drama.jpg", "assets/sky/horizon-wide.jpg"].forEach((url) => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => state._film.imgs.push(img);
  img.src = url;
});

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
const nCloud = isMobile() ? 18 : 40;
for (let i = 0; i < nCloud; i++) {
  const mat = new THREE.SpriteMaterial({ map: softCloud, transparent: true, depthWrite: false, opacity: 0.5 });
  const s = new THREE.Sprite(mat);
  const sc = 70 + Math.random() * 180;
  s.scale.set(sc, sc * 0.4, 1);
  s.position.set((Math.random() - 0.5) * 2200, 40 + Math.random() * 160, -140 - Math.random() * 1800);
  cloudGroup.add(s);
  clouds.push(s);
}

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
panelNoise.repeat.set(2, 2);

const ivory = new THREE.MeshStandardMaterial({
  color: 0xe8e4db,
  map: panelNoise,
  roughness: 0.58,
  metalness: 0.08,
  envMapIntensity: 0.55,
});
const warmGray = new THREE.MeshStandardMaterial({
  color: 0xcfc9be,
  map: panelNoise,
  roughness: 0.5,
  metalness: 0.14,
  envMapIntensity: 0.6,
});
const aluminum = new THREE.MeshStandardMaterial({
  color: 0xb4b7b2,
  roughness: 0.28,
  metalness: 0.72,
  envMapIntensity: 1.1,
});
const darkBezel = new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: 0.4, metalness: 0.35, envMapIntensity: 0.4 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x363940, roughness: 0.88, metalness: 0.04 });
const plastic = new THREE.MeshStandardMaterial({ color: 0x2a2d32, roughness: 0.55, metalness: 0.2 });

function mesh(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  cockpit.add(m);
  return m;
}
function box(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz);
}
function cyl(rTop, rBot, h, mat, x, y, z, rx = 0, ry = 0, rz = 0, seg = 16) {
  return mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat, x, y, z, rx, ry, rz);
}

// Floor + footwells
box(3.4, 0.05, 2.6, warmGray, 0, 0.01, 0.25);
box(0.9, 0.08, 0.7, darkBezel, -0.7, 0.06, 0.35);
box(0.9, 0.08, 0.7, darkBezel, 0.7, 0.06, 0.35);

// Main glare shield / coaming
box(2.95, 0.07, 1.05, ivory, 0, 1.12, -0.92, 0.48, 0, 0);
box(2.98, 0.1, 0.16, aluminum, 0, 1.0, -0.5, 0.12, 0, 0);
box(2.9, 0.04, 0.08, plastic, 0, 1.06, -0.42);

// Instrument panel body (stepped)
box(2.7, 0.58, 0.22, ivory, 0, 0.74, -0.42, -0.38, 0, 0);
box(2.65, 0.1, 0.75, ivory, 0, 0.5, -0.32, -0.12, 0, 0);
box(2.6, 0.05, 0.55, aluminum, 0, 0.44, -0.18);

// Center pedestal + throttles + FMC
box(0.48, 0.62, 1.25, warmGray, 0, 0.36, 0.28);
box(0.44, 0.06, 0.95, darkBezel, 0, 0.68, 0.18);
const fmcTex = makeFMC();
mesh(
  new THREE.PlaneGeometry(0.36, 0.26),
  new THREE.MeshStandardMaterial({
    map: fmcTex,
    emissiveMap: fmcTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.35,
    roughness: 0.4,
  }),
  0,
  0.72,
  0.42,
  -1.05,
  0,
  0
);
// throttle levers with knobs
[-0.1, 0.1].forEach((x) => {
  box(0.035, 0.28, 0.035, aluminum, x, 0.82, 0.02, 0.45, 0, 0);
  cyl(0.028, 0.028, 0.05, darkBezel, x, 0.96, -0.05, 0.45, 0, 0);
  cyl(0.018, 0.018, 0.04, plastic, x - 0.05, 0.7, 0.2, Math.PI / 2, 0, 0);
});
// trim wheels
cyl(0.07, 0.07, 0.02, plastic, -0.2, 0.55, 0.55, 0, 0, Math.PI / 2, 20);
cyl(0.07, 0.07, 0.02, plastic, 0.2, 0.55, 0.55, 0, 0, Math.PI / 2, 20);

// Side consoles
box(0.46, 0.82, 1.5, ivory, -1.32, 0.58, 0.08, 0, 0.2, 0);
box(0.42, 0.72, 1.35, ivory, 1.35, 0.52, 0.08, 0, -0.18, 0);
box(0.38, 0.04, 1.1, darkBezel, -1.32, 0.92, 0.0, 0, 0.2, 0);
box(0.34, 0.04, 1.0, darkBezel, 1.35, 0.85, 0.0, 0, -0.18, 0);
// side switch rows
for (let i = 0; i < 10; i++) {
  box(0.04, 0.03, 0.06, plastic, -1.28, 0.96, -0.35 + i * 0.1, 0, 0.2, 0);
  cyl(0.012, 0.012, 0.02, i % 3 === 0 ? new THREE.MeshStandardMaterial({ color: 0x3d9e6f, emissive: 0x1a5a3a, emissiveIntensity: 0.6 }) : aluminum, -1.28, 0.99, -0.35 + i * 0.1);
}

// Window A-pillars (thick airliner)
box(0.14, 1.7, 0.22, warmGray, -0.68, 1.52, -1.12, 0.14, 0.3, 0);
box(0.16, 1.8, 0.24, warmGray, 0.05, 1.58, -1.3, 0.12, 0, 0);
box(0.14, 1.65, 0.22, warmGray, 0.82, 1.5, -1.1, 0.14, -0.34, 0);
box(0.18, 1.85, 0.26, ivory, -1.42, 1.55, -0.62, 0.06, 0.48, 0);
box(0.18, 1.75, 0.24, ivory, 1.48, 1.52, -0.58, 0.06, -0.46, 0);
// sill / brow
box(3.15, 0.12, 0.22, aluminum, 0, 2.22, -0.9, 0.28, 0, 0);
box(3.1, 0.55, 0.14, ivory, 0, 2.42, -0.48, 0.18, 0, 0);
box(3.0, 0.08, 0.1, plastic, 0, 2.08, -0.78, 0.2, 0, 0);

// Overhead panel + physical switches
box(1.95, 0.1, 1.2, warmGray, 0, 2.22, 0.2, 0.92, 0, 0);
mesh(
  new THREE.PlaneGeometry(1.7, 0.95),
  new THREE.MeshStandardMaterial({ map: makeOverhead(), roughness: 0.65, metalness: 0.05, envMapIntensity: 0.3 }),
  0,
  2.1,
  0.25,
  0.95,
  0,
  0
);
if (!isMobile()) {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      const x = -0.7 + col * 0.12;
      const z = -0.15 + row * 0.14;
      box(0.035, 0.04, 0.02, plastic, x, 2.0 - row * 0.02, z, 0.95, 0, 0);
    }
  }
}

// Glass windshield panes
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 0.96,
  transparent: true,
  opacity: 0.08,
  roughness: 0.04,
  metalness: 0,
  thickness: 0.2,
  ior: 1.2,
  depthWrite: false,
  envMapIntensity: 1.2,
});
mesh(new THREE.PlaneGeometry(1.2, 1.2), glassMat, -1.0, 1.55, -1.05, 0.08, 0.42, 0.04);
mesh(new THREE.PlaneGeometry(1.55, 1.28), glassMat, 0.02, 1.6, -1.28, 0.12, 0, 0);
mesh(new THREE.PlaneGeometry(1.1, 1.15), glassMat, 1.1, 1.52, -1.02, 0.08, -0.48, -0.04);
mesh(new THREE.PlaneGeometry(0.9, 0.95), glassMat, -1.58, 1.4, -0.05, 0.05, Math.PI / 2.1, 0);

function screen(tex, w, h, x, y, z, rx) {
  box(w + 0.05, h + 0.05, 0.035, darkBezel, x, y, z, rx, 0, 0);
  return mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: 0xffffff,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.08,
    }),
    x,
    y,
    z + 0.022,
    rx,
    0,
    0
  );
}
screen(makePFD(), 0.52, 0.46, -0.58, 0.86, -0.28, -0.52);
screen(makeND(), 0.52, 0.46, 0.0, 0.86, -0.3, -0.52);
screen(makeEICAS(), 0.46, 0.52, 0.58, 0.84, -0.26, -0.52);
screen(makeND(), 0.3, 0.24, -0.35, 0.56, -0.05, -0.72);
screen(makePFD(), 0.3, 0.24, 0.35, 0.56, -0.05, -0.72);

// Control yoke (FO side)
box(0.055, 0.62, 0.055, aluminum, 0.58, 0.58, 0.4);
mesh(new THREE.TorusGeometry(0.17, 0.028, 12, 28, Math.PI * 1.35), aluminum, 0.58, 0.95, 0.38, Math.PI / 2, 0, 0.15);
box(0.26, 0.035, 0.045, darkBezel, 0.58, 0.95, 0.38);
box(0.04, 0.08, 0.03, plastic, 0.48, 0.95, 0.38);
box(0.04, 0.08, 0.03, plastic, 0.68, 0.95, 0.38);
// Captain yoke (partial, behind)
box(0.05, 0.55, 0.05, aluminum, -0.55, 0.55, 0.45);
mesh(new THREE.TorusGeometry(0.15, 0.025, 10, 24, Math.PI * 1.3), aluminum, -0.55, 0.9, 0.42, Math.PI / 2, 0, -0.1);

// Seats
box(0.52, 0.58, 0.48, seatMat, -0.58, 0.48, 0.95);
box(0.52, 0.78, 0.12, seatMat, -0.58, 0.92, 1.12);
box(0.48, 0.12, 0.35, seatMat, -0.58, 1.22, 1.05);
box(0.52, 0.58, 0.48, seatMat, 0.58, 0.48, 0.95);
box(0.52, 0.78, 0.12, seatMat, 0.58, 0.92, 1.12);
box(0.48, 0.12, 0.35, seatMat, 0.58, 1.22, 1.05);
// armrests
box(0.08, 0.06, 0.35, plastic, -0.3, 0.72, 0.9);
box(0.08, 0.06, 0.35, plastic, 0.3, 0.72, 0.9);

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
  btn.addEventListener("click", () => applyProject(Number(btn.dataset.index)));
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
    state.tYaw = nx * (isMobile() ? 0.055 : 0.11);
    state.tPitch = -ny * (isMobile() ? 0.03 : 0.05);
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
  state.yaw += (state.tYaw - state.yaw) * 0.07;
  state.pitch += (state.tPitch - state.pitch) * 0.07;
  state.roll += (state.tRoll - state.roll) * 0.08;
  state.vibe += dt;

  const vx = reduce ? 0 : Math.sin(state.vibe * 1.4) * 0.0018;
  const vy = reduce ? 0 : Math.cos(state.vibe * 1.15) * 0.002;
  cameraRig.rotation.set(state.pitch + vy * 2 - 0.08, state.yaw, state.roll + vx * 2);
  camera.position.set(vx * 5, 1.28 + vy * 4, 0.95);

  if (state._skyDome) {
    state._skyDome.rotation.y += dt * (0.015 + state.speed * 0.025);
  }

  if (state._film && state._film.imgs.length) {
    const f = state._film;
    f.offset += dt * (0.08 + state.speed * 0.12);
    const { ctx, canvas } = f;
    ctx.fillStyle = "#6aa8d8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = f.imgs[Math.floor(f.offset) % f.imgs.length];
    const next = f.imgs[Math.floor(f.offset + 1) % f.imgs.length];
    const frac = f.offset % 1;
    const drift = (f.offset * 120) % canvas.width;
    ctx.globalAlpha = 1;
    ctx.drawImage(img, -drift, 0, canvas.width, canvas.height);
    ctx.drawImage(img, canvas.width - drift, 0, canvas.width, canvas.height);
    ctx.globalAlpha = frac * 0.45;
    ctx.drawImage(next, -drift * 0.7, -10, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    f.tex.needsUpdate = true;
    f.mesh.rotation.y += dt * (0.04 + state.speed * 0.06);
    f.mesh.material.opacity = 0.35 + state.speed * 0.12;
  }

  for (const s of clouds) {
    s.position.z += dt * (22 + state.speed * 55);
    s.position.x += state.yaw * dt * 12;
    if (s.position.z > 90) {
      s.position.z = -1600 - Math.random() * 500;
      s.position.x = (Math.random() - 0.5) * 2200;
    }
  }

  for (const layer of cloudLayers) {
    layer.mesh.position.x = state.yaw * (-10 - layer.speed);
    layer.mesh.position.y = layer.mesh.geometry.parameters.height * 0.08 + state.pitch * 4;
    layer.mesh.position.z = layer.baseZ + Math.sin(state.vibe * 0.3 + layer.speed) * 2;
    layer.mesh.material.opacity = layer.opacity * (0.85 + state.speed * 0.08);
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
