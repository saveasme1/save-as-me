/**
 * SaveAs For Biz — portfolio work stage
 * Paired PC/MO scenes (same index), clickable steps, lightbox + close.
 */

const S = (f) => `assets/film/stories/${f}`;
const SHOT = (f) => `assets/film/shots/${f}`;
const FOOD = (f) => `assets/film/food/${f}`;
const CRAFT = (f) => `assets/film/craft/${f}`;

/** Each scene: { step, pc, mo } — PC and MO always share the same step index */
const WORKS = [
  {
    no: "01",
    tag: "COMMERCE",
    title: "saveas.co.kr",
    lede: "Shop → 상품 → 직접디자인(새창 편집기) → 도구 사용 → 저장/주문.",
    chips: ["WordPress", "PHP", "커스텀 편집", "주문"],
    host: "saveas.co.kr",
    link: "https://www.saveas.co.kr/",
    scenes: [
      { step: "홈", pc: S("saveas-01-home.jpg"), mo: S("saveas-mo-01-home.jpg") },
      { step: "Shop", pc: S("saveas-02-shop.jpg"), mo: S("saveas-mo-02-shop.jpg") },
      { step: "상품", pc: S("saveas-03-product.jpg"), mo: S("saveas-mo-03-product.jpg") },
      { step: "편집기", pc: S("saveas-04-editor.jpg"), mo: S("saveas-mo-04-editor.jpg") },
      { step: "텍스트", pc: S("saveas-05-text.jpg"), mo: S("saveas-mo-05-text.jpg") },
      { step: "이미지", pc: S("saveas-06-image.jpg"), mo: S("saveas-mo-06-image.jpg") },
      { step: "도구", pc: S("saveas-07-layer.jpg"), mo: S("saveas-mo-07-layer.jpg") },
      { step: "저장", pc: S("saveas-08-save.jpg"), mo: S("saveas-mo-08-save.jpg") },
    ],
  },
  {
    no: "02",
    tag: "INDEPENDENT MALL",
    title: "asflower.vercel.app",
    lede: "꽃 독립몰 홈 → Shop → 상품 → 주문 흐름.",
    chips: ["Next.js", "Vercel", "꽃다발", "주문"],
    host: "asflower.vercel.app",
    link: "https://asflower.vercel.app/",
    scenes: [
      { step: "홈", pc: S("asf-01-home.jpg"), mo: S("asf-mo-01-home.jpg") },
      { step: "Shop", pc: S("asf-02-shop.jpg"), mo: S("asf-mo-02-shop.jpg") },
      { step: "상품", pc: S("asf-03-product.jpg"), mo: S("asf-mo-03-product.jpg") },
      { step: "카트", pc: S("asf-04-cart.jpg"), mo: S("asf-mo-04-cart.jpg") },
    ],
  },
  {
    no: "03",
    tag: "CONVERT",
    title: "까치산 → 스마트스토어",
    lede: "오프라인 매장·메뉴가 네이버 스마트스토어로 전환되어 전국 판매.",
    chips: ["오프라인→온라인", "스마트스토어", "상품화"],
    host: "smartstore.naver.com/_mymura",
    link: "https://smartstore.naver.com/_mymura",
    scenes: [
      { step: "매장", pc: FOOD("kimchi-01.jpg"), mo: FOOD("kimchi-03.png") },
      { step: "메뉴", pc: FOOD("kimchi-02.jpg"), mo: FOOD("kimchi-04.png") },
      { step: "상품화", pc: FOOD("kimchi-06.png"), mo: FOOD("kimchi-05.jpg") },
      { step: "스토어", pc: S("mymura-01-store.jpg"), mo: S("mymura-mo-01-store.jpg") },
      { step: "상세", pc: S("mymura-02-product.jpg"), mo: S("mymura-mo-02-product.jpg") },
      { step: "판매", pc: S("mymura-03-detail.jpg"), mo: S("mymura-mo-03-detail.jpg") },
    ],
  },
  {
    no: "04",
    tag: "CAFE24 APP",
    title: "MakerBridge 편집기",
    lede: "Cafe24 상품에서 편집기 실행 → 텍스트·이미지·칼선·고리 기능을 실제로 쓰는 흐름.",
    chips: ["Cafe24 앱", "MakerBridge", "NFC Z110", "칼선·고리"],
    host: "fullyfull2024.cafe24.com",
    link: "https://fullyfull2024.cafe24.com/product/%EC%9E%89%ED%81%AC%EC%A0%AF%ED%94%84%EB%A6%B0%ED%84%B0%EC%9A%A9-nfc-ntag215-%EB%B0%B1%EC%B9%B4%EB%93%9C-%ED%8F%AC%ED%86%A0%EC%B9%B4%EB%93%9C-%EC%A0%9C%EC%9E%91%EC%9A%A9-%EC%97%A1%EC%86%90%ED%98%B8%ED%99%98-z110/56/category/42/display/1/",
    scenes: [
      { step: "상품", pc: S("mb-01-product.jpg"), mo: S("mb-mo-01-product.jpg") },
      { step: "편집기", pc: S("mb-02-editor.jpg"), mo: S("mb-mo-02-editor.jpg") },
      { step: "텍스트", pc: S("mb-03-text.jpg"), mo: S("mb-mo-03-text.jpg") },
      { step: "이미지", pc: S("mb-04-image.jpg"), mo: S("mb-mo-04-image.jpg") },
      { step: "칼선", pc: S("mb-05-cut.jpg"), mo: S("mb-mo-05-cut.jpg") },
      { step: "고리", pc: S("mb-06-ring.jpg"), mo: S("mb-mo-06-ring.jpg") },
      { step: "저장", pc: S("mb-07-save.jpg"), mo: S("mb-mo-07-save.jpg") },
    ],
  },
  {
    no: "05",
    tag: "PWA APP",
    title: "BON HERITAGE",
    lede: "PWA 주얼리 앱. PC·MO가 같은 단계로 룩북·상세를 훑습니다.",
    chips: ["PWA", "주얼리", "피팅", "포트폴리오"],
    host: "BON HERITAGE PWA",
    link: null,
    scenes: [
      { step: "홈", pc: SHOT("bon-pc.jpg"), mo: SHOT("bon-mobile.jpg") },
      { step: "룩북1", pc: "assets/film/bh-look-1.jpg", mo: "assets/film/bh-look-4.jpg" },
      { step: "룩북2", pc: "assets/film/bh-look-2.jpg", mo: "assets/film/bh-look-5.jpg" },
      { step: "룩북3", pc: "assets/film/bh-look-3.jpg", mo: "assets/film/bh-look-6.jpg" },
      { step: "아틀리에", pc: "assets/film/bh-atelier.jpg", mo: SHOT("bon-mobile.jpg") },
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
    scenes: [
      { step: "로고", pc: CRAFT("zeron-LOGO_ZERON.png"), mo: CRAFT("zeron-logo-sq.png") },
      { step: "비주얼1", pc: CRAFT("zeron-vis-01.jpg"), mo: CRAFT("zeron-mobile_visual_01.jpg") },
      { step: "비주얼2", pc: CRAFT("zeron-vis-02.jpg"), mo: CRAFT("zeron-mobile_visual_02.jpg") },
      { step: "비주얼3", pc: CRAFT("zeron-vis-03.jpg"), mo: CRAFT("zeron-mobile_visual_03.jpg") },
      { step: "애즈플라워", pc: CRAFT("asf-logo_1000.png"), mo: CRAFT("zeron-mobile_visual_04.jpg") },
    ],
  },
];

let active = 0;
let storyIdx = 0;
let storyTimer = 0;
let paused = false;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function onImgErr(img) {
  img.addEventListener("error", () => {
    img.style.opacity = "0.15";
  });
}

function deviceStage(w) {
  const scenes = w.scenes || [];
  const pcImgs = scenes
    .map(
      (sc, i) =>
        `<img class="story-frame${i === 0 ? " is-on" : ""}" src="${sc.pc}" alt="" data-i="${i}" loading="${i ? "lazy" : "eager"}" />`
    )
    .join("");
  const moImgs = scenes
    .map(
      (sc, i) =>
        `<img class="story-frame${i === 0 ? " is-on" : ""}" src="${sc.mo}" alt="" data-i="${i}" loading="${i ? "lazy" : "eager"}" />`
    )
    .join("");
  return `<div class="device-duo">
    <div class="device-pc">
      <div class="device-chrome" aria-hidden="true"><i></i><b>${w.host}</b></div>
      <div class="screen story-screen" data-kind="pc">${pcImgs}<span class="story-caption" data-cap></span></div>
    </div>
    <div class="device-mo">
      <div class="notch" aria-hidden="true"></div>
      <div class="screen story-screen" data-kind="mo">${moImgs}</div>
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
        <div class="story-steps" data-steps>
          ${(w.scenes || [])
            .map(
              (sc, si) =>
                `<button type="button" class="story-step${si === 0 ? " is-on" : ""}" data-step="${si}">${sc.step}</button>`
            )
            .join("")}
        </div>
        ${deviceStage(w)}
        <div class="chips">${w.chips.map((c) => `<span>${c}</span>`).join("")}</div>
        <div class="card-actions">
          ${
            w.link
              ? `<a class="work-link" href="${w.link}" target="_blank" rel="noopener">사이트 열기 ↗</a>`
              : ""
          }
          <button type="button" class="btn-expand" data-expand>크게 보기</button>
        </div>
      </article>`
      ).join("")}
    </div>
    <button type="button" class="work-nav work-nav-next" id="workNext" aria-label="다음 프로젝트">›</button>
    <div class="work-dots" id="workDots"></div>
  `;

  // lightbox shell once
  if (!document.getElementById("storyLightbox")) {
    const lb = document.createElement("div");
    lb.id = "storyLightbox";
    lb.className = "story-lightbox";
    lb.hidden = true;
    lb.innerHTML = `
      <div class="story-lightbox-panel" role="dialog" aria-modal="true" aria-label="스토리 상세">
        <button type="button" class="story-lightbox-close" id="storyLbClose" aria-label="닫기">닫기 ✕</button>
        <div class="story-lightbox-body">
          <div class="lb-pc"><img id="lbPc" alt="PC" /></div>
          <div class="lb-mo"><img id="lbMo" alt="Mobile" /></div>
        </div>
        <p class="story-lightbox-cap" id="lbCap"></p>
        <div class="story-lightbox-steps" id="lbSteps"></div>
      </div>`;
    document.body.appendChild(lb);
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLightbox();
    });
    document.getElementById("storyLbClose").addEventListener("click", closeLightbox);
  }

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

  stage.querySelectorAll(".story-step").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".work-card");
      if (!card?.classList.contains("is-active")) return;
      paused = true;
      stopStories();
      showScene(card, Number(btn.dataset.step));
      openLightbox();
    });
  });

  stage.querySelectorAll("[data-expand]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openLightbox();
    });
  });

  stage.querySelectorAll(".story-screen").forEach((screen) => {
    screen.addEventListener("click", (e) => {
      const card = screen.closest(".work-card");
      if (!card?.classList.contains("is-active")) return;
      e.stopPropagation();
      openLightbox();
    });
  });

  const track = document.getElementById("workTrack");
  let sx = 0;
  track.addEventListener("pointerdown", (e) => {
    sx = e.clientX;
  }, { passive: true });
  track.addEventListener(
    "pointerup",
    (e) => {
      const dx = e.clientX - sx;
      if (Math.abs(dx) < 48) return;
      setActive(active + (dx < 0 ? 1 : -1));
    },
    { passive: true }
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  setActive(0);
}

function stopStories() {
  if (storyTimer) clearInterval(storyTimer);
  storyTimer = 0;
}

function showScene(card, i) {
  const work = WORKS[active];
  const scenes = work.scenes || [];
  if (!scenes.length) return;
  storyIdx = ((i % scenes.length) + scenes.length) % scenes.length;
  const pcFrames = [...card.querySelectorAll('.story-screen[data-kind="pc"] .story-frame')];
  const moFrames = [...card.querySelectorAll('.story-screen[data-kind="mo"] .story-frame')];
  const steps = [...card.querySelectorAll(".story-step")];
  const cap = card.querySelector("[data-cap]");

  pcFrames.forEach((img, idx) => img.classList.toggle("is-on", idx === storyIdx));
  moFrames.forEach((img, idx) => img.classList.toggle("is-on", idx === storyIdx));
  steps.forEach((el, idx) => el.classList.toggle("is-on", idx === storyIdx));
  if (cap) cap.textContent = scenes[storyIdx]?.step || "";

  // keep lightbox in sync if open
  const lb = document.getElementById("storyLightbox");
  if (lb && !lb.hidden) fillLightbox();
}

function playCardStory(card) {
  const work = WORKS[active];
  const n = (work.scenes || []).length;
  if (!n) return;
  storyIdx = 0;
  paused = false;
  showScene(card, 0);
  if (reduce || n < 2) return;
  storyTimer = setInterval(() => {
    if (paused) return;
    showScene(card, storyIdx + 1);
  }, 2300);
}

function fillLightbox() {
  const work = WORKS[active];
  const sc = work.scenes?.[storyIdx];
  if (!sc) return;
  document.getElementById("lbPc").src = sc.pc;
  document.getElementById("lbMo").src = sc.mo;
  document.getElementById("lbCap").textContent = `${work.no} · ${work.title} — ${sc.step}`;
  const steps = document.getElementById("lbSteps");
  steps.innerHTML = (work.scenes || [])
    .map(
      (s, i) =>
        `<button type="button" class="${i === storyIdx ? "is-on" : ""}" data-step="${i}">${s.step}</button>`
    )
    .join("");
  steps.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      paused = true;
      stopStories();
      const card = document.querySelector(".work-card.is-active");
      if (card) showScene(card, Number(b.dataset.step));
      fillLightbox();
    });
  });
}

function openLightbox() {
  const lb = document.getElementById("storyLightbox");
  if (!lb) return;
  paused = true;
  stopStories();
  fillLightbox();
  lb.hidden = false;
  document.body.classList.add("is-lightbox");
}

function resumeStory(card) {
  const work = WORKS[active];
  const n = (work.scenes || []).length;
  if (!card || !n || reduce || n < 2) return;
  paused = false;
  stopStories();
  showScene(card, storyIdx);
  storyTimer = setInterval(() => {
    if (paused) return;
    showScene(card, storyIdx + 1);
  }, 2300);
}

function closeLightbox() {
  const lb = document.getElementById("storyLightbox");
  if (!lb) return;
  lb.hidden = true;
  document.body.classList.remove("is-lightbox");
  const card = document.querySelector(".work-card.is-active");
  resumeStory(card);
}

function setActive(i) {
  const n = WORKS.length;
  active = ((i % n) + n) % n;
  const cards = [...document.querySelectorAll(".work-card")];
  stopStories();
  closeLightboxQuiet();

  cards.forEach((card, idx) => {
    let slot = idx - active;
    if (slot > n / 2) slot -= n;
    if (slot < -n / 2) slot += n;
    const abs = Math.abs(slot);
    card.classList.toggle("is-active", slot === 0);
    card.classList.toggle("is-side", abs === 1);
    card.classList.toggle("is-far", abs >= 2);
    card.style.setProperty("--slot", String(slot));
    card.setAttribute("aria-hidden", slot === 0 ? "false" : "true");
  });

  document.querySelectorAll("#workDots button").forEach((b, idx) => {
    b.classList.toggle("is-on", idx === active);
  });

  const live = cards[active];
  if (live) playCardStory(live);
}

function closeLightboxQuiet() {
  const lb = document.getElementById("storyLightbox");
  if (!lb) return;
  lb.hidden = true;
  document.body.classList.remove("is-lightbox");
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
