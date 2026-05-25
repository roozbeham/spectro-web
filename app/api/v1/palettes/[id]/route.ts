import type { SavePaletteResponse } from "@/lib/contracts/palette";
import {
  deletePalette,
  getPalette,
  getPaletteStorageDriver,
  renamePalette,
} from "@/lib/storage/palette-repository";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
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

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const palette = await getPalette(id);

  if (!palette) {
    return Response.json({
      error: "Palette was not found.",
    }, {
      status: 404,
      headers: corsHeaders,
    });
  }

  return Response.json({
    palette,
  }, {
    headers: {
      ...corsHeaders,
      "x-spectro-storage": getPaletteStorageDriver(),
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
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
      palette: await renamePalette(id, name),
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

    await deletePalette(id);

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
