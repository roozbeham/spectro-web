import { createHash, randomBytes } from "node:crypto";
import { requestSupabaseAdmin, requestSupabaseAuthAdmin } from "@/lib/supabase/admin-rest";

const PLUGIN_CONNECTION_TTL_MINUTES = 10;
const PLUGIN_SESSION_TTL_DAYS = 30;

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

type PluginSessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
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

export type PluginSession = {
  id: string;
  userId: string;
  userEmail?: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  figmaUserId?: string;
};

export type ExchangedPluginConnection = {
  session: PluginSession;
  token: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createToken(prefix = "spc"): string {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

async function getUserEmail(userId: string): Promise<string | undefined> {
  try {
    const user = await requestSupabaseAuthAdmin<{ email?: string }>(`users/${encodeURIComponent(userId)}`);
    return user.email || undefined;
  } catch {
    return undefined;
  }
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

function toPluginSession(row: PluginSessionRow): PluginSession {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
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

export async function exchangePluginConnectionToken(
  token: string,
  figmaUserId?: string,
): Promise<ExchangedPluginConnection> {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    throw new Error("Paste a valid plugin connection token.");
  }

  const now = new Date().toISOString();
  const connectionQuery = new URLSearchParams({
    select: "*",
    token_hash: `eq.${hashToken(normalizedToken)}`,
    used_at: "is.null",
    revoked_at: "is.null",
    expires_at: `gt.${now}`,
    limit: "1",
  });
  const connectionRows = await requestSupabaseAdmin<PluginConnectionRow[]>(
    `plugin_connections?${connectionQuery.toString()}`,
  );
  const connection = connectionRows[0];

  if (!connection) {
    throw new Error("This plugin connection token is invalid, expired, or already used.");
  }

  await requestSupabaseAdmin<PluginConnectionRow[]>(
    `plugin_connections?id=eq.${encodeURIComponent(connection.id)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        used_at: now,
        figma_user_id: figmaUserId || null,
      }),
    },
  );

  const sessionToken = createToken("sps");
  const expiresAt = new Date(Date.now() + PLUGIN_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const sessionRows = await requestSupabaseAdmin<PluginSessionRow[]>("plugin_sessions", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: connection.user_id,
      token_hash: hashToken(sessionToken),
      expires_at: expiresAt,
      figma_user_id: figmaUserId || null,
    }),
  });

  if (!sessionRows[0]) {
    throw new Error("Supabase did not return the plugin session.");
  }

  const session = toPluginSession(sessionRows[0]);
  session.userEmail = await getUserEmail(connection.user_id);

  return {
    session,
    token: sessionToken,
  };
}
