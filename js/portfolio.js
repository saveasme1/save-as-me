/**
 * SaveAs For Biz — portfolio work stage
 * Center active card + dimmed prev/next; active story autoplay like a reel.
 */

const STORY = (frames) => frames.map((f) => `assets/film/stories/${f}`);
const SHOT = (f) => `assets/film/shots/${f}`;
const FOOD = (f) => `assets/film/food/${f}`;
const CRAFT = (f) => `assets/film/craft/${f}`;

const WORKS = [
  {
    no: "01",
    tag: "COMMERCE",
    title: "saveas.co.kr",
    lede: "Shop → 상품 → 직접디자인 → 편집 → 주문까지. 브랜드몰 전체 플로우.",
    chips: ["WordPress", "WooCommerce", "커스텀 편집", "주문"],
    host: "saveas.co.kr",
    link: "https://www.saveas.co.kr/",
    steps: ["홈", "Shop", "상품", "편집기", "도구", "주문"],
    storyPc: [
      ...STORY([
        "saveas-01-home.jpg",
        "saveas-02-shop.jpg",
        "saveas-03-product.jpg",
        "saveas-04-editor.jpg",
        "saveas-05-edit-tool.jpg",
        "saveas-06-edit-img.jpg",
        "saveas-07-cart.jpg",
        "saveas-08-order.jpg",
      ]),
      SHOT("saveas-pc.jpg"),
    ],
    storyMo: [STORY(["saveas-mo-home.jpg"])[0], SHOT("saveas-mobile.jpg")],
  },
  {
    no: "02",
    tag: "INDEPENDENT MALL",
    title: "asflower.vercel.app",
    lede: "꽃 독립몰 홈 → 상품 → 주문 흐름. Next.js 커머스.",
    chips: ["Next.js", "Vercel", "꽃다발", "주문"],
    host: "asflower.vercel.app",
    link: "https://asflower.vercel.app/",
    steps: ["홈", "Shop", "상품", "카트"],
    storyPc: [
      ...STORY(["asf-01-home.jpg", "asf-02-shop.jpg", "asf-03-product.jpg", "asf-04-cart.jpg"]),
      SHOT("asflower-pc.jpg"),
    ],
    storyMo: [STORY(["asf-mo-home.jpg"])[0], SHOT("asflower-mobile.jpg")],
  },
  {
    no: "03",
    tag: "CONVERT",
    title: "까치산 → 스마트스토어",
    lede: "오프라인 매장·메뉴가 네이버 스마트스토어로 전환되어 전국 판매 중.",
    chips: ["오프라인→온라인", "스마트스토어", "상품화"],
    host: "smartstore.naver.com/_mymura",
    link: "https://smartstore.naver.com/_mymura",
    steps: ["매장", "메뉴", "상품화", "스토어", "상세"],
    storyPc: [
      FOOD("kimchi-01.jpg"),
      FOOD("kimchi-02.jpg"),
      FOOD("kimchi-06.png"),
      ...STORY(["mymura-01-store.jpg", "mymura-02-product.jpg", "mymura-03-detail.jpg"]),
      SHOT("mymura-pc.jpg"),
    ],
    storyMo: [FOOD("kimchi-03.png"), STORY(["mymura-mo-store.jpg"])[0], SHOT("mymura-mobile.jpg")],
  },
  {
    no: "04",
    tag: "CAFE24 APP",
    title: "MakerBridge 편집기",
    lede: "Cafe24 상품상세에서 편집기 실행 → 텍스트·이미지·재단 기능을 단계별로.",
    chips: ["Cafe24 앱", "MakerBridge", "NFC Z110", "편집기"],
    host: "fullyfull2024.cafe24.com",
    link: "https://fullyfull2024.cafe24.com/product/%EC%9E%89%ED%81%AC%EC%A0%AF%ED%94%84%EB%A6%B0%ED%84%B0%EC%9A%A9-nfc-ntag215-%EB%B0%B1%EC%B9%B4%EB%93%9C-%ED%8F%AC%ED%86%A0%EC%B9%B4%EB%93%9C-%EC%A0%9C%EC%9E%91%EC%9A%A9-%EC%97%A1%EC%86%90%ED%98%B8%ED%99%98-z110/56/category/42/display/1/",
    steps: ["상품", "편집기", "텍스트", "이미지", "재단", "저장"],
    storyPc: [
      ...STORY([
        "mb-01-product.jpg",
        "mb-02-editor.jpg",
        "mb-03-text.jpg",
        "mb-04-image.jpg",
        "mb-05-cut.jpg",
        "mb-06-layer.jpg",
        "mb-07-save.jpg",
      ]),
      SHOT("makerbridge-pc.jpg"),
    ],
    storyMo: [STORY(["mb-mo-product.jpg"])[0], SHOT("makerbridge-mobile.jpg")],
  },
  {
    no: "05",
    tag: "PWA APP",
    title: "BON HERITAGE",
    lede: "작업표시줄 PWA처럼 설치되는 주얼리 앱. PC·MO UI와 주요 화면을 훑습니다.",
    chips: ["PWA", "주얼리", "피팅", "포트폴리오"],
    host: "BON HERITAGE PWA",
    link: null,
    steps: ["홈", "룩북", "피팅", "상세"],
    storyPc: [
      SHOT("bon-pc.jpg"),
      "assets/film/bh-look-1.jpg",
      "assets/film/bh-look-2.jpg",
      "assets/film/bh-look-3.jpg",
      "assets/film/bh-atelier.jpg",
    ],
    storyMo: [
      SHOT("bon-mobile.jpg"),
      "assets/film/bh-look-4.jpg",
      "assets/film/bh-look-5.jpg",
      SHOT("bon-mobile.jpg"),
    ],
  },
  {
    no: "06",
    tag: "CRAFT",
    title: "ZERON · 애즈플라워 CI",
    lede: "로고·컬러·모바일 비주얼 시스템을 컷 단위로.",
    chips: ["브랜딩", "CI", "OEM"],
    host: "brand system",
    link: null,
    steps: ["로고", "비주얼", "컬러"],
    storyPc: [
      CRAFT("zeron-LOGO_ZERON.png"),
      CRAFT("zeron-vis-01.jpg"),
      CRAFT("zeron-vis-02.jpg"),
      CRAFT("zeron-vis-03.jpg"),
      CRAFT("asf-logo_1000.png"),
    ],
    storyMo: [CRAFT("zeron-logo-sq.png"), CRAFT("zeron-mobile_visual_01.jpg"), CRAFT("zeron-vis-04.jpg")],
  },
];

