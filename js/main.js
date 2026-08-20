(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const clockEl = document.getElementById("heroClock");
  const tickClock = () => {
    if (!clockEl) return;
    const d = new Date();
    clockEl.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
  };
  tickClock();
  setInterval(tickClock, 1000);

  /* Mobile nav */
  const toggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      mobileNav.classList.toggle("open", !open);
      document.body.style.overflow = open ? "" : "hidden";
    });
    mobileNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  /* Crosshair */
  const crosshair = document.getElementById("crosshair");
  if (finePointer && crosshair && !reduce) {
    document.body.classList.add("has-pointer");
    window.addEventListener(
      "pointermove",
      (e) => {
        crosshair.style.transform = `translate(${e.clientX - 14}px, ${e.clientY - 14}px)`;
      },
      { passive: true }
    );
  }

  /* Instrument HUD */
  const instAlt = document.getElementById("instAlt");
  const instMission = document.getElementById("instMission");
  const instStatus = document.getElementById("instStatus");
  const instGauge = document.getElementById("instGauge");
  const sections = [...document.querySelectorAll("[data-mission]")];

  const updateInstrument = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
    if (instAlt) instAlt.textContent = `${String(p).padStart(3, "0")}%`;
    if (instGauge) instGauge.style.strokeDashoffset = String(100 - p);

    let active = sections[0];
    const mid = window.scrollY + window.innerHeight * 0.35;
    for (const s of sections) {
      if (s.offsetTop <= mid) active = s;
    }
    if (active) {
      const code = active.dataset.mission || "00";
      const status = active.dataset.status || "STANDBY";
      if (instMission) {
        instMission.textContent = code === "00" || code === "--" || code === "END"
          ? code === "END" ? "END" : code === "--" ? "MAP" : "00 / 05"
          : `${code} / 05`;
      }
      if (instStatus) instStatus.textContent = status;
    }
  };
  updateInstrument();
  window.addEventListener("scroll", updateInstrument, { passive: true });
  window.addEventListener("resize", updateInstrument);

  /* Reveal on load */
  document.documentElement.classList.add("is-ready");

  const boot = () => {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    if (reduce) return;

    gsap.from(".hero-title .line", {
      yPercent: 110,
      opacity: 0,
      duration: 1.1,
      ease: "power3.out",
      stagger: 0.12,
      delay: 0.1,
    });
    gsap.from([".hero-sub", ".hero-cta", ".capability-matrix"], {
      y: 28,
      opacity: 0,
      duration: 0.9,
      ease: "power2.out",
      stagger: 0.1,
      delay: 0.45,
    });

    gsap.utils.toArray(".mission").forEach((section) => {
      const rail = section.querySelector(".mission-rail");
      const shots = section.querySelectorAll(".shot, .bridge-visual, .pwa-panel");
      if (rail) {
        gsap.from(rail.children, {
          scrollTrigger: { trigger: section, start: "top 75%" },
          y: 36,
          opacity: 0,
          duration: 0.85,
          stagger: 0.08,
          ease: "power2.out",
        });
      }
      if (shots.length) {
        gsap.from(shots, {
          scrollTrigger: { trigger: section, start: "top 70%" },
          y: 48,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
        });
      }
    });

    gsap.from(".cap-panel", {
      scrollTrigger: { trigger: "#capabilities", start: "top 75%" },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "power2.out",
    });

    gsap.from(".ending-frame > *", {
      scrollTrigger: { trigger: "#contact", start: "top 70%" },
      y: 40,
      opacity: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: "power2.out",
    });

    /* subtle parallax on large shots */
    document.querySelectorAll(".shot-display img, .shot-xl img").forEach((img) => {
      gsap.to(img, {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: img.closest(".shot"),
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
  } else {
    setTimeout(boot, 0);
  }
  window.addEventListener("load", () => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
