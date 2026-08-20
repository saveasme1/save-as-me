import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = () => window.innerWidth < 980;

const PROJECTS = [
  {
    id: "local",
    eye: "PROJECT 01",
    name: "LOCAL",
    title: "오프라인 상품을<br />온라인에서도 팔 수 있게.",
    body: "실제 로컬 매장의 상품을 온라인 판매용 상품으로 다시 기획했습니다. 패키지, 상세페이지, 스마트스토어 구축, 상품 등록, 쿠팡 확장과 기본 운영 교육까지 연결했습니다.",
    tags: ["상품 기획", "패키지", "스마트스토어", "쿠팡", "운영 교육"],
    link: "https://smartstore.naver.com/_mymura",
    linkLabel: "스마트스토어 보기 ↗",
    images: [
      "assets/missions/01-local/store-3.webp",
      "assets/missions/01-local/store-4.webp",
      "assets/missions/01-local/commerce-bridge.webp",
    ],
    demos: false,
    env: { turbidity: 2.0, elevation: 34, azimuth: 168, rayleigh: 2.8, exposure: 0.55, ground: 0x9aab8c },
    alt: 4200,
    hdg: 42,
  },
  {
    id: "saveas",
    eye: "PROJECT 02",
    name: "SAVEAS",
    title: "고객이 직접 만들고<br />그대로 주문하도록.",
    body: "사용자가 웹에서 상품에 이미지와 문구를 넣고 직접 디자인한 뒤 바로 주문할 수 있는 커스텀 상품 쇼핑몰을 개발했습니다.",
    tags: ["Web Editor", "POD", "주문 연동", "미리보기"],
    link: "https://save-as.co.kr",
    linkLabel: "save-as.co.kr ↗",
    images: [
      "assets/missions/02-saveas/product-hero.webp",
      "assets/missions/02-saveas/shot-3.webp",
      "assets/missions/02-saveas/editor-ui.webp",
    ],
    demos: false,
    env: { turbidity: 2.8, elevation: 28, azimuth: 160, rayleigh: 1.6, exposure: 0.48, ground: 0xb7c4b0 },
    alt: 9800,
    hdg: 86,
  },
  {
    id: "makerbridge",
    eye: "PROJECT 03",
    name: "MAKERBRIDGE",
    title: "기존 쇼핑몰에<br />디자인 기능을 더했습니다.",
    body: "카페24 상품 페이지 안에서 고객이 직접 텍스트와 이미지를 편집하고 제작용 데이터를 생성할 수 있는 웹 편집기 앱입니다.",
    tags: ["Cafe24", "TEXT", "IMAGE", "CUTLINE", "미리보기"],
    link: null,
    linkLabel: null,
      product: "assets/missions/03-makerbridge/product-edit.webp",
      cutline: "assets/missions/03-makerbridge/cutline.webp",
      dash: "assets/missions/03-makerbridge/dashboard.webp",
    },
    demos: true,
    env: { turbidity: 1.8, elevation: 42, azimuth: 150, rayleigh: 1.1, exposure: 0.52, ground: 0x8fa3b5 },
    alt: 12400,
    hdg: 112,
  },
  {
    id: "cursor",
    eye: "PROJECT 04",
    name: "CURSOR MOBILE",
    title: "PC 앞이 아니어도<br />개발은 계속됩니다.",
    body: "PC에서 진행하던 Cursor 작업을 모바일로 이어 사용하고, 클라우드 환경을 통해 PC가 꺼진 상황에서도 작업할 수 있도록 확장한 개발 환경입니다.",
    tags: ["Desktop", "Mobile", "Cloud", "Continuity"],
    link: null,
    images: ["assets/missions/04-cursor/og-install.png"],
    demos: false,
    env: { turbidity: 6.5, elevation: 6, azimuth: 200, rayleigh: 2.8, exposure: 0.38, ground: 0x6a5a4a },
    alt: 7600,
    hdg: 148,
  },
  {
    id: "pwa",
    eye: "PROJECT 05",
    name: "PWA",
    title: "웹서비스를<br />앱처럼 사용하도록.",
    body: "별도의 앱스토어 설치 없이 홈 화면에 추가하고 앱처럼 사용할 수 있는 PWA 기반 서비스를 개발합니다.",
    tags: ["PWA", "Installable", "Private", "Mobile"],
    link: null,
    images: [],
    demos: false,
    env: { turbidity: 8, elevation: -2, azimuth: 210, rayleigh: 0.6, exposure: 0.28, ground: 0x1a2030 },
    alt: 2800,
    hdg: 186,
  },
];

