function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

export function hasSupabaseAdminConfig(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.serviceRoleKey);
}

export function getSupabaseRestUrl(path: string): string {
  const { url } = getSupabaseConfig();
  return `${url.replace(/\/$/, "")}/rest/v1/${path.replace(/^\//, "")}`;
}

export function getSupabaseAuthAdminUrl(path: string): string {
  const { url } = getSupabaseConfig();
  return `${url.replace(/\/$/, "")}/auth/v1/admin/${path.replace(/^\//, "")}`;
}

export async function requestSupabaseAdmin<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { serviceRoleKey } = getSupabaseConfig();

  if (!hasSupabaseAdminConfig()) {
    throw new Error("Supabase admin storage is not configured.");
  }

  const response = await fetch(getSupabaseRestUrl(path), {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Supabase request failed.");
  }

  if (response.status === 204) {
    return null as T;
  }

  return await response.json() as T;
}

export async function requestSupabaseAuthAdmin<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { serviceRoleKey } = getSupabaseConfig();

  if (!hasSupabaseAdminConfig()) {
    throw new Error("Supabase admin storage is not configured.");
  }

  const response = await fetch(getSupabaseAuthAdminUrl(path), {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Supabase auth admin request failed.");
  }

  return await response.json() as T;
}