let active = 0;
let storyTimers = [];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function onImgErr(img) {
  img.addEventListener("error", () => {
    img.style.opacity = "0.15";
  });
}

function deviceStage(w, kind) {
  const list = kind === "mo" ? w.storyMo : w.storyPc;
  const frames = (list || []).filter(Boolean);
  const first = frames[0] || "";
  if (kind === "pc") {
    return `<div class="device-pc">
      <div class="device-chrome" aria-hidden="true"><i></i><b>${w.host}</b></div>
      <div class="screen story-screen" data-kind="pc">
        ${frames
          .map(
            (src, i) =>
              `<img class="story-frame${i === 0 ? " is-on" : ""}" src="${src}" alt="" data-i="${i}" loading="${i ? "lazy" : "eager"}" />`
          )
          .join("")}
        <span class="story-caption" data-cap></span>
      </div>
    </div>`;
  }
  return `<div class="device-mo">
    <div class="notch" aria-hidden="true"></div>
    <div class="screen story-screen" data-kind="mo">
      ${frames
        .map(
          (src, i) =>
            `<img class="story-frame${i === 0 ? " is-on" : ""}" src="${src}" alt="" data-i="${i}" loading="${i ? "lazy" : "eager"}" />`
        )
        .join("")}
    </div>
  </div>`;
}

function renderWorks() {
  const stage = document.getElementById("workStage");
  if (!stage) return;
  stage.innerHTML = `
    <button type="button" class="work-nav work-nav-prev" id="workPrev" aria-label="이전 프로젝트">‹</button>
    <div class="work-track" id="workTrack">
      ${WORKS.map(
        (w, i) => `<article class="work-card" data-i="${i}">
        <header>
          <div>
            <div class="work-no">${w.no}</div>
            <h3>${w.title}</h3>
          </div>
          <span class="tag">${w.tag}</span>
        </header>
        <p class="lede">${w.lede}</p>
        <div class="story-steps" data-steps>${(w.steps || []).map((s, si) => `<em class="${si === 0 ? "is-on" : ""}">${s}</em>`).join("")}</div>
        <div class="device-duo">
          ${deviceStage(w, "pc")}
          ${deviceStage(w, "mo")}
        </div>
        <div class="chips">${w.chips.map((c) => `<span>${c}</span>`).join("")}</div>
        ${
          w.link
            ? `<a class="work-link" href="${w.link}" target="_blank" rel="noopener">사이트 열기 ↗</a>`
            : ""
        }
      </article>`
      ).join("")}
    </div>
    <button type="button" class="work-nav work-nav-next" id="workNext" aria-label="다음 프로젝트">›</button>
    <div class="work-dots" id="workDots"></div>
  `;

  stage.querySelectorAll("img.story-frame").forEach(onImgErr);

  const dots = document.getElementById("workDots");
  dots.innerHTML = WORKS.map(
    (_, i) => `<button type="button" data-i="${i}" aria-label="프로젝트 ${i + 1}"></button>`
  ).join("");

  document.getElementById("workPrev").addEventListener("click", () => setActive(active - 1));
  document.getElementById("workNext").addEventListener("click", () => setActive(active + 1));
  dots.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => setActive(Number(b.dataset.i)))
  );

  // swipe on track
  const track = document.getElementById("workTrack");
  let sx = 0;
  track.addEventListener(
    "pointerdown",
    (e) => {
      sx = e.clientX;
    },
    { passive: true }
  );
  track.addEventListener(
    "pointerup",
    (e) => {
      const dx = e.clientX - sx;
      if (Math.abs(dx) < 48) return;
      setActive(active + (dx < 0 ? 1 : -1));
    },
    { passive: true }
  );

  setActive(0);
}

