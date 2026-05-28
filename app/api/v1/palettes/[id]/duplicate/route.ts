import type { SavePaletteResponse } from "@/lib/contracts/palette";
import {
  duplicatePalette,
  getPaletteStorageDriver,
} from "@/lib/storage/palette-repository";
import {
  corsOptionsResponse,
  getCorsHeaders,
} from "@/lib/http/cors";

const corsOptions = {
  methods: "POST, OPTIONS",
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function OPTIONS(request: Request) {
  return corsOptionsResponse(request, corsOptions);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const response: SavePaletteResponse = {
      palette: await duplicatePalette(id),
    };

    return Response.json(response, {
      status: 201,
      headers: {
        ...getCorsHeaders(request, corsOptions),
        "x-spectro-storage": getPaletteStorageDriver(),
      },
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Palette could not be duplicated.",
    }, {
      status: 400,
      headers: getCorsHeaders(request, corsOptions),
    });
  }
}
