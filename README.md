# event_management_fe

React (Vite) frontend for Event Management, deployed on **Cloudflare Pages**.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL (defaults to http://localhost:4000)
npm run dev            # http://localhost:5173
```

The home page calls `GET {VITE_API_URL}/api/messages` and lists the rows returned from Supabase.

## Deploy to Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**, then select this repo.
2. Build settings:
   - Framework preset: **React (Vite)**
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Environment variable: `VITE_API_URL` = your Northflank service URL (e.g. `https://api--event-be--xxxx.code.run`).
   It is baked in at build time, so redeploy after changing it.
4. Add the resulting `https://<project>.pages.dev` URL to the backend's `CORS_ORIGINS`.

`public/_redirects` handles SPA routing.
