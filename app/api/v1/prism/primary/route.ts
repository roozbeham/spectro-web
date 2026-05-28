import {
  analyzeSpectroPrismPrimaryColor,
  getRandomSpectroPrismSafePrimaryHex,
  getSpectroPrismPrimaryThemeAdjustment,
} from "@/lib/engine/spectro-prism";
import {
  corsOptionsResponse,
  getCorsHeaders,
} from "@/lib/http/cors";

export const runtime = "edge";

const corsOptions = {
  methods: "GET, POST, OPTIONS",
};

export async function GET(request: Request) {
  return Response.json({
    message: "This endpoint is working, but it needs a POST request to analyze a primary color.",
    endpoint: "POST /api/v1/prism/primary",
    exampleBody: {
      hex: "#35ADE9",
      theme: "dark",
    },
  }, { headers: getCorsHeaders(request, corsOptions) });
}

export async function OPTIONS(request: Request) {
  return corsOptionsResponse(request, corsOptions);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    hex?: unknown;
    excludedHex?: unknown;
    theme?: unknown;
    intent?: unknown;
  };

  if (body.intent === "safe-zone-random") {
    return Response.json({
      hex: getRandomSpectroPrismSafePrimaryHex(body.excludedHex || body.hex),
    }, { headers: getCorsHeaders(request, corsOptions) });
  }

  const analysis = analyzeSpectroPrismPrimaryColor(body.hex, body.theme);
  const adjustment = getSpectroPrismPrimaryThemeAdjustment(body.hex, body.theme);

  return Response.json({
    analysis,
    adjustment,
  }, { headers: getCorsHeaders(request, corsOptions) });
}
