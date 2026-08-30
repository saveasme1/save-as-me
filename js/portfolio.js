/**
 * SaveAs For Biz — portfolio page
 * Skill % are estimates from live headers / known stacks; adjust in index.html data-pct.
 */

const WORKS = [
  {
    no: "01",
    tag: "COMMERCE",
    title: "saveas.co.kr",
    lede: "투명 아크릴 주차번호판 커스텀 커머스. WordPress + WooCommerce 기반 브랜드몰.",
    chips: ["WordPress", "WooCommerce", "PHP", "Flatsome"],
    pc: "assets/film/shots/saveas-pc.jpg",
    mo: "assets/film/shots/saveas-mobile.jpg",
    host: "saveas.co.kr",
    link: "https://www.saveas.co.kr/",
  },
  {
    no: "02",
    tag: "INDEPENDENT MALL",
    title: "asflower.vercel.app",
    lede: "오늘 들어온 꽃으로 맞춤 꽃다발. Next.js 독립 커머스.",
    chips: ["Next.js", "Vercel", "커머스"],
    pc: "assets/film/shots/asflower-pc.jpg",
    mo: "assets/film/shots/asflower-mobile.jpg",
    host: "asflower.vercel.app",
    link: "https://asflower.vercel.app/",
  },
  {
    no: "03",
    tag: "CONVERT",
    title: "까치산 → 스마트스토어",
    lede: "오프라인 인기 메뉴를 전국 택배 SKU로. 스마트스토어 전환 결과.",
    chips: ["상품화", "스마트스토어", "상세"],
    pc: "assets/film/shots/mymura-pc.jpg",
    mo: "assets/film/shots/mymura-mobile.jpg",
    host: "smartstore.naver.com",
    link: "https://smartstore.naver.com/_mymura",
  },
  {
    no: "04",
    tag: "BUILD",
    title: "MakerBridge / Vector",
    lede: "카페24 편집기·PNG→SVG 벡터 툴. Express 기반 실무 웹앱.",
    chips: ["Node", "Express", "Cafe24", "SVG"],
    pc: "assets/film/shots/makerbridge-pc.jpg",
    mo: "assets/film/shots/makerbridge-mobile.jpg",
    host: "app.0-1.co.kr",
    link: "https://app.0-1.co.kr/",
  },
  {
    no: "05",
    tag: "PWA",
    title: "BON HERITAGE",
    lede: "주문제작 주얼리 포트폴리오·피팅을 앱처럼 쓰는 PWA.",
    chips: ["PWA", "모바일", "브랜드"],
    pc: "assets/film/shots/bon-pc.jpg",
    mo: "assets/film/shots/bon-mobile.jpg",
    host: "bonheritage",
    link: null,
  },
  {
    no: "06",
    tag: "CRAFT",
    title: "ZERON · 애즈플라워 CI",
    lede: "로고·컬러·모바일 비주얼 시스템과 OEM A→Z.",
    chips: ["브랜딩", "CI", "OEM"],
    pc: "assets/film/craft/zeron-vis-01.jpg",
    mo: "assets/film/craft/zeron-logo-sq.png",
    host: "brand system",
    link: null,
  },
];

function deviceDuo(w) {
  const onErr =
    "onerror=\"this.style.opacity=0.2;this.alt='preview'\"";
  const pc = w.pc
    ? `<div class="device-pc"><div class="device-chrome" aria-hidden="true"><i></i><b>${w.host}</b></div><div class="screen"><img src="${w.pc}" alt="${w.title} PC" loading="lazy" ${onErr} /></div></div>`
    : "";
  const mo = w.mo
    ? `<div class="device-mo"><div class="notch" aria-hidden="true"></div><div class="screen"><img src="${w.mo}" alt="${w.title} mobile" loading="lazy" ${onErr} /></div></div>`
    : "";
  return `<div class="device-duo">${pc}${mo}</div>`;
}

function renderWorks() {
  const rail = document.getElementById("workRail");
  if (!rail) return;
  rail.innerHTML = WORKS.map(
    (w) => `<article class="work-card">
      <header>
        <div>
          <div class="work-no">${w.no}</div>
          <h3>${w.title}</h3>
        </div>
        <span class="tag">${w.tag}</span>
      </header>
      <p class="lede">${w.lede}</p>
      ${deviceDuo(w)}
      <div class="chips">${w.chips.map((c) => `<span>${c}</span>`).join("")}</div>
      ${
        w.link
          ? `<a class="work-link" href="${w.link}" target="_blank" rel="noopener">사이트 열기 ↗</a>`
          : ""
      }
    </article>`
  ).join("");
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
