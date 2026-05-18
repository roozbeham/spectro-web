export const PALETTE_MODES = ["neutral", "status"] as const;
export const PALETTE_SOURCES = ["web", "figma", "api"] as const;

export type PaletteMode = (typeof PALETTE_MODES)[number];
export type PaletteSource = (typeof PALETTE_SOURCES)[number];

export type GeneratePaletteRequest = {
  seedHex?: string;
  seedColor?: string;
  steps?: number;
  mode?: PaletteMode | string;
  settings?: Record<string, unknown>;
  source?: PaletteSource | string;
};

export type GeneratedPaletteColor = {
  label: string;
  hex: string;
  css?: string;
  tone?: string;
  toneIndex?: number;
  role?: string;
  group?: string;
  lightness?: number;
  isRoleAnchor?: boolean;
  roleAnchorHex?: string;
  roleAnchorType?: string;
  statusHueRange?: string;
};

export type GeneratedPaletteGroup = {
  key: string;
  label: string;
  roleAnchorHex: string;
  colors: GeneratedPaletteColor[];
};

export type GeneratedPalette = {
  id: string;
  name: string;
  seedHex: string;
  mode: PaletteMode;
  colors: string[];
  colorData: GeneratedPaletteColor[];
  groups?: GeneratedPaletteGroup[];
  settings: Record<string, unknown>;
  source: PaletteSource;
};

export type GeneratePaletteResponse = {
  palette: GeneratedPalette;
};

export function normalizeHex(value: unknown): string {
  const normalized = String(value || "").trim().replace(/^#/, "").toUpperCase();

  if (/^[0-9A-F]{3}$/.test(normalized)) {
    return `#${normalized
      .split("")
      .map((character) => character + character)
      .join("")}`;
  }

  return /^[0-9A-F]{6}$/.test(normalized) ? `#${normalized}` : "";
}

export function normalizePaletteMode(value: unknown): PaletteMode {
  return value === "status" ? "status" : "neutral";
}

export function normalizePaletteSource(value: unknown): PaletteSource {
  if (value === "web" || value === "figma") {
    return value;
  }

  return "api";
}

export function createColorData(colors: string[]): GeneratedPaletteColor[] {
  return colors.map((hex, index) => ({
    label: String(index + 1),
    hex,
  }));
}
