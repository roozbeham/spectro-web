import type { SavePaletteResponse } from "@/lib/contracts/palette";
import {
  deletePalette,
  getPalette,
  getPaletteStorageDriver,
  renamePalette,
} from "@/lib/storage/palette-repository";
import {
  corsOptionsResponse,
  getCorsHeaders,
} from "@/lib/http/cors";

const corsOptions = {
  methods: "GET, PATCH, DELETE, OPTIONS",
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function OPTIONS(request: Request) {
  return corsOptionsResponse(request, corsOptions);
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const palette = await getPalette(id);

  if (!palette) {
    return Response.json({
      error: "Palette was not found.",
    }, {
      status: 404,
      headers: getCorsHeaders(request, corsOptions),
    });
  }

  return Response.json({
    palette,
  }, {
    headers: {
      ...getCorsHeaders(request, corsOptions),
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
        headers: getCorsHeaders(request, corsOptions),
      });
    }

    const response: SavePaletteResponse = {
      palette: await renamePalette(id, name),
    };

    return Response.json(response, {
      headers: {
        ...getCorsHeaders(request, corsOptions),
        "x-spectro-storage": getPaletteStorageDriver(),
      },
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Palette could not be renamed.",
    }, {
      status: 400,
      headers: getCorsHeaders(request, corsOptions),
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    await deletePalette(id);

    return new Response(null, {
      status: 204,
      headers: {
        ...getCorsHeaders(request, corsOptions),
        "x-spectro-storage": getPaletteStorageDriver(),
      },
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Palette could not be deleted.",
    }, {
      status: 400,
      headers: getCorsHeaders(request, corsOptions),
    });
  }
}
