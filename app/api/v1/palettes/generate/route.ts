import { generatePalette } from "@/lib/engine/generate-palette";
import type {
  GeneratePaletteRequest,
  GeneratePaletteResponse,
} from "@/lib/contracts/palette";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
  const palette = generatePalette(body);
  const response: GeneratePaletteResponse = {
    palette,
  };

  return Response.json(response, { headers: corsHeaders });
}