const state = {
  project: -1, // -1 = hero
  yaw: 0,
  pitch: 0,
  roll: 0,
  tYaw: 0,
  tPitch: 0,
  tRoll: 0,
  speed: 1,
  tSpeed: 1,
  velocity: 0,
  cloudTravel: 0,
  vibe: 0,
  ready: false,
};

const el = {
  boot: document.getElementById("boot"),
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

/* ---------- Three setup ---------- */
const mount = document.getElementById("webgl");
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile(), alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.55;
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 20000);
camera.position.set(0, 1.05, 0.55);

const cameraRig = new THREE.Group();
cameraRig.add(camera);
scene.add(cameraRig);

/* Lights */
const hemi = new THREE.HemisphereLight(0xc5e4ff, 0xe8e0d4, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff6e0, 2.8);
sun.position.set(40, 60, -20);
sun.castShadow = false;
scene.add(sun);
const cabinFill = new THREE.PointLight(0xfff8ee, 1.1, 10);
cabinFill.position.set(0, 1.2, 0.35);
scene.add(cabinFill);
const dashLight = new THREE.DirectionalLight(0xffffff, 0.55);
dashLight.position.set(0, 3, 2);
scene.add(dashLight);

/* Sky */
const sky = new Sky();
sky.scale.setScalar(45000);
scene.add(sky);
const skyUniforms = sky.material.uniforms;
skyUniforms["turbidity"].value = 2.0;
skyUniforms["rayleigh"].value = 2.8;
skyUniforms["mieCoefficient"].value = 0.0025;
skyUniforms["mieDirectionalG"].value = 0.7;
const sunPos = new THREE.Vector3();
function setSun(elevation, azimuth) {
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);
  sunPos.setFromSphericalCoords(1, phi, theta);
  skyUniforms["sunPosition"].value.copy(sunPos);
  sun.position.copy(sunPos).multiplyScalar(100);
}
setSun(34, 168);

/* Ground / horizon disc */
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(8000, 64),
  new THREE.MeshStandardMaterial({ color: 0x9aab8c, roughness: 1, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -80;
scene.add(ground);

const sea = new THREE.Mesh(
  new THREE.CircleGeometry(12000, 64),
  new THREE.MeshStandardMaterial({ color: 0x6f9cbc, roughness: 0.85, metalness: 0.05 })
);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -82;
scene.add(sea);

/* Clouds — soft billboard sprites */
function makeCloudTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 256, 128);
  const blobs = [
    [90, 70, 55],
    [130, 60, 48],
    [160, 72, 42],
    [110, 78, 36],
    [70, 68, 30],
  ];
  for (const [x, y, r] of blobs) {
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, "rgba(255,255,255,0.85)");
    grd.addColorStop(0.55, "rgba(255,255,255,0.35)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const cloudTex = makeCloudTexture();
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);
const cloudMat = new THREE.SpriteMaterial({
  map: cloudTex,
  transparent: true,
  depthWrite: false,
  opacity: 0.85,
});
const clouds = [];
const cloudCount = isMobile() ? 28 : 48;
for (let i = 0; i < cloudCount; i++) {
  const s = new THREE.Sprite(cloudMat.clone());
  const scale = 80 + Math.random() * 220;
  s.scale.set(scale, scale * 0.45, 1);
  s.position.set(
    (Math.random() - 0.5) * 2400,
    30 + Math.random() * 160,
    -80 - Math.random() * 1600
  );
  s.material.opacity = 0.35 + Math.random() * 0.5;
  cloudGroup.add(s);
  clouds.push({ sprite: s, speed: 12 + Math.random() * 40, resetZ: -200 - Math.random() * 400 });
}

/* Night city lights for project 05 */
const cityGroup = new THREE.Group();
cityGroup.visible = false;
scene.add(cityGroup);
const lightGeo = new THREE.SphereGeometry(1.2, 6, 6);
const lightMat = new THREE.MeshBasicMaterial({ color: 0xffd28a });
for (let i = 0; i < (isMobile() ? 40 : 90); i++) {
  const m = new THREE.Mesh(lightGeo, lightMat);
  m.position.set((Math.random() - 0.5) * 900, -70 + Math.random() * 8, -400 - Math.random() * 1400);
  m.scale.setScalar(0.8 + Math.random() * 2.5);
  cityGroup.add(m);
}

/* ---------- Cockpit interior (bright) ---------- */
const cockpit = new THREE.Group();
scene.add(cockpit);

const ivory = new THREE.MeshStandardMaterial({
  color: 0xe6e3dc,
  roughness: 0.55,
  metalness: 0.08,
});
const aluminum = new THREE.MeshStandardMaterial({
  color: 0xd5d6d2,
  roughness: 0.32,
  metalness: 0.45,
});
const pillarMat = new THREE.MeshStandardMaterial({
  color: 0xe8e6e0,
  roughness: 0.42,
  metalness: 0.18,
});
const graphite = new THREE.MeshStandardMaterial({
  color: 0x3a3e44,
  roughness: 0.4,
  metalness: 0.25,
});
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 0.96,
  transparent: true,
  opacity: 0.08,
  roughness: 0.02,
  metalness: 0,
  thickness: 0.2,
  ior: 1.15,
  depthWrite: false,
});

