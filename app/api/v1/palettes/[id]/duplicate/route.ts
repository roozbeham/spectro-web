import type { SavePaletteResponse } from "@/lib/contracts/palette";
import { getCurrentUserId } from "@/lib/auth/current-user";
import {
  duplicatePalette,
  getPaletteStorageDriver,
} from "@/lib/storage/palette-repository";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getCurrentUserId();
    const response: SavePaletteResponse = {
      palette: await duplicatePalette(id, userId),
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
      error: error instanceof Error ? error.message : "Palette could not be duplicated.",
    }, {
      status: 400,
      headers: corsHeaders,
    });
  }
}
