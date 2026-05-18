import {
  normalizeHex,
  type GeneratedPalette,
  type PaletteMode,
  type PaletteSource,
  type SavedPalette,
} from "@/lib/contracts/palette";

type SupabasePaletteRow = {
  id: string;
  name: string;
  seed_hex: string;
  mode: PaletteMode;
  colors: string[];
  color_data: SavedPalette["colorData"];
  groups: SavedPalette["groups"] | null;
  settings: SavedPalette["settings"];
  source: PaletteSource;
  created_at: string;
  updated_at: string;
};

type SupabasePaletteInsert = {
  name: string;
  seed_hex: string;
  mode: PaletteMode;
  colors: string[];
  color_data: SavedPalette["colorData"];
  groups?: SavedPalette["groups"];
  settings: SavedPalette["settings"];
  source: PaletteSource;
};

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

export function hasSupabasePaletteStorageConfig(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.serviceRoleKey);
}

function getSupabaseRestUrl(path: string): string {
  const { url } = getSupabaseConfig();
  return `${url.replace(/\/$/, "")}/rest/v1/${path.replace(/^\//, "")}`;
}

async function requestSupabase<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { serviceRoleKey } = getSupabaseConfig();

  if (!hasSupabasePaletteStorageConfig()) {
    throw new Error("Supabase palette storage is not configured.");
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

function toSavedPalette(row: SupabasePaletteRow): SavedPalette {
  return {
    id: row.id,
    name: row.name,
    seedHex: row.seed_hex,
    mode: row.mode,
    colors: row.colors,
    colorData: row.color_data,
    groups: row.groups || undefined,
    settings: row.settings || {},
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPaletteInsert(palette: GeneratedPalette, name?: string): SupabasePaletteInsert {
  const colors = (Array.isArray(palette.colors) ? palette.colors : [])
    .map((color) => normalizeHex(color))
    .filter(Boolean);

  if (!colors.length) {
    throw new Error("Palette must include at least one valid color.");
  }

  return {
    name: String(name || palette.name || "Untitled Palette").trim() || "Untitled Palette",
    seed_hex: normalizeHex(palette.seedHex) || colors[Math.floor(colors.length / 2)] || colors[0],
    mode: palette.mode,
    colors,
    color_data: Array.isArray(palette.colorData) && palette.colorData.length
      ? palette.colorData
      : colors.map((hex, index) => ({
        label: String(index + 1),
        hex,
      })),
    groups: palette.groups,
    settings: palette.settings || {},
    source: palette.source,
  };
}

export async function listSupabasePalettes(): Promise<SavedPalette[]> {
  const rows = await requestSupabase<SupabasePaletteRow[]>(
    "palettes?select=*&order=updated_at.desc",
  );

  return rows.map(toSavedPalette);
}

export async function saveSupabasePalette(palette: GeneratedPalette, name?: string): Promise<SavedPalette> {
  const rows = await requestSupabase<SupabasePaletteRow[]>("palettes", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(toPaletteInsert(palette, name)),
  });

  if (!rows[0]) {
    throw new Error("Supabase did not return the saved palette.");
  }

  return toSavedPalette(rows[0]);
}
