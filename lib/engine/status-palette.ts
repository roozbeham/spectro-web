import {
  normalizeHex,
  type GeneratedPaletteColor,
  type GeneratedPaletteGroup,
  type GeneratePaletteRequest,
} from "@/lib/contracts/palette";

const STATUS_TONES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const STATUS_LIGHTNESS = [97, 92, 84, 74, 64, 54, 44, 34, 24, 14, 7];
const STATUS_SATURATION_MULTIPLIERS = [0.18, 0.26, 0.38, 0.52, 0.7, 0.86, 0.9, 0.78, 0.62, 0.46, 0.34];
const ROLE_ANCHOR_INDEX = 5;

const STATUS_ROLES = [
  { key: "primary", label: "Primary", fallbackHex: "#8B5CF6", hueShift: 0 },
  { key: "positive", label: "Positive", fallbackHex: "#22C55E", hueShift: 0 },
  { key: "negative", label: "Negative", fallbackHex: "#EF4444", hueShift: 0 },
  { key: "warning", label: "Warning", fallbackHex: "#EAB308", hueShift: 0 },
  { key: "info", label: "Information", fallbackHex: "#0EA5E9", hueShift: 0 },
] as const;

export type StatusPaletteResult = {
  colors: string[];
  colorData: GeneratedPaletteColor[];
  groups: GeneratedPaletteGroup[];
};

type HslColor = {
  hue: number;
  saturation: number;
  lightness: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getSeedHex(input: GeneratePaletteRequest): string {
  const settings = readRecord(input.settings);
  const hex = readRecord(settings.hex);

  return normalizeHex(hex.value || input.seedHex || input.seedColor) || STATUS_ROLES[0].fallbackHex;
}

function hexToRgb(hex: string): { red: number; green: number; blue: number } | null {
  const normalized = normalizeHex(hex);

  if (!normalized) {
    return null;
  }

  return {
    red: parseInt(normalized.slice(1, 3), 16),
    green: parseInt(normalized.slice(3, 5), 16),
    blue: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHsl(red: number, green: number, blue: number, fallbackHue = 220): HslColor {
  const r = clamp(red, 0, 255) / 255;
  const g = clamp(green, 0, 255) / 255;
  const b = clamp(blue, 0, 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = fallbackHue;
  let saturation = 0;

  if (delta > 0) {
    saturation = lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);

    if (max === r) {
      hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      hue = ((b - r) / delta + 2) * 60;
    } else {
      hue = ((r - g) / delta + 4) * 60;
    }
  }

  return {
    hue: ((hue % 360) + 360) % 360,
    saturation: saturation * 100,
    lightness: lightness * 100,
  };
}

function hexToHsl(hex: string, fallbackHue = 220): HslColor {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb.red, rgb.green, rgb.blue, fallbackHue) : {
    hue: fallbackHue,
    saturation: 70,
    lightness: 54,
  };
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let normalizedT = t;
  if (normalizedT < 0) {
    normalizedT += 1;
  }
  if (normalizedT > 1) {
    normalizedT -= 1;
  }
  if (normalizedT < 1 / 6) {
    return p + (q - p) * 6 * normalizedT;
  }
  if (normalizedT < 1 / 2) {
    return q;
  }
  if (normalizedT < 2 / 3) {
    return p + (q - p) * (2 / 3 - normalizedT) * 6;
  }

  return p;
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const normalizedHue = (((hue % 360) + 360) % 360) / 360;
  const normalizedSaturation = clamp(saturation, 0, 100) / 100;
  const normalizedLightness = clamp(lightness, 0, 100) / 100;
  let red = normalizedLightness;
  let green = normalizedLightness;
  let blue = normalizedLightness;

  if (normalizedSaturation > 0) {
    const q = normalizedLightness < 0.5
      ? normalizedLightness * (1 + normalizedSaturation)
      : normalizedLightness + normalizedSaturation - normalizedLightness * normalizedSaturation;
    const p = 2 * normalizedLightness - q;

    red = hueToRgbChannel(p, q, normalizedHue + 1 / 3);
    green = hueToRgbChannel(p, q, normalizedHue);
    blue = hueToRgbChannel(p, q, normalizedHue - 1 / 3);
  }

  return [red, green, blue]
    .map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .replace(/^/, "#");
}

function createStatusGroup(
  role: typeof STATUS_ROLES[number],
  roleAnchorHex: string,
  roleAnchorType: "seed" | "default",
): GeneratedPaletteGroup {
  const anchorHsl = hexToHsl(roleAnchorHex);
  const anchorSaturation = clamp(anchorHsl.saturation || 70, 34, 92);
  const hue = anchorHsl.hue + role.hueShift;
  const colors = STATUS_TONES.map((tone, toneIndex) => {
    const hex = toneIndex === ROLE_ANCHOR_INDEX
      ? roleAnchorHex
      : hslToHex(
        hue,
        clamp(anchorSaturation * STATUS_SATURATION_MULTIPLIERS[toneIndex], 6, 96),
        STATUS_LIGHTNESS[toneIndex],
      );

    return {
      label: `${role.label} ${tone}`,
      hex,
      css: hex,
      tone,
      toneIndex,
      role: role.key,
      group: role.label,
      lightness: hexToHsl(hex, hue).lightness,
      isRoleAnchor: toneIndex === ROLE_ANCHOR_INDEX,
      roleAnchorHex,
      roleAnchorType,
      statusHueRange: "cloud",
    };
  });

  return {
    key: role.key,
    label: role.label,
    roleAnchorHex,
    colors,
  };
}

export function generateStatusPalette(input: GeneratePaletteRequest): StatusPaletteResult {
  const seedHex = getSeedHex(input);
  const groups = STATUS_ROLES.map((role, index) => createStatusGroup(
    role,
    index === 0 ? seedHex : role.fallbackHex,
    index === 0 ? "seed" : "default",
  ));
  const colorData = groups.flatMap((group) => group.colors);

  return {
    colors: colorData.map((color) => color.hex),
    colorData,
    groups,
  };
}
