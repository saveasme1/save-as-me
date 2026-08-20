(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;
  const body = document.body;
  const cockpit = document.getElementById("cockpit");
  const horizon = document.getElementById("horizon");

  const els = {
    clock: document.getElementById("sysClock"),
    sys: document.getElementById("sysStatus"),
    rSys: document.getElementById("rSys"),
    rAlt: document.getElementById("rAlt"),
    rSpd: document.getElementById("rSpd"),
    rRte: document.getElementById("rRte"),
    hudBank: document.getElementById("hudBank"),
    hudSpd: document.getElementById("hudSpd"),
    throttleHandle: document.getElementById("throttleHandle"),
    navLock: document.getElementById("navLock"),
    navMission: document.getElementById("navMission"),
    navSystem: document.getElementById("navSystem"),
    navType: document.getElementById("navType"),
    bootLine: document.getElementById("bootLine"),
  };

  const sections = [...document.querySelectorAll(".deck[data-mission]")];
  const routeBtns = [...document.querySelectorAll(".route-btn")];
  let activeRoute = routeBtns[0] || null;
  let engageTarget = "#m01";
  let lastScroll = window.scrollY;
  let lastT = performance.now();
  let velocity = 0;
  let skySpeed = 1;
  let bank = 0;
  let bankTarget = 0;
  let dragging = false;

  /* Boot sequence */
  const bootLines = [
    "INITIALIZING COCKPIT…",
    "WINDOW SYSTEMS ONLINE",
    "NAV LINK ESTABLISHED",
    "SAVEAS FOR BIZ READY",
  ];
  let bootI = 0;
  const bootTimer = setInterval(() => {
    bootI += 1;
    if (els.bootLine && bootLines[bootI]) els.bootLine.textContent = bootLines[bootI];
    if (bootI >= bootLines.length - 1) {
      clearInterval(bootTimer);
      setTimeout(() => body.classList.remove("is-booting"), 450);
    }
  }, 420);

  /* Clock */
  const tick = () => {
    const d = new Date();
    const t = [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
    if (els.clock) els.clock.textContent = t;
  };
  tick();
  setInterval(tick, 1000);

  function pad(n, len = 4) {
    return String(Math.max(0, Math.round(n))).padStart(len, "0");
  }

  function setMood(mood) {
    body.dataset.mood = mood || "dawn";
    if (window.SaveAsSky) window.SaveAsSky.setMood(mood || "dawn");
  }

  function applyBank(deg) {
    bankTarget = deg;
  }

  function updateFlight() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = Math.min(1, window.scrollY / max);
    const alt = 12 + p * 980;
    const spd = 148 + p * 92 + velocity * 18;
    const rte = Math.min(5, Math.floor(p * 5.2));

    if (els.rAlt) els.rAlt.textContent = pad(alt);
    if (els.rSpd) els.rSpd.textContent = pad(spd, 3);
    if (els.rRte) els.rRte.textContent = pad(rte, 2);
    if (els.hudSpd) els.hudSpd.textContent = "SPD " + pad(spd, 3);
    if (els.hudBank) els.hudBank.textContent = "BANK " + bank.toFixed(1) + "°";

    // throttle handle
    if (els.throttleHandle && !dragging) {
      const rail = els.throttleHandle.parentElement;
      const usable = rail.clientHeight - els.throttleHandle.clientHeight - 8;
      els.throttleHandle.style.top = 4 + p * usable + "px";
      els.throttleHandle.setAttribute("aria-valuenow", String(Math.round(p * 100)));
    }

    // active section
    let active = sections[0];
    const probe = window.scrollY + window.innerHeight * 0.35;
    for (const s of sections) {
      if (s.offsetTop <= probe) active = s;
    }
    if (active) {
      const mission = active.dataset.mission || "00";
      const status = active.dataset.status || "ONLINE";
      const mood = active.dataset.mood || "dawn";
      setMood(mood);
      if (els.sys) els.sys.textContent = status;
      if (els.rSys) els.rSys.textContent = status.length > 10 ? status.slice(0, 10) : status;

      // subtle bank near mission boundaries
      const idx = sections.indexOf(active);
      const local = (probe - active.offsetTop) / Math.max(1, active.offsetHeight);
      if (local < 0.18 && idx > 0) applyBank(-1.4);
      else if (local > 0.82 && idx < sections.length - 1) applyBank(1.2);
      else applyBank(0);

      // mission 01 carousel / flow
      if (mission === "01") syncFlow01(local);
      if (mission === "04") syncLink04(local);
    }

    // sky speed from velocity
    const targetSpeed = 1 + Math.min(1.2, velocity * 2.2);
    skySpeed += (targetSpeed - skySpeed) * 0.08;
    root.style.setProperty("--sky-speed", skySpeed.toFixed(3));

    // horizon parallax
    if (horizon) {
      horizon.style.transform = `translate3d(0, ${p * 18}px, 0) rotate(${-bank * 0.7}deg)`;
      horizon.style.top = 54 + p * 6 + "%";
    }
  }

  function syncFlow01(local) {
    const steps = [...document.querySelectorAll("#flow01 li")];
    const imgs = [...document.querySelectorAll("#car01 img")];
    const cap = document.getElementById("cap01");
    const labels = ["STORE SIGNAL", "PACKAGE / MENU", "ONLINE BRIDGE"];
    const i = Math.min(steps.length - 1, Math.floor(local * steps.length));
    const imgI = Math.min(imgs.length - 1, Math.floor(local * imgs.length));
    steps.forEach((el, n) => el.classList.toggle("on", n <= i));
    imgs.forEach((el, n) => el.classList.toggle("is-on", n === imgI));
    if (cap) cap.textContent = labels[imgI] || labels[0];
  }

  function syncLink04(local) {
    const board = document.getElementById("linkBoard");
    const stPc = document.getElementById("stPc");
    const stMobile = document.getElementById("stMobile");
    if (!board) return;
    board.classList.toggle("is-transfer", local > 0.25 && local < 0.7);
    const mobile = local > 0.55;
    board.classList.toggle("is-mobile-active", mobile);
    if (stPc) {
      stPc.textContent = mobile ? "OFFLINE" : "ONLINE";
      stPc.className = "st " + (mobile ? "off" : "on");
    }
    if (stMobile) {
      stMobile.textContent = mobile ? "CONNECTED" : "STANDBY";
      stMobile.className = "st " + (mobile ? "on" : "");
    }
  }

  /* Smooth bank lerp */
  function animateBank() {
    bank += (bankTarget - bank) * 0.06;
    root.style.setProperty("--bank", bank.toFixed(3) + "deg");
    if (els.hudBank) els.hudBank.textContent = "BANK " + bank.toFixed(1) + "°";
    requestAnimationFrame(animateBank);
  }
  if (!reduce) requestAnimationFrame(animateBank);

  /* Scroll velocity */
  window.addEventListener(
    "scroll",
    () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastScroll);
      const dt = Math.max(16, now - lastT);
      velocity = Math.min(1.5, dy / dt);
      lastScroll = window.scrollY;
      lastT = now;
      updateFlight();
    },
    { passive: true }
  );
  window.addEventListener("resize", updateFlight);
  updateFlight();
  // decay velocity
  setInterval(() => {
    velocity *= 0.86;
    if (velocity < 0.02) velocity = 0;
    root.style.setProperty("--sky-speed", (1 + Math.min(1.2, velocity * 2.2)).toFixed(3));
  }, 50);

  /* Mouse parallax */
  if (fine && !reduce) {
    window.addEventListener(
      "pointermove",
      (e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        const win = document.getElementById("windowAssembly");
        const hud = document.querySelector(".window-hud");
        if (win) win.style.transform = `translate3d(${nx * -3}px, ${ny * -2}px, 0)`;
        if (hud) hud.style.transform = `translate3d(${nx * 1.5}px, ${ny * 1}px, 0)`;
        if (window.SaveAsSky) window.SaveAsSky.setParallax(nx * -12);
        if (horizon) {
          const base = horizon.style.transform || "";
          // keep bank rotation; add mouse shift via margin
          horizon.style.marginLeft = nx * 8 + "px";
        }
      },
      { passive: true }
    );
  }

  /* Route select + ENGAGE */
  function selectRoute(btn) {
    activeRoute = btn;
    routeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    engageTarget = btn.dataset.target;
    if (els.navMission) els.navMission.textContent = btn.dataset.route;
    if (els.navSystem) els.navSystem.textContent = btn.dataset.name;
    if (els.navType) els.navType.textContent = btn.dataset.type;
    if (els.navLock) {
      els.navLock.textContent = "SELECTED";
      els.navLock.classList.remove("lock");
    }
  }
  routeBtns.forEach((btn) => btn.addEventListener("click", () => selectRoute(btn)));
  if (activeRoute) selectRoute(activeRoute);

  function engage(selector) {
    const target = document.querySelector(selector);
    if (!target) return;
    if (els.navLock) {
      els.navLock.textContent = "ROUTE LOCK";
      els.navLock.classList.add("lock");
    }
    applyBank(-1.6);
    skySpeed = 1.8;
    root.style.setProperty("--sky-speed", "1.8");
    setTimeout(() => {
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      setTimeout(() => applyBank(0), 900);
    }, 280);
  }

  document.getElementById("engageRoute")?.addEventListener("click", () => engage(engageTarget));
  document.getElementById("startMission")?.addEventListener("click", () => {
    document.getElementById("plan")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });

  /* Throttle buttons + drag */
  document.querySelectorAll(".throttle-rail > button").forEach((btn) => {
    btn.addEventListener("click", () => engage(btn.dataset.target));
  });

  const handle = els.throttleHandle;
  if (handle) {
    const onMove = (clientY) => {
      const rail = handle.parentElement;
      const rect = rail.getBoundingClientRect();
      const y = Math.min(rect.height - 32, Math.max(4, clientY - rect.top - 14));
      handle.style.top = y + "px";
      const p = (y - 4) / Math.max(1, rect.height - 36);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: p * max, behavior: "auto" });
    };
    handle.addEventListener("pointerdown", (e) => {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      onMove(e.clientY);
    });
    handle.addEventListener("pointerup", () => {
      dragging = false;
    });
  }

  /* MakerBridge switches */
  const switches = [...document.querySelectorAll(".switch-bank .switch")];
  const demos = [...document.querySelectorAll(".mb-demo")];
  const mbCap = document.getElementById("mbCap");
  const caps = { text: "TEXT INPUT", image: "IMAGE PLACE", align: "ALIGN CENTER", cutline: "CUTLINE GEN" };
  const frames = {
    text: "assets/missions/03-makerbridge/editor.webp",
    image: "assets/missions/03-makerbridge/editor.webp",
    align: "assets/missions/03-makerbridge/editor.webp",
    cutline: "assets/missions/03-makerbridge/cutline.webp",
  };
  const mbFrame = document.getElementById("mbFrame");

  function setDemo(name) {
    switches.forEach((s) => {
      const on = s.dataset.demo === name;
      s.classList.toggle("on", on);
      s.setAttribute("aria-pressed", String(on));
    });
    demos.forEach((d) => d.classList.toggle("is-active", d.dataset.demo === name));
    if (mbCap) mbCap.textContent = caps[name] || name.toUpperCase();
    if (mbFrame && frames[name]) mbFrame.src = frames[name];
  }
  switches.forEach((s) => s.addEventListener("click", () => setDemo(s.dataset.demo)));

  // auto-cycle demos when M03 visible
  let demoIdx = 0;
  const demoOrder = ["text", "image", "align", "cutline"];
  setInterval(() => {
    const m03 = document.getElementById("m03");
    if (!m03) return;
    const r = m03.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.7 && r.bottom > window.innerHeight * 0.2) {
      if (!switches.some((s) => s.matches(":active"))) {
        demoIdx = (demoIdx + 1) % demoOrder.length;
        setDemo(demoOrder[demoIdx]);
      }
    }
  }, 4200);

  /* Pause offscreen carousels via IO */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.target.id === "car01" && en.isIntersecting) {
          const first = en.target.querySelector("img");
          if (first) first.classList.add("is-on");
        }
      });
    },
    { threshold: 0.2 }
  );
  const car = document.getElementById("car01");
  if (car) io.observe(car);

  // init first carousel image
  document.querySelector("#car01 img")?.classList.add("is-on");
})();
