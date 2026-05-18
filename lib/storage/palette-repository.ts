import type { GeneratedPalette, SavedPalette } from "@/lib/contracts/palette";
import { listSavedPalettes, savePalette } from "@/lib/storage/palette-store";
import {
  hasSupabasePaletteStorageConfig,
  listSupabasePalettes,
  saveSupabasePalette,
} from "@/lib/storage/supabase-palette-store";

function useSupabaseStorage(): boolean {
  return process.env.PALETTE_STORAGE_DRIVER === "supabase"
    && hasSupabasePaletteStorageConfig();
}

export function getPaletteStorageDriver(): "local" | "supabase" {
  return useSupabaseStorage() ? "supabase" : "local";
}

export async function listPalettes(userId?: string): Promise<SavedPalette[]> {
  return useSupabaseStorage()
    ? await listSupabasePalettes(userId)
    : await listSavedPalettes();
}

export async function saveGeneratedPalette(palette: GeneratedPalette, name?: string, userId?: string): Promise<SavedPalette> {
  return useSupabaseStorage()
    ? await saveSupabasePalette(palette, name, userId)
    : await savePalette(palette, name);
}