function box(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  cockpit.add(m);
  return m;
}

// Dashboard shelf
box(2.6, 0.08, 0.85, ivory, 0, 0.55, -0.55, -0.18, 0, 0);
box(2.6, 0.35, 0.12, aluminum, 0, 0.42, -0.2, 0, 0, 0);
// Glare shield / coaming
box(2.4, 0.06, 0.55, ivory, 0, 1.05, -0.85, 0.35, 0, 0);

// Center pedestal hint
box(0.35, 0.45, 0.7, aluminum, 0, 0.35, 0.15);

// Left / right side consoles
box(0.35, 0.7, 1.1, ivory, -1.15, 0.55, -0.1, 0, 0.12, 0);
box(0.28, 0.55, 0.9, ivory, 1.2, 0.5, -0.05, 0, -0.1, 0);

// Window pillars (asymmetric airliner feel)
box(0.08, 1.4, 0.12, pillarMat, -0.55, 1.35, -1.05, 0.1, 0.2, 0);
box(0.1, 1.5, 0.14, pillarMat, 0.15, 1.4, -1.15, 0.08, -0.05, 0);
box(0.08, 1.35, 0.12, pillarMat, 0.85, 1.32, -1.0, 0.1, -0.25, 0);

// Upper frame rails
box(2.8, 0.1, 0.12, aluminum, 0, 2.05, -0.9, 0.2, 0, 0);
box(0.12, 1.2, 0.1, pillarMat, -1.35, 1.45, -0.55, 0, 0.35, 0);
box(0.12, 1.1, 0.1, pillarMat, 1.4, 1.4, -0.5, 0, -0.3, 0);

// Instrument clusters (limited graphite)
box(0.55, 0.22, 0.04, graphite, -0.55, 0.72, -0.35, -0.4, 0, 0);
box(0.55, 0.22, 0.04, graphite, 0.05, 0.72, -0.38, -0.4, 0, 0);
box(0.4, 0.18, 0.04, graphite, 0.6, 0.7, -0.32, -0.4, 0, 0);

// Glass panes (angled)
const paneL = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.05), glassMat);
paneL.position.set(-0.95, 1.45, -1.0);
paneL.rotation.set(0.05, 0.42, 0.04);
cockpit.add(paneL);
const paneC = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.1), glassMat);
paneC.position.set(0.05, 1.5, -1.2);
paneC.rotation.set(0.08, 0, 0);
cockpit.add(paneC);
const paneR = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.0), glassMat);
paneR.position.set(1.05, 1.42, -0.95);
paneR.rotation.set(0.05, -0.48, -0.03);
cockpit.add(paneR);

// Seat shoulders (foreground depth)
box(0.55, 0.35, 0.4, ivory, -0.45, 0.55, 0.75);
box(0.55, 0.35, 0.4, ivory, 0.45, 0.55, 0.75);

