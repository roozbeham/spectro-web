import type {
  GeneratedPaletteColor,
  GeneratedPaletteGroup,
  GeneratePaletteRequest,
} from "@/lib/contracts/palette";
import { generateTintShadeStatusPalette } from "@/lib/engine/tintshade-status-engine";

export type StatusPaletteResult = {
  colors: string[];
  colorData: GeneratedPaletteColor[];
  groups: GeneratedPaletteGroup[];
};

export function generateStatusPalette(input: GeneratePaletteRequest): StatusPaletteResult {
  return generateTintShadeStatusPalette(input) as StatusPaletteResult;
}
