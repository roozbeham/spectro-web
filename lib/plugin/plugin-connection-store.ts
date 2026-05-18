import { createHash, randomBytes } from "node:crypto";
import { requestSupabaseAdmin } from "@/lib/supabase/admin-rest";

const PLUGIN_CONNECTION_TTL_MINUTES = 10;

type PluginConnectionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  figma_user_id: string | null;
};

export type PluginConnection = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
  figmaUserId?: string;
};

export type CreatedPluginConnection = {
  connection: PluginConnection;
  token: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createToken(): string {
  return `spc_${randomBytes(32).toString("base64url")}`;
}

function toPluginConnection(row: PluginConnectionRow): PluginConnection {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    usedAt: row.used_at || undefined,
    revokedAt: row.revoked_at || undefined,
    figmaUserId: row.figma_user_id || undefined,
  };
}

export async function createPluginConnection(userId: string): Promise<CreatedPluginConnection> {
  const token = createToken();
  const expiresAt = new Date(Date.now() + PLUGIN_CONNECTION_TTL_MINUTES * 60 * 1000).toISOString();
  const rows = await requestSupabaseAdmin<PluginConnectionRow[]>("plugin_connections", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      token_hash: hashToken(token),
      expires_at: expiresAt,
    }),
  });

  if (!rows[0]) {
    throw new Error("Supabase did not return the plugin connection.");
  }

  return {
    connection: toPluginConnection(rows[0]),
    token,
  };
}