/* ---------- UI helpers ---------- */
function show(card) {
  [el.hero, el.project, el.system, el.contact].forEach((c) => c.classList.add("is-hidden"));
  card.classList.remove("is-hidden");
}

function formatAlt(n) {
  return Math.round(n).toLocaleString("en-US");
}

function applyProject(index, { maneuver = true } = {}) {
  state.project = index;
  const items = [...document.querySelectorAll(".route-item")];
  items.forEach((b) => b.classList.toggle("is-active", Number(b.dataset.index) === index));

  if (index < 0) {
    show(el.hero);
    el.metaIndex.textContent = "— / 05";
    el.metaName.textContent = "READY";
    setEnv(PROJECTS[0].env, true);
    if (maneuver) {
      state.tRoll = 0;
      state.tYaw = 0;
    }
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
  if (p.link) {
    el.pLink.hidden = false;
    el.pLink.href = p.link;
    el.pLink.textContent = p.linkLabel || "자세히 보기 ↗";
  } else {
    el.pLink.hidden = true;
  }

  if (p.demos) {
    el.mbSwitches.hidden = false;
    el.dImg.src = p.images.editor;
    el.dLabel.textContent = "MAKERBRIDGE";
  } else {
    el.mbSwitches.hidden = true;
    const imgs = p.images;
    el.dImg.src = imgs[0] || "";
    el.dImg.style.display = imgs.length ? "block" : "none";
    el.dLabel.textContent = p.name;
  }

  setEnv(p.env);
  cityGroup.visible = index === 4;

  if (maneuver && !reduce) {
    state.tRoll = index % 2 === 0 ? -0.045 : 0.04;
    state.tYaw = (index - 2) * 0.02;
    setTimeout(() => {
      state.tRoll = 0;
    }, 1100);
  }
}

function setEnv(env, soft = false) {
  const lerp = soft ? 0.02 : 0.08;
  state._envTarget = env;
  state._envLerp = lerp;
  ground.material.color.setHex(env.ground);
}

function tickEnv() {
  if (!state._envTarget) return;
  const e = state._envTarget;
  const k = state._envLerp || 0.06;
  skyUniforms["turbidity"].value += (e.turbidity - skyUniforms["turbidity"].value) * k;
  skyUniforms["rayleigh"].value += (e.rayleigh - skyUniforms["rayleigh"].value) * k;
  renderer.toneMappingExposure += (e.exposure - renderer.toneMappingExposure) * k;
  // sun angle approx
  const curEl = state._sunEl ?? 22;
  const curAz = state._sunAz ?? 170;
  state._sunEl = curEl + (e.elevation - curEl) * k;
  state._sunAz = curAz + (e.azimuth - curAz) * k;
  setSun(state._sunEl, state._sunAz);
}

/* Gauges */
function updateGauges() {
  const p = state.project >= 0 ? PROJECTS[state.project] : PROJECTS[0];
  const alt = p.alt + state.speed * 40 + Math.sin(state.vibe) * 12;
  const spd = 220 + state.speed * 95 + state.velocity * 40;
  const hdg = (p.hdg + state.yaw * 40 + 360) % 360;
  el.gAlt.textContent = formatAlt(alt);
  el.gSpd.textContent = String(Math.round(spd));
  el.gHdg.textContent = `${String(Math.round(hdg)).padStart(3, "0")}°`;
}

/* Route clicks */
document.querySelectorAll(".route-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.tSpeed = 1.55;
    applyProject(Number(btn.dataset.index));
    setTimeout(() => {
      state.tSpeed = 1;
    }, 900);
  });
});

document.getElementById("viewSystem")?.addEventListener("click", () => show(el.system));
document.getElementById("viewContact")?.addEventListener("click", () => {
  show(el.contact);
  cityGroup.visible = true;
  setEnv(PROJECTS[4].env);
  state.project = 4;
});
document.getElementById("closeSystem")?.addEventListener("click", () => {
  if (state.project < 0) show(el.hero);
  else show(el.project);
});

