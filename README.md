# bitfeed (Next.js)

A full migration of the bitfeed community news platform from vanilla HTML/CSS/JS
to **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
TanStack Query**, optimized for latency and scaling.

The legacy static site still lives in the repository root; this `web/` app is the
modern rebuild.

## Architecture

| Concern | Approach |
|---|---|
| Public reads (home, articles, author, students) | **Server Components** via the Firebase **Admin SDK** with ISR (`revalidate`) for fast, CDN-cached delivery |
| Interactivity (auth, likes/saves, realtime ticker, admin) | **Client Components** with the Firebase **Web SDK** + **TanStack Query** |
| Auth | Google · Twitter/X · custom Email-OTP, in a React context (`AuthProvider`) |
| SEO | `generateMetadata` + JSON-LD per route (replaces the legacy prerender token) |
| Routing | App Router. `(site)` route group carries the global chrome; `/admin/*` is chrome-free and role-guarded |

### Project layout

```
src/
├── app/
│   ├── (site)/        # public pages with header/footer/search chrome
│   │   ├── page.tsx            # homepage
│   │   ├── articles/[id]       # article (SSR + metadata)
│   │   ├── articles            # paginated listing
│   │   ├── author/[email]      # public author profile (SSR)
│   │   ├── profile             # logged-in user profile
│   │   ├── apply               # reporter application
│   │   ├── students(/resources)# AI hub + resources
│   │   └── about|privacy-policy|error-page
│   ├── admin/         # role-guarded admin suite (dashboard, post, requests,
│   │                  #   bulk-upload, panel, migrate)
│   ├── layout.tsx     # providers only
│   ├── robots.ts · sitemap.ts · not-found.tsx
├── components/  layout · auth · home · article · profile · admin · students · ui
├── lib/
│   ├── firebase/  client.ts · admin.ts · types.ts · serialize.ts
│   ├── data/      server reads + client reads/mutations + search cache
│   └── utils/     dates · text · debounce
└── hooks/  useLatestNews
```

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in FIREBASE_SERVICE_ACCOUNT
npm run dev                  # http://localhost:3000
```

The Firebase **web** config is public and falls back to the bitfeed project in
`src/lib/env.ts`. The Firebase **Admin** service account
(`FIREBASE_SERVICE_ACCOUNT`) is **required** for server-rendered pages (article,
author) to load data — without it those pages render an empty / "not found"
state. Client-rendered data (latest-news ticker, `/articles` search) works
without it.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build (type-checks too) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config) |

## Deployment

Targets a Node host (Vercel). Push the `web/` directory; Vercel auto-detects
Next.js. Set the env vars from `.env.example` in project settings. Security and
asset-cache headers are configured in `next.config.ts`.

## Notes / fidelity caveats (carried over from the legacy app)

- **Email-OTP** is generated client-side and emailed via Google Apps Script —
  faithful to the original, but should move server-side for security.
- **Cover images** are base64 data URLs stored in Firestore (rendered with plain
  `<img>`); a Storage migration would be a worthwhile follow-up.
- Article `status` is `"active"` and user/author docs are keyed by **email**
  (the live data model, which differs from the legacy README).
# bit-feed-nxtjs
# bit-feed-nxtjs
