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
import { getCurrentUserId } from "@/lib/auth/current-user";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  const userId = await getCurrentUserId();
  const response: PaletteListResponse = {
    palettes: await listPalettes(userId),
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
    const userId = await getCurrentUserId();
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
      palette: await saveGeneratedPalette(body.palette, body.name, userId),
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
