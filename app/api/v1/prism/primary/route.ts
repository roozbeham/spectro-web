import {
  analyzeSpectroPrismPrimaryColor,
  getRandomSpectroPrismSafePrimaryHex,
  getSpectroPrismPrimaryThemeAdjustment,
} from "@/lib/engine/spectro-prism";

export const runtime = "edge";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  return Response.json({
    message: "This endpoint is working, but it needs a POST request to analyze a primary color.",
    endpoint: "POST /api/v1/prism/primary",
    exampleBody: {
      hex: "#35ADE9",
      theme: "dark",
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
  const body = await request.json() as {
    hex?: unknown;
    excludedHex?: unknown;
    theme?: unknown;
    intent?: unknown;
  };

  if (body.intent === "safe-zone-random") {
    return Response.json({
      hex: getRandomSpectroPrismSafePrimaryHex(body.excludedHex || body.hex),
    }, { headers: corsHeaders });
  }

  const analysis = analyzeSpectroPrismPrimaryColor(body.hex, body.theme);
  const adjustment = getSpectroPrismPrimaryThemeAdjustment(body.hex, body.theme);

  return Response.json({
    analysis,
    adjustment,
  }, { headers: corsHeaders });
}
