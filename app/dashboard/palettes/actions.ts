"use server";

import { revalidatePath } from "next/cache";
import {
  deletePalette,
  duplicatePalette,
  renamePalette,
} from "@/lib/storage/palette-repository";

function getRequiredValue(formData: FormData, key: string): string {
  const value = String(formData.get(key) || "").trim();

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

export async function renamePaletteAction(formData: FormData) {
  await renamePalette(
    getRequiredValue(formData, "paletteId"),
    getRequiredValue(formData, "name"),
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/palettes");
}

export async function duplicatePaletteAction(formData: FormData) {
  await duplicatePalette(getRequiredValue(formData, "paletteId"));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/palettes");
}

export async function deletePaletteAction(formData: FormData) {
  await deletePalette(getRequiredValue(formData, "paletteId"));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/palettes");
}
