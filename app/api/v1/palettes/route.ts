import type {
  PaletteListResponse,
  SavePaletteRequest,
  SavePaletteResponse,
} from "@/lib/contracts/palette";
import {
  getPaletteStorageDriver,
  listPalettes,
  saveGeneratedPalette,
} from "@/lib/storage/palette-repository";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  const response: PaletteListResponse = {
    palettes: await listPalettes(),
  };

  return Response.json(response, {
    headers: {
      ...corsHeaders,
      "x-spectro-storage": getPaletteStorageDriver(),
    },
  });
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
      palette: await saveGeneratedPalette(body.palette, body.name),
    };

    return Response.json(response, {
      status: 201,
      headers: {
        ...corsHeaders,
        "x-spectro-storage": getPaletteStorageDriver(),
      },
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
