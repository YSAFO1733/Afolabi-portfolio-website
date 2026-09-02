# Yusuf Afolabi — Portfolio (Next.js)

## Requirements
- Node.js installed on your machine (v18 or newer recommended)

## First-time setup
```
npm install
```

## Run locally to preview
```
npm run dev
```
Then open http://localhost:3000

## Build for deployment
```
npm run build
```
This produces a fully static site in the `out/` folder — plain HTML/CSS/JS,
no server required. Deploy that `out/` folder to Netlify, GitHub Pages,
Vercel, or any static host.

## Notes
- The CV lives in `public/Yusuf-Afolabi-CV.pdf`. Replace this file (keep the
  same filename) to update it — no code changes needed.
- The hero photo and two of the carousel covers (Hygge, Real Estate) are
  hosted externally on postimg.cc. If any of those links ever go down,
  update the `src` in `app/page.js` to a new URL.
- Day/Night mode resets on every page load by design — it does not remember
  a visitor's choice between visits.
- The custom round cursor only activates on devices with a real mouse
  (checked via a pointer/hover media query) — touch devices keep their
  normal behavior untouched.
