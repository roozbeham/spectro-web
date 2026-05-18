import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  normalizeHex,
  type GeneratedPalette,
  type SavedPalette,
} from "@/lib/contracts/palette";

const DATA_DIR = path.join(process.cwd(), ".spectro-data");
const PALETTES_FILE = path.join(DATA_DIR, "palettes.json");

type PaletteStoreFile = {
  palettes: SavedPalette[];
};

function createEmptyStore(): PaletteStoreFile {
  return {
    palettes: [],
  };
}

async function readStore(): Promise<PaletteStoreFile> {
  try {
    const file = await readFile(PALETTES_FILE, "utf8");
    const parsed = JSON.parse(file) as Partial<PaletteStoreFile>;

    return {
      palettes: Array.isArray(parsed.palettes) ? parsed.palettes : [],
    };
  } catch {
    return createEmptyStore();
  }
}

async function writeStore(store: PaletteStoreFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(PALETTES_FILE, JSON.stringify(store, null, 2));
}

function normalizeGeneratedPalette(palette: GeneratedPalette, name?: string): GeneratedPalette {
  const colors = (Array.isArray(palette.colors) ? palette.colors : [])
    .map((color) => normalizeHex(color))
    .filter(Boolean);

  if (!colors.length) {
    throw new Error("Palette must include at least one valid color.");
  }

  return {
    ...palette,
    id: randomUUID(),
    name: String(name || palette.name || "Untitled Palette").trim() || "Untitled Palette",
    seedHex: normalizeHex(palette.seedHex) || colors[Math.floor(colors.length / 2)] || colors[0],
    colors,
    colorData: Array.isArray(palette.colorData) && palette.colorData.length
      ? palette.colorData
      : colors.map((hex, index) => ({
        label: String(index + 1),
        hex,
      })),
    settings: palette.settings || {},
  };
}

export async function listSavedPalettes(): Promise<SavedPalette[]> {
  const store = await readStore();
  return store.palettes.sort((first, second) => (
    new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
  ));
}

export async function getSavedPalette(id: string): Promise<SavedPalette | null> {
  const store = await readStore();
  return store.palettes.find((palette) => palette.id === id) || null;
}

export async function savePalette(palette: GeneratedPalette, name?: string): Promise<SavedPalette> {
  const store = await readStore();
  const now = new Date().toISOString();
  const savedPalette: SavedPalette = {
    ...normalizeGeneratedPalette(palette, name),
    createdAt: now,
    updatedAt: now,
  };

  store.palettes.unshift(savedPalette);
  await writeStore(store);

  return savedPalette;
}

export async function renameSavedPalette(id: string, name: string): Promise<SavedPalette> {
  const store = await readStore();
  const palette = store.palettes.find((item) => item.id === id);

  if (!palette) {
    throw new Error("Palette was not found.");
  }

  palette.name = name.trim() || palette.name;
  palette.updatedAt = new Date().toISOString();
  await writeStore(store);

  return palette;
}

export async function deleteSavedPalette(id: string): Promise<void> {
  const store = await readStore();
  store.palettes = store.palettes.filter((palette) => palette.id !== id);
  await writeStore(store);
}

export async function duplicateSavedPalette(id: string): Promise<SavedPalette> {
  const store = await readStore();
  const palette = store.palettes.find((item) => item.id === id);

  if (!palette) {
    throw new Error("Palette was not found.");
  }

  const now = new Date().toISOString();
  const duplicate: SavedPalette = {
    ...palette,
    id: randomUUID(),
    name: `${palette.name} Copy`,
    createdAt: now,
    updatedAt: now,
  };

  store.palettes.unshift(duplicate);
  await writeStore(store);
  return duplicate;
}
