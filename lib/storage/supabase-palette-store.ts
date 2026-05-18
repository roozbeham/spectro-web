import {
  normalizeHex,
  type GeneratedPalette,
  type PaletteMode,
  type PaletteSource,
  type SavedPalette,
} from "@/lib/contracts/palette";
import {
  hasSupabaseAdminConfig,
  requestSupabaseAdmin,
} from "@/lib/supabase/admin-rest";

type SupabasePaletteRow = {
  id: string;
  user_id: string | null;
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
  user_id?: string;
  name: string;
  seed_hex: string;
  mode: PaletteMode;
  colors: string[];
  color_data: SavedPalette["colorData"];
  groups?: SavedPalette["groups"];
  settings: SavedPalette["settings"];
  source: PaletteSource;
};

export function hasSupabasePaletteStorageConfig(): boolean {
  return hasSupabaseAdminConfig();
}

function toSavedPalette(row: SupabasePaletteRow): SavedPalette {
  return {
    id: row.id,
    userId: row.user_id || undefined,
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

function toPaletteInsert(palette: GeneratedPalette, name?: string, userId?: string): SupabasePaletteInsert {
  const colors = (Array.isArray(palette.colors) ? palette.colors : [])
    .map((color) => normalizeHex(color))
    .filter(Boolean);

  if (!colors.length) {
    throw new Error("Palette must include at least one valid color.");
  }

  return {
    user_id: userId,
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

export async function listSupabasePalettes(userId?: string): Promise<SavedPalette[]> {
  const query = userId
    ? `palettes?select=*&user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`
    : "palettes?select=*&order=updated_at.desc";
  const rows = await requestSupabaseAdmin<SupabasePaletteRow[]>(
    query,
  );

  return rows.map(toSavedPalette);
}

export async function getSupabasePalette(id: string, userId?: string): Promise<SavedPalette | null> {
  const query = userId
    ? `palettes?select=*&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`
    : `palettes?select=*&id=eq.${encodeURIComponent(id)}&limit=1`;
  const rows = await requestSupabaseAdmin<SupabasePaletteRow[]>(query);

  return rows[0] ? toSavedPalette(rows[0]) : null;
}

export async function saveSupabasePalette(palette: GeneratedPalette, name?: string, userId?: string): Promise<SavedPalette> {
  const rows = await requestSupabaseAdmin<SupabasePaletteRow[]>("palettes", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(toPaletteInsert(palette, name, userId)),
  });

  if (!rows[0]) {
    throw new Error("Supabase did not return the saved palette.");
  }

  return toSavedPalette(rows[0]);
}

export async function renameSupabasePalette(id: string, name: string, userId?: string): Promise<SavedPalette> {
  const query = userId
    ? `palettes?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`
    : `palettes?id=eq.${encodeURIComponent(id)}`;
  const rows = await requestSupabaseAdmin<SupabasePaletteRow[]>(query, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      name: name.trim(),
    }),
  });

  if (!rows[0]) {
    throw new Error("Palette was not found.");
  }

  return toSavedPalette(rows[0]);
}

export async function deleteSupabasePalette(id: string, userId?: string): Promise<void> {
  const query = userId
    ? `palettes?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`
    : `palettes?id=eq.${encodeURIComponent(id)}`;

  await requestSupabaseAdmin<null>(query, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  });
}

export async function duplicateSupabasePalette(id: string, userId?: string): Promise<SavedPalette> {
  const query = userId
    ? `palettes?select=*&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`
    : `palettes?select=*&id=eq.${encodeURIComponent(id)}&limit=1`;
  const rows = await requestSupabaseAdmin<SupabasePaletteRow[]>(query);
  const palette = rows[0];

  if (!palette) {
    throw new Error("Palette was not found.");
  }

  return await saveSupabasePalette(toSavedPalette(palette), `${palette.name} Copy`, userId);
}
