"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth/current-user";
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
  const userId = await getCurrentUserId();
  await renamePalette(
    getRequiredValue(formData, "paletteId"),
    getRequiredValue(formData, "name"),
    userId,
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/palettes");
}

export async function duplicatePaletteAction(formData: FormData) {
  const userId = await getCurrentUserId();
  await duplicatePalette(getRequiredValue(formData, "paletteId"), userId);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/palettes");
}

export async function deletePaletteAction(formData: FormData) {
  const userId = await getCurrentUserId();
  await deletePalette(getRequiredValue(formData, "paletteId"), userId);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/palettes");
}
