import { generatePalette } from "@/lib/engine/generate-palette";
import type {
  GeneratePaletteRequest,
  GeneratePaletteResponse,
} from "@/lib/contracts/palette";
import {
  normalizeHex,
  normalizePaletteMode,
  normalizePaletteSource,
} from "@/lib/contracts/palette";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Expose-Headers": "X-Spectro-Cache",
};
const paletteResponseCache = new Map<string, {
  expiresAt: number;
  response: GeneratePaletteResponse;
}>();
const pendingPaletteResponses = new Map<string, Promise<GeneratePaletteResponse>>();
const PALETTE_RESPONSE_CACHE_TTL_MS = 10 * 60 * 1000;
const PALETTE_RESPONSE_CACHE_LIMIT = 128;

function getStableCacheValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(getStableCacheValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>(
      (result, key) => {
        result[key] = getStableCacheValue((value as Record<string, unknown>)[key]);
        return result;
      },
      {},
    );
  }

  return value;
}

function cloneGeneratePaletteResponse(response: GeneratePaletteResponse): GeneratePaletteResponse {
  return JSON.parse(JSON.stringify(response)) as GeneratePaletteResponse;
}

function getPaletteCacheKey(body: GeneratePaletteRequest): string {
  const settings = body.settings && typeof body.settings === "object" ? body.settings : {};
  const settingsStatusTheme = typeof settings.statusTheme === "string" ? settings.statusTheme : undefined;
  const statusTheme = String(body.statusTheme || settingsStatusTheme || "light").toLowerCase() === "dark"
    ? "dark"
    : "light";

  return JSON.stringify(getStableCacheValue({
    seedHex: normalizeHex(body.seedHex || body.seedColor) || "#35ADE9",
    mode: normalizePaletteMode(body.mode),
    source: normalizePaletteSource(body.source),
    statusTheme,
    steps: Number.isFinite(Number(body.steps)) ? Number(body.steps) : null,
    settings,
  }));
}

function getCachedPaletteResponse(cacheKey: string): GeneratePaletteResponse | null {
  const cached = paletteResponseCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    paletteResponseCache.delete(cacheKey);
    return null;
  }

  paletteResponseCache.delete(cacheKey);
  paletteResponseCache.set(cacheKey, cached);
  return cloneGeneratePaletteResponse(cached.response);
}

function rememberPaletteResponse(cacheKey: string, response: GeneratePaletteResponse) {
  if (paletteResponseCache.has(cacheKey)) {
    paletteResponseCache.delete(cacheKey);
  }

  paletteResponseCache.set(cacheKey, {
    expiresAt: Date.now() + PALETTE_RESPONSE_CACHE_TTL_MS,
    response: cloneGeneratePaletteResponse(response),
  });

  while (paletteResponseCache.size > PALETTE_RESPONSE_CACHE_LIMIT) {
    const oldestCacheKey = paletteResponseCache.keys().next().value;
    if (!oldestCacheKey) {
      break;
    }
    paletteResponseCache.delete(oldestCacheKey);
  }
}

function jsonPaletteResponse(response: GeneratePaletteResponse, cacheStatus: string) {
  return Response.json(response, {
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store",
      "X-Spectro-Cache": cacheStatus,
    },
  });
}

export async function GET() {
  return Response.json({
    message: "This endpoint is working, but it needs a POST request to generate a palette.",
    endpoint: "POST /api/v1/palettes/generate",
    exampleBody: {
      seedHex: "#35ADE9",
      seedColor: "#35ADE9",
      mode: "neutral",
      source: "figma",
    },
  }, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  const body = await request.json() as GeneratePaletteRequest;
  const cacheKey = getPaletteCacheKey(body);
  const cachedResponse = getCachedPaletteResponse(cacheKey);

  if (cachedResponse) {
    return jsonPaletteResponse(cachedResponse, "HIT");
  }

  const pendingResponse = pendingPaletteResponses.get(cacheKey);
  if (pendingResponse) {
    return jsonPaletteResponse(await pendingResponse, "DEDUPED");
  }

  const responsePromise = Promise.resolve().then(() => {
    const palette = generatePalette(body);
    const response: GeneratePaletteResponse = {
      palette,
    };

    rememberPaletteResponse(cacheKey, response);
    return cloneGeneratePaletteResponse(response);
  });

  pendingPaletteResponses.set(cacheKey, responsePromise);

  try {
    const response = await responsePromise;

    return jsonPaletteResponse(response, "MISS");
  } finally {
    pendingPaletteResponses.delete(cacheKey);
  }
}
