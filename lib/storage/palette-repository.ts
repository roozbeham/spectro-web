import type { GeneratedPalette, SavedPalette } from "@/lib/contracts/palette";
import {
  deleteSavedPalette,
  duplicateSavedPalette,
  getSavedPalette,
  listSavedPalettes,
  renameSavedPalette,
  savePalette,
} from "@/lib/storage/palette-store";
import {
  deleteSupabasePalette,
  duplicateSupabasePalette,
  getSupabasePalette,
  hasSupabasePaletteStorageConfig,
  listSupabasePalettes,
  renameSupabasePalette,
  saveSupabasePalette,
} from "@/lib/storage/supabase-palette-store";

function shouldUseSupabaseStorage(): boolean {
  return process.env.PALETTE_STORAGE_DRIVER === "supabase"
    && hasSupabasePaletteStorageConfig();
}

export function getPaletteStorageDriver(): "local" | "supabase" {
  return shouldUseSupabaseStorage() ? "supabase" : "local";
}

export async function listPalettes(userId?: string): Promise<SavedPalette[]> {
  return shouldUseSupabaseStorage()
    ? await listSupabasePalettes(userId)
    : await listSavedPalettes();
}

export async function getPalette(id: string, userId?: string): Promise<SavedPalette | null> {
  return shouldUseSupabaseStorage()
    ? await getSupabasePalette(id, userId)
    : await getSavedPalette(id);
}

export async function saveGeneratedPalette(palette: GeneratedPalette, name?: string, userId?: string): Promise<SavedPalette> {
  return shouldUseSupabaseStorage()
    ? await saveSupabasePalette(palette, name, userId)
    : await savePalette(palette, name);
}

export async function renamePalette(id: string, name: string, userId?: string): Promise<SavedPalette> {
  return shouldUseSupabaseStorage()
    ? await renameSupabasePalette(id, name, userId)
    : await renameSavedPalette(id, name);
}

export async function deletePalette(id: string, userId?: string): Promise<void> {
  return shouldUseSupabaseStorage()
    ? await deleteSupabasePalette(id, userId)
    : await deleteSavedPalette(id);
}

export async function duplicatePalette(id: string, userId?: string): Promise<SavedPalette> {
  return shouldUseSupabaseStorage()
    ? await duplicateSupabasePalette(id, userId)
    : await duplicateSavedPalette(id);
}
