import type {
  PaletteListResponse,
  SavePaletteRequest,
  SavePaletteResponse,
} from "@/lib/contracts/palette";
import { listSavedPalettes, savePalette } from "@/lib/storage/palette-store";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  const response: PaletteListResponse = {
    palettes: await listSavedPalettes(),
  };

  return Response.json(response, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as SavePaletteRequest;

    if (!body.palette) {
      return Response.json({
        error: "Missing palette.",
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    const response: SavePaletteResponse = {
      palette: await savePalette(body.palette, body.name),
    };

    return Response.json(response, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Palette could not be saved.",
    }, {
      status: 400,
      headers: corsHeaders,
    });
  }
}
