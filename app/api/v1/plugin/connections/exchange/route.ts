import { exchangePluginConnectionToken } from "@/lib/plugin/plugin-connection-store";

type PluginConnectionExchangeBody = {
  token?: unknown;
  figmaUserId?: unknown;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as PluginConnectionExchangeBody;
    const token = typeof body.token === "string" ? body.token : "";
    const figmaUserId = typeof body.figmaUserId === "string" ? body.figmaUserId : undefined;
    const exchanged = await exchangePluginConnectionToken(token, figmaUserId);

    return Response.json({
      session: {
        ...exchanged.session,
        token: exchanged.token,
      },
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Plugin connection could not be exchanged.",
    }, {
      status: 400,
      headers: corsHeaders,
    });
  }
}
