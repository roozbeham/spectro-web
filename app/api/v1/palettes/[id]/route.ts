import type { SavePaletteResponse } from "@/lib/contracts/palette";
import { getCurrentUserId } from "@/lib/auth/current-user";
import {
  deletePalette,
  getPaletteStorageDriver,
  renamePalette,
} from "@/lib/storage/palette-repository";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH, DELETE, OPTIONS",
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getCurrentUserId();
    const body = await request.json() as { name?: string };
    const name = String(body.name || "").trim();

    if (!name) {
      return Response.json({
        error: "Palette name is required.",
      }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    const response: SavePaletteResponse = {
      palette: await renamePalette(id, name, userId),
    };

    return Response.json(response, {
      headers: {
        ...corsHeaders,
        "x-spectro-storage": getPaletteStorageDriver(),
      },
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Palette could not be renamed.",
    }, {
      status: 400,
      headers: corsHeaders,
    });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getCurrentUserId();

    await deletePalette(id, userId);

    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "x-spectro-storage": getPaletteStorageDriver(),
      },
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Palette could not be deleted.",
    }, {
      status: 400,
      headers: corsHeaders,
    });
  }
}
