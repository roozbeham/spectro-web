import { getCurrentUserId } from "@/lib/auth/current-user";
import { createPluginConnection } from "@/lib/plugin/plugin-connection-store";

export async function POST() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return Response.json({
        error: "Sign in before connecting the Figma plugin.",
      }, {
        status: 401,
      });
    }

    const connection = await createPluginConnection(userId);

    return Response.json({
      connection,
    }, {
      status: 201,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Plugin connection could not be created.",
    }, {
      status: 400,
    });
  }
}
