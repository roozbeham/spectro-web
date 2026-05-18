"use server";

import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { createPluginConnection } from "@/lib/plugin/plugin-connection-store";

export async function createPluginConnectionAction() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/sign-in?message=Please sign in to connect the Figma plugin.");
  }

  const result = await createPluginConnection(userId);
  const params = new URLSearchParams({
    token: result.token,
    expires: result.connection.expiresAt,
  });

  redirect(`/plugin/connect?${params.toString()}`);
}
