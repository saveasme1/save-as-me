(() => {
  const canvas = document.getElementById("skyCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.matchMedia("(max-width: 720px)").matches;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let clouds = [];
  let stars = [];
  let raf = 0;
  let last = performance.now();
  let offsetX = 0;
  let parallaxX = 0;

  const moods = {
    dawn: { top: [106, 144, 184], mid: [168, 196, 220], bot: [217, 228, 239], cloud: 0.55 },
    morning: { top: [122, 160, 196], mid: [197, 216, 234], bot: [239, 230, 214], cloud: 0.62 },
    day: { top: [63, 120, 184], mid: [142, 184, 222], bot: [215, 232, 245], cloud: 0.48 },
    altitude: { top: [22, 58, 114], mid: [58, 110, 171], bot: [143, 180, 216], cloud: 0.35 },
    sunset: { top: [42, 51, 88], mid: [192, 106, 74], bot: [232, 176, 122], cloud: 0.4 },
    night: { top: [5, 7, 15], mid: [16, 24, 44], bot: [28, 36, 56], cloud: 0.12 },
  };

  let moodKey = "dawn";

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.25 : 1.75);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const n = isMobile() ? 18 : 32;
    clouds = Array.from({ length: n }, (_, i) => ({
      x: Math.random() * w * 1.6,
      y: 40 + Math.random() * h * 0.45,
      s: 0.4 + Math.random() * 1.4,
      w: 80 + Math.random() * 180,
      h: 28 + Math.random() * 50,
      v: 8 + Math.random() * 22,
      layer: i % 3,
    }));
    stars = Array.from({ length: isMobile() ? 40 : 90 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.55,
      r: Math.random() * 1.2,
      a: 0.2 + Math.random() * 0.7,
    }));
  }

  function rgb(a) {
    return `rgb(${a[0]},${a[1]},${a[2]})`;
  }

  function drawCloud(c, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    const x = c.x;
    const y = c.y;
    const ww = c.w * c.s;
    const hh = c.h * c.s;
    ctx.beginPath();
    ctx.ellipse(x, y, ww * 0.55, hh * 0.55, 0, 0, Math.PI * 2);
    ctx.ellipse(x - ww * 0.35, y + hh * 0.1, ww * 0.35, hh * 0.45, 0, 0, Math.PI * 2);
    ctx.ellipse(x + ww * 0.38, y + hh * 0.08, ww * 0.4, hh * 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(x + ww * 0.05, y - hh * 0.25, ww * 0.32, hh * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const speed = Number(getComputedStyle(document.documentElement).getPropertyValue("--sky-speed")) || 1;
    const m = moods[moodKey] || moods.dawn;

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, rgb(m.top));
    g.addColorStop(0.55, rgb(m.mid));
    g.addColorStop(1, rgb(m.bot));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (moodKey === "night" || moodKey === "altitude" || moodKey === "sunset") {
      for (const s of stars) {
        ctx.globalAlpha = s.a * (moodKey === "night" ? 1 : 0.35);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    offsetX += dt * 12 * speed;
    const px = parallaxX;

    for (const c of clouds) {
      const layerMul = 0.55 + c.layer * 0.35;
      c.x -= dt * c.v * speed * layerMul;
      if (c.x < -260) c.x = w + 80 + Math.random() * 120;
      drawCloud(
        { ...c, x: c.x + px * (0.2 + c.layer * 0.15) },
        m.cloud * (0.45 + c.layer * 0.2)
      );
    }

    // soft sun / glow
    if (moodKey !== "night") {
      const sx = w * 0.72 + px * 0.08;
      const sy = moodKey === "sunset" ? h * 0.42 : h * 0.18;
      const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, moodKey === "sunset" ? 180 : 120);
      rg.addColorStop(0, moodKey === "sunset" ? "rgba(255,180,90,0.55)" : "rgba(255,255,240,0.45)");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }

    if (!reduce) raf = requestAnimationFrame(frame);
  }

  window.SaveAsSky = {
    setMood(key) {
      if (moods[key]) moodKey = key;
    },
    setParallax(x) {
      parallaxX = x;
    },
    pause() {
      cancelAnimationFrame(raf);
    },
    resume() {
      if (reduce) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
  };

  resize();
  window.addEventListener("resize", resize);
  if (!reduce) raf = requestAnimationFrame(frame);
  else {
    // static frame
    last = performance.now();
    frame(last);
  }
})();
