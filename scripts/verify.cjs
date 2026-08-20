const path = require("path");
const { chromium } = require("F:/#1_zeron_web_develop/_tmp_pages_probe/node_modules/playwright");

const root = "F:/#1_zeron_web_develop/saveas-for-biz";
const base = process.env.VERIFY_URL || "http://127.0.0.1:4173";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const viewports = [
    ["desktop", 1440, 900],
    ["tablet", 834, 1112],
    ["mobile", 390, 844],
  ];

  for (const [name, w, h] of viewports) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const failed = [];
    page.on("pageerror", (e) => errors.push(name + ": " + e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) failed.push(r.status() + " " + r.url());
    });
    await page.goto(base + "/", { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    const imgs = await page.evaluate(() =>
      [...document.images].map((i) => ({
        src: i.currentSrc || i.src,
        ok: i.complete && i.naturalWidth > 0,
      }))
    );
    const bad = imgs.filter((i) => !i.ok);
    console.log(name, "overflow=" + overflow, "imgs=" + imgs.length, "bad=" + bad.length);
    bad.slice(0, 5).forEach((b) => console.log("  bad", b.src));
    failed.slice(0, 8).forEach((f) => console.log("  fail", f));
    await page.screenshot({
      path: path.join(root, "assets", "_verify-" + name + ".jpg"),
      type: "jpeg",
      quality: 72,
      fullPage: false,
    });
    await page.close();
  }

  await browser.close();
  if (errors.length) {
    console.log("ERRORS");
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  } else {
    console.log("VERIFY OK");
  }
})();
