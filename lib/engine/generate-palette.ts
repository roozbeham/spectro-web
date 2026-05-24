import {
  type GeneratedPalette,
  type GeneratePaletteRequest,
  normalizeHex,
  normalizePaletteMode,
  normalizePaletteSource,
} from "@/lib/contracts/palette";
import { generateNeutralPalette } from "@/lib/engine/neutral-palette";
import { generateStatusPalette } from "@/lib/engine/status-palette";
import { getSpectroPrismPrimaryThemeAdjustment } from "@/lib/engine/spectro-prism";

export function generatePalette(input: GeneratePaletteRequest): GeneratedPalette {
  const seedHex = normalizeHex(input.seedHex || input.seedColor) || "#35ADE9";
  const mode = normalizePaletteMode(input.mode);
  const source = normalizePaletteSource(input.source);

  if (mode === "status") {
    const generated = generateStatusPalette({ ...input, seedHex });

    return {
      id: "preview",
      name: "Spectro Cloud Preview",
      seedHex,
      mode,
      colors: generated.colors,
      colorData: generated.colorData,
      groups: generated.groups,
      settings: input.settings || {},
      source,
      prism: getSpectroPrismPrimaryThemeAdjustment(seedHex, input.statusTheme || input.settings?.statusTheme),
    };
  }

  const generated = generateNeutralPalette({ ...input, seedHex });

  return {
    id: "preview",
    name: "Spectro Cloud Preview",
    seedHex,
    mode,
    colors: generated.colors,
    colorData: generated.colorData,
    settings: input.settings || {},
    source,
  };
}
