import type { SavedPalette } from "@/lib/contracts/palette";

function toVariableName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "palette";
}

function getColorLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function createCssVariablesExport(palette: SavedPalette): string {
  const prefix = toVariableName(palette.name);
  const lines = palette.colors.map((color, index) => (
    `  --${prefix}-${getColorLabel(index)}: ${color};`
  ));

  return [
    ":root {",
    ...lines,
    "}",
  ].join("\n");
}

export function createJsonExport(palette: SavedPalette): string {
  return JSON.stringify({
    id: palette.id,
    name: palette.name,
    seedHex: palette.seedHex,
    mode: palette.mode,
    colors: palette.colors,
    colorData: palette.colorData,
    groups: palette.groups,
    settings: palette.settings,
    source: palette.source,
    createdAt: palette.createdAt,
    updatedAt: palette.updatedAt,
  }, null, 2);
}

export function createSpectroThemeExport(palette: SavedPalette): string {
  const key = toVariableName(palette.name).replace(/-/g, "");
  const colors = palette.colors
    .map((color, index) => `        ${getColorLabel(index)}: "${color}",`)
    .join("\n");

  return [
    "export default {",
    "  theme: {",
    "    extend: {",
    "      colors: {",
    `        ${key}: {`,
    colors,
    "        },",
    "      },",
    "    },",
    "  },",
    "};",
  ].join("\n");
}
