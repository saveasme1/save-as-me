# SaveAs For Biz

Creative portfolio for **https://save-as.me** + experimental **3D Flight Lab**.

## Pages

| URL | What |
| --- | --- |
| `/` (`index.html`) | Editorial portfolio — work rail (PC+MO), skill bars, contact |
| `/flight.html` | Previous cockpit experience — Three.js + CesiumJS |

## Stack (portfolio)

- Vanilla HTML / CSS / ESM
- Syne + Pretendard + IBM Plex Mono

## Stack (flight lab)

- Three.js (cockpit GLB, lighting)
- CesiumJS (terrain / imagery route)
- Vanilla ESM modules

## Skill % note

Bars on `/#skills` are **estimates** from live headers (e.g. saveas.co.kr → WordPress/Apache). Adjust `data-pct` in `index.html`.

## Local

```bash
npx --yes serve .
```

## Deploy

GitHub Pages from `main` root. `CNAME` → `save-as.me`.
Cache bust: `node _stamp.js`
