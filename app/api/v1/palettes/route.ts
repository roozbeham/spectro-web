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
import {
  corsOptionsResponse,
  getCorsHeaders,
} from "@/lib/http/cors";

const corsOptions = {
  methods: "GET, POST, OPTIONS",
};

export async function GET(request: Request) {
  const response: PaletteListResponse = {
    palettes: await listPalettes(),
  };

  return Response.json(response, {
    headers: {
      ...getCorsHeaders(request, corsOptions),
      "x-spectro-storage": getPaletteStorageDriver(),
    },
  });
}

export async function OPTIONS(request: Request) {
  return corsOptionsResponse(request, corsOptions);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as SavePaletteRequest;

    if (!body.palette) {
      return Response.json({
        error: "Missing palette.",
      }, {
        status: 400,
        headers: getCorsHeaders(request, corsOptions),
      });
    }

    const response: SavePaletteResponse = {
      palette: await saveGeneratedPalette(body.palette, body.name),
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
      error: error instanceof Error ? error.message : "Palette could not be saved.",
    }, {
      status: 400,
      headers: getCorsHeaders(request, corsOptions),
    });
  }
}