function stopStories() {
  storyTimers.forEach((t) => clearInterval(t));
  storyTimers = [];
}

function playCardStory(card, work) {
  const pcFrames = [...card.querySelectorAll('.story-screen[data-kind="pc"] .story-frame')];
  const moFrames = [...card.querySelectorAll('.story-screen[data-kind="mo"] .story-frame')];
  const steps = [...card.querySelectorAll(".story-steps em")];
  const cap = card.querySelector("[data-cap]");
  let i = 0;
  const tick = () => {
    const n = Math.max(pcFrames.length, 1);
    i = (i + 1) % n;
    pcFrames.forEach((img, idx) => img.classList.toggle("is-on", idx === i));
    if (moFrames.length) {
      const mi = i % moFrames.length;
      moFrames.forEach((img, idx) => img.classList.toggle("is-on", idx === mi));
    }
    if (steps.length) {
      const si = Math.min(i, steps.length - 1);
      steps.forEach((el, idx) => el.classList.toggle("is-on", idx === si));
      if (cap) cap.textContent = steps[si]?.textContent || "";
    }
  };
  if (cap && steps[0]) cap.textContent = steps[0].textContent;
  if (!reduce && pcFrames.length > 1) {
    storyTimers.push(setInterval(tick, 2200));
  }
}

function setActive(i) {
  const n = WORKS.length;
  active = ((i % n) + n) % n;
  const cards = [...document.querySelectorAll(".work-card")];
  const track = document.getElementById("workTrack");
  stopStories();

  cards.forEach((card, idx) => {
    let slot = idx - active;
    if (slot > n / 2) slot -= n;
    if (slot < -n / 2) slot += n;
    const abs = Math.abs(slot);
    card.classList.toggle("is-active", slot === 0);
    card.classList.toggle("is-side", abs === 1);
    card.classList.toggle("is-far", abs >= 2);
    card.style.setProperty("--slot", String(slot));
    card.style.setProperty("--abs", String(abs));
    card.setAttribute("aria-hidden", slot === 0 ? "false" : "true");
  });

  document.querySelectorAll("#workDots button").forEach((b, idx) => {
    b.classList.toggle("is-on", idx === active);
  });

  const live = cards[active];
  if (live) playCardStory(live, WORKS[active]);
  if (track) track.dataset.active = String(active);
}

function animateSkills() {
  document.querySelectorAll(".skill").forEach((row) => {
    const pct = Number(row.dataset.pct || 0);
    const fill = row.querySelector(".bar > i");
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  });
}

function setupSkillObserver() {
  const root = document.getElementById("skills");
  if (!root || !("IntersectionObserver" in window)) {
    animateSkills();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateSkills();
          io.disconnect();
        }
      });
    },
    { threshold: 0.25 }
  );
  io.observe(root);
}

function setupDock() {
  const links = [...document.querySelectorAll(".dock a[data-nav]")];
  const map = links
    .map((a) => {
      const id = (a.getAttribute("href") || "").replace("#", "");
      const el = document.getElementById(id);
      return el ? { a, el } : null;
    })
    .filter(Boolean);
  if (!map.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === `#${visible.target.id}`));
    },
    { rootMargin: "-35% 0px -45% 0px", threshold: [0.1, 0.4, 0.7] }
  );
  map.forEach(({ el }) => io.observe(el));
}

renderWorks();
setupSkillObserver();
setupDock();
