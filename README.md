# Spectro Web

Spectro Web is the experimental API and future SaaS surface for Spectro.
The first milestone is a protected palette-generation API that the Figma plugin
can call without moving valuable engine logic into plugin/browser code.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Open [http://localhost:3000/palette-test](http://localhost:3000/palette-test)
to test the palette API visually.

## Supabase Setup

The palette API works with local JSON storage by default. To switch it to
Supabase:

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Set:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
PALETTE_STORAGE_DRIVER="supabase"
```

Use the service role key only on the server. Do not expose it in plugin or
browser code.

When Supabase storage is active, `GET /api/v1/palettes` and
`POST /api/v1/palettes` include this response header:

```text
x-spectro-storage: supabase
```

Without those env vars, the API falls back to local development storage:

```text
x-spectro-storage: local
```

## Palette API Contract

Endpoint:

```text
POST /api/v1/palettes/generate
```

Request:

```json
{
  "seedHex": "#35ADE9",
  "seedColor": "#35ADE9",
  "mode": "neutral",
  "source": "figma",
  "settings": {}
}
```

Response:

```json
{
  "palette": {
    "id": "preview",
    "name": "Spectro Cloud Preview",
    "seedHex": "#35ADE9",
    "mode": "neutral",
    "colors": ["#FFFFFF"],
    "colorData": [{ "label": "1", "hex": "#FFFFFF" }],
    "settings": {},
    "source": "figma"
  }
}
```

The canonical TypeScript contract lives in `lib/contracts/palette.ts`.

Current engine status:

- Neutral palettes are generated server-side from submitted controls.
- Status palettes are generated server-side as grouped role scales for Primary,
  Positive, Negative, Warning, and Information.