/* MakerBridge switches */
el.mbSwitches?.querySelectorAll("button").forEach((b) => {
  b.addEventListener("click", () => {
    el.mbSwitches.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    const p = PROJECTS[2];
    const key = b.dataset.demo;
    if (p.images[key]) el.dImg.src = p.images[key];
  });
});

/* Pointer look */
window.addEventListener(
  "pointermove",
  (e) => {
    if (reduce) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    state.tYaw = nx * (isMobile() ? 0.05 : 0.1);
    state.tPitch = -ny * (isMobile() ? 0.025 : 0.045);
    if (el.flightUi) {
      el.flightUi.style.setProperty("--ui-x", `${nx * 4}px`);
      el.flightUi.style.setProperty("--ui-y", `${ny * 3}px`);
      el.flightUi.classList.add("is-tilted");
    }
  },
  { passive: true }
);

/* Scroll = throttle */
let lastY = window.scrollY;
let lastT = performance.now();
window.addEventListener(
  "wheel",
  (e) => {
    const now = performance.now();
    const dy = Math.abs(e.deltaY);
    state.velocity = Math.min(1.6, dy / 80);
    state.tSpeed = 1 + Math.min(1.2, state.velocity);
    // progress projects with intentional scroll accumulation
    state._scrollAcc = (state._scrollAcc || 0) + e.deltaY;
    if (state._scrollAcc > 420) {
      state._scrollAcc = 0;
      const next = Math.min(4, (state.project < 0 ? 0 : state.project + 1));
      applyProject(next);
    } else if (state._scrollAcc < -420) {
      state._scrollAcc = 0;
      const prev = state.project <= 0 ? -1 : state.project - 1;
      applyProject(prev);
    }
    lastT = now;
  },
  { passive: true }
);

/* Double-tap bottom to contact on long scroll end via keyboard */
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") {
    const next = Math.min(4, (state.project < 0 ? 0 : state.project + 1));
    applyProject(next);
  }
  if (e.key === "ArrowUp") {
    const prev = state.project <= 0 ? -1 : state.project - 1;
    applyProject(prev);
  }
  if (e.key === "c" || e.key === "C") {
    show(el.contact);
    cityGroup.visible = true;
    setEnv(PROJECTS[4].env);
  }
});

/* Clock */
setInterval(() => {
  const d = new Date();
  el.clock.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}, 1000);

/* Resize */
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2));
}
window.addEventListener("resize", onResize);

/* Animate */
let prev = performance.now();
function animate(now) {
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;

  state.speed += (state.tSpeed - state.speed) * 0.04;
  state.velocity *= 0.94;
  if (state.velocity < 0.02) {
    state.velocity = 0;
    state.tSpeed += (1 - state.tSpeed) * 0.03;
  }

  state.yaw += (state.tYaw - state.yaw) * 0.06;
  state.pitch += (state.tPitch - state.pitch) * 0.06;
  state.roll += (state.tRoll - state.roll) * 0.08;
  state.vibe += dt;

  const vibeX = reduce ? 0 : Math.sin(state.vibe * 1.3) * 0.0015;
  const vibeY = reduce ? 0 : Math.cos(state.vibe * 1.1) * 0.0018;

  cameraRig.rotation.set(
    state.pitch + vibeY * 2,
    state.yaw,
    state.roll + vibeX * 2
  );
  camera.position.set(vibeX * 4, 1.05 + vibeY * 3, 0.55);

  // clouds travel toward camera
  state.cloudTravel += dt * (18 + state.speed * 55);
  for (const c of clouds) {
    c.sprite.position.z += dt * c.speed * state.speed;
    c.sprite.position.x += state.yaw * dt * 8;
    if (c.sprite.position.z > 120) {
      c.sprite.position.z = -1800 - Math.random() * 600;
      c.sprite.position.x = (Math.random() - 0.5) * 2400;
    }
  }

  // subtle ground scroll illusion
  ground.position.z = (state.cloudTravel * 0.15) % 200;
  sea.position.z = (state.cloudTravel * 0.1) % 200;

  tickEnv();
  updateGauges();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

/* Boot */
applyProject(-1, { maneuver: false });
requestAnimationFrame(animate);
setTimeout(() => {
  document.body.classList.add("is-ready");
  state.ready = true;
}, 900);
