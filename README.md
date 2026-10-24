# Inkpair Studio

Check foreground and background contrast, compare text sizes and swap color pairs in a live specimen.

Lock the ink or paper and choose a 3:1, 4.5:1 or 7:1 target to preview a contrast repair. Apply the suggested color to the current pair.

Save named swatches in the browser collection, apply or remove saved pairs, and download the current pair as CSS custom properties.

## Run locally

Use Node.js 22 or newer to run `node scripts/verify.mjs`. To launch a local preview, run `python3 -m http.server 8080 --bind 127.0.0.1 --directory public` and open http://127.0.0.1:8080.

## Deployment

Vercel serves `public/` directly. The application uses browser platform APIs and ships with no package dependencies.

## Git dates

The initial commits use retrospective author dates from October–November 2026. Their committer timestamps record when this repository was assembled.
