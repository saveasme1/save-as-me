import fs from "fs";

const stamp = "fix4b" + Date.now().toString(36);

function bump(file, pairs) {
  let h = fs.readFileSync(file, "utf8");
  for (const [re, rep] of pairs) h = h.replace(re, rep);
  fs.writeFileSync(file, h);
}

/* portfolio home */
bump("index.html", [
  [/css\/portfolio\.css\?v=[^"']+/g, "css/portfolio.css?v=" + stamp],
  [/js\/portfolio\.js\?v=[^"']+/g, "js/portfolio.js?v=" + stamp],
]);

/* flight lab page */
if (fs.existsSync("flight.html")) {
  bump("flight.html", [
    [/css\/main\.css\?v=[^"']+/g, "css/main.css?v=" + stamp],
    [/js\/flight\.js\?v=[^"']+/g, "js/flight.js?v=" + stamp],
  ]);
}

if (fs.existsSync("js/flight.js")) {
  let f = fs.readFileSync("js/flight.js", "utf8");
  f = f.replace(
    /\.\/(cesium-world|gmp-usn-route)\.js\?v=[A-Za-z0-9._-]+/g,
    "./$1.js?v=" + stamp
  );
  if (f.includes("const ASSET_V")) {
    f = f.replace(/const ASSET_V = "[^"]+"/, `const ASSET_V = "${stamp}"`);
  }
  fs.writeFileSync("js/flight.js", f);
}

console.log(stamp);
