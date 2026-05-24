import { normalizeHex } from "@/lib/contracts/palette";

export type SpectroPrismTheme = "light" | "dark";

export type SpectroPrismRisk = {
  type: string;
  level: "danger";
  reason: string;
};

export type SpectroPrismPrimaryAnalysis = {
  engine: "spectro-prism";
  role: "primary";
  theme: SpectroPrismTheme;
  hex: string;
  risks: SpectroPrismRisk[];
  danger: boolean;
};

export type SpectroPrismPrimaryAdjustment = {
  theme: SpectroPrismTheme;
  role: "primary";
  originalHex: string;
  adjustedHex: string;
  message: string;
  prism: SpectroPrismPrimaryAnalysis;
};

type Rgb = {
  red: number;
  green: number;
  blue: number;
};

type Hsl = {
  hue: number;
  saturation: number;
  lightness: number;
};

type ColorProfile = {
  hex: string;
  rgb: Rgb;
  hsl: Hsl;
  luminance: number;
  channelMax: number;
  channelMin: number;
};

const DARK_MODE_REFINEMENT_ANCHORS = [
  ["#00FF00", "#4ADE80", "neon-green"],
  ["#39FF14", "#22C55E", "neon-green"],
  ["#00FF66", "#34D399", "neon-green"],
  ["#00E600", "#22C55E", "oversaturated-green"],
  ["#00D800", "#22C55E", "oversaturated-green"],
  ["#00CC44", "#22C55E", "oversaturated-green"],
  ["#CCFF00", "#84CC16", "radioactive-lime"],
  ["#FF0000", "#F87171", "pure-red"],
  ["#FF0033", "#EF4444", "oversaturated-red"],
  ["#FF0022", "#EF4444", "oversaturated-red"],
  ["#FF1744", "#FB7185", "oversaturated-red"],
  ["#FF0040", "#F43F5E", "oversaturated-red"],
  ["#FF0055", "#F43F5E", "oversaturated-red"],
  ["#0000FF", "#60A5FA", "electric-blue"],
  ["#0047FF", "#3B82F6", "electric-blue"],
  ["#0055FF", "#3B82F6", "electric-blue"],
  ["#0066FF", "#2563EB", "electric-blue"],
  ["#003BFF", "#2563EB", "electric-blue"],
  ["#0050D0", "#2563EB", "electric-blue"],
  ["#00FFFF", "#22D3EE", "cyan"],
  ["#00E5FF", "#06B6D4", "cyan"],
  ["#00CCFF", "#38BDF8", "cyan"],
  ["#FF00FF", "#E879F9", "magenta-pink"],
  ["#FF0099", "#EC4899", "magenta-pink"],
  ["#FF00AA", "#EC4899", "magenta-pink"],
  ["#D500F9", "#C084FC", "magenta-pink"],
  ["#E100FF", "#D946EF", "magenta-pink"],
  ["#C000FF", "#A855F7", "magenta-pink"],
  ["#FFFF00", "#FACC15", "yellow-amber"],
  ["#FFC400", "#F59E0B", "yellow-amber"],
  ["#FFD500", "#EAB308", "yellow-amber"],
  ["#FF6A00", "#F97316", "orange"],
  ["#FF7A00", "#FB923C", "orange"],
  ["#FFB000", "#F59E0B", "orange"],
  ["#6B4F3A", "#8B5E3C", "muddy"],
  ["#6A6F2D", "#8A9441", "muddy"],
  ["#665B70", "#8B78A0", "muddy"],
  ["#5C5248", "#7C6858", "muddy"],
  ["#556B2F", "#6F8A3B", "muddy"],
  ["#0A1A44", "#254A9B", "too-dark-accent"],
  ["#123020", "#2F8A5A", "too-dark-accent"],
  ["#3A1010", "#9F2D2D", "too-dark-accent"],
  ["#1B1B2F", "#4D4D83", "too-dark-accent"],
  ["#1E2A1E", "#4D8A4D", "too-dark-accent"],
  ["#222831", "#5F6B7A", "low-contrast-dark"],
  ["#2B2D42", "#5C618D", "low-contrast-dark"],
  ["#1F2937", "#5B6B80", "low-contrast-dark"],
  ["#2C2C2C", "#666666", "low-contrast-dark"],
  ["#252525", "#626262", "low-contrast-dark"],
] as const;

const DARK_MODE_FRIENDLY_REFERENCE_HEXES = Array.from(
  new Set(DARK_MODE_REFINEMENT_ANCHORS.map((anchor) => anchor[1])),
);

const SAFE_ZONE_FALLBACK_HEXES = [
  "#2563EB",
  "#7C3AED",
  "#0891B2",
  "#0F766E",
  "#9333EA",
  "#4F46E5",
  "#BE123C",
  "#C2410C",
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }

  const progress = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function normalizePrismTheme(theme: unknown): SpectroPrismTheme {
  return String(theme || "").toLowerCase() === "dark" ? "dark" : "light";
}

function hexToRgb(hex: string): Rgb | null {
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

function rgbToHsl(red: number, green: number, blue: number): Hsl {
  const r = clamp(red, 0, 255) / 255;
  const g = clamp(green, 0, 255) / 255;
  const b = clamp(blue, 0, 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
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
    hue: Math.round((((hue % 360) + 360) % 360)),
    saturation: saturation * 100,
    lightness: lightness * 100,
  };
}

function hexToHsl(hex: string): Hsl | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb.red, rgb.green, rgb.blue) : null;
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let normalizedT = t;
  if (normalizedT < 0) normalizedT += 1;
  if (normalizedT > 1) normalizedT -= 1;
  if (normalizedT < 1 / 6) return p + (q - p) * 6 * normalizedT;
  if (normalizedT < 1 / 2) return q;
  if (normalizedT < 2 / 3) return p + (q - p) * (2 / 3 - normalizedT) * 6;
  return p;
}

function hslToRgb(hue: number, saturation: number, lightness: number): number[] {
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

  return [red, green, blue].map((channel) => Math.round(channel * 255));
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  return hslToRgb(hue, saturation, lightness)
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .replace(/^/, "#");
}

function srgbToLinear(channel: number): number {
  const value = clamp(channel, 0, 255) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminanceFromRgb(rgb: Rgb): number {
  return 0.2126 * srgbToLinear(rgb.red)
    + 0.7152 * srgbToLinear(rgb.green)
    + 0.0722 * srgbToLinear(rgb.blue);
}

function getHueDistance(firstHue: number, secondHue: number): number {
  const distance = Math.abs((((firstHue - secondHue) % 360) + 540) % 360 - 180);
  return Math.min(distance, 180);
}

function getColorProfile(hex: string): ColorProfile | null {
  const normalizedHex = normalizeHex(hex);
  const rgb = normalizedHex ? hexToRgb(normalizedHex) : null;
  const hsl = normalizedHex ? hexToHsl(normalizedHex) : null;

  if (!normalizedHex || !rgb || !hsl) {
    return null;
  }

  return {
    hex: normalizedHex,
    rgb,
    hsl,
    luminance: getRelativeLuminanceFromRgb(rgb),
    channelMax: Math.max(rgb.red, rgb.green, rgb.blue),
    channelMin: Math.min(rgb.red, rgb.green, rgb.blue),
  };
}

function getReferenceDistance(profile: ColorProfile | null, referenceHex: string): number {
  const reference = getColorProfile(referenceHex);
  if (!profile || !reference) {
    return Infinity;
  }

  const hueDistance = getHueDistance(profile.hsl.hue, reference.hsl.hue) / 180;
  const saturationDistance = Math.abs(profile.hsl.saturation - reference.hsl.saturation) / 100;
  const lightnessDistance = Math.abs(profile.hsl.lightness - reference.hsl.lightness) / 100;
  return hueDistance * 1.8 + saturationDistance * 0.9 + lightnessDistance * 0.7;
}

function getNearestDarkModeRefinementAnchor(hex: string) {
  const profile = getColorProfile(hex);
  if (!profile) {
    return null;
  }

  return DARK_MODE_REFINEMENT_ANCHORS
    .map((anchor) => ({
      badHex: anchor[0],
      betterHex: anchor[1],
      category: anchor[2],
      distance: getReferenceDistance(profile, anchor[0]),
    }))
    .sort((first, second) => first.distance - second.distance)[0] || null;
}

function getNearestDarkModeFriendlyReference(profile: ColorProfile | null) {
  if (!profile) {
    return null;
  }

  return DARK_MODE_FRIENDLY_REFERENCE_HEXES
    .map((hex) => ({
      hex,
      distance: getReferenceDistance(profile, hex),
    }))
    .sort((first, second) => first.distance - second.distance)[0] || null;
}

function getDarkModeFriendlySaturationMax(profile: ColorProfile): number {
  const hue = profile.hsl.hue;
  const lightness = profile.hsl.lightness;
  const isWarm = hue >= 18 && hue <= 64;
  const isBlue = hue >= 205 && hue <= 250;
  const isGreen = hue >= 90 && hue <= 165;
  const isRed = hue <= 12 || hue >= 344;
  const isPinkPurple = hue >= 285 && hue <= 335;
  const midTonePressure = 1 - Math.abs(clamp(lightness, 0, 100) - 52) / 52;
  const lightTonePressure = smoothstep(72, 96, lightness);
  const darkTonePressure = smoothstep(0, 24, 24 - lightness);
  let max = 62 - midTonePressure * 7 - lightTonePressure * 9 - darkTonePressure * 8;

  if (isWarm) max -= 6;
  if (isBlue) max -= 4;
  if (isGreen || isRed || isPinkPurple) max -= 3;

  return clamp(max, 38, 62);
}

function getDarkModeFriendlinessIssue(hex: string) {
  const profile = getColorProfile(hex);

  if (!profile) {
    return null;
  }

  const hsl = profile.hsl;
  const hue = hsl.hue;
  const anchor = getNearestDarkModeRefinementAnchor(profile.hex);
  const friendlyReference = getNearestDarkModeFriendlyReference(profile);
  const saturationMax = getDarkModeFriendlySaturationMax(profile);
  const channelRange = profile.channelMax - profile.channelMin;
  const hasPureChannel = profile.channelMax >= 248 && profile.channelMin <= 7;
  const nearKnownFriendlyColor = friendlyReference && friendlyReference.distance <= 0.1;
  const isNeon = hsl.saturation >= 92 && hsl.lightness >= 42 && hsl.lightness <= 68 && profile.channelMax >= 245;
  const isPureRgb = hasPureChannel && hsl.saturation >= 92;
  const isOverBrightWarm = hue >= 20 && hue <= 62 && hsl.saturation >= 86 && hsl.lightness >= 48;
  const isOversaturatedBlue = hue >= 218 && hue <= 250 && hsl.saturation >= 86;
  const isOversaturatedGreen = hue >= 105 && hue <= 155 && hsl.saturation >= 84;
  const isOversaturatedRed = (hue <= 12 || hue >= 344) && hsl.saturation >= 84;
  const isOversaturatedPinkPurple = hue >= 285 && hue <= 335 && hsl.saturation >= 84;
  const isTooSaturated = hsl.saturation >= 96 && hsl.saturation > saturationMax + 24 && profile.channelMax >= 245;
  const isMuddy = hsl.lightness >= 25
    && hsl.lightness <= 48
    && hsl.saturation >= 12
    && hsl.saturation <= 38
    && channelRange >= 28
    && channelRange <= 82;
  const isTooDarkAccent = hsl.lightness < 24 && hsl.saturation >= 24 && profile.luminance < 0.055;
  const isLowContrastDark = hsl.lightness < 22 && hsl.saturation < 22 && profile.luminance < 0.035;
  const nearKnownBadColor = anchor && anchor.distance <= 0.24;
  let category = "";

  if (nearKnownFriendlyColor) category = "";
  else if (nearKnownBadColor) category = anchor.category;
  else if (isNeon) category = "neon-radioactive";
  else if (isPureRgb) category = "pure-rgb";
  else if (isOverBrightWarm) category = "over-bright-warm";
  else if (isOversaturatedBlue) category = "oversaturated-blue";
  else if (isOversaturatedGreen) category = "oversaturated-green";
  else if (isOversaturatedRed) category = "oversaturated-red";
  else if (isOversaturatedPinkPurple) category = "oversaturated-pink-purple";
  else if (isTooDarkAccent) category = "too-dark-accent";
  else if (isLowContrastDark) category = "low-contrast-dark";
  else if (isMuddy) category = "muddy";
  else if (isTooSaturated) category = "too-saturated";

  return category
    ? {
      hex: profile.hex,
      category,
      saturation: hsl.saturation,
      lightness: hsl.lightness,
      luminance: profile.luminance,
      saturationMax,
      anchor,
    }
    : null;
}

function getContrastRatio(hex: string, referenceHex: string): number {
  const colorRgb = hexToRgb(hex);
  const referenceRgb = hexToRgb(referenceHex);

  if (!colorRgb || !referenceRgb) {
    return 1;
  }

  const firstLuminance = getRelativeLuminanceFromRgb(colorRgb);
  const secondLuminance = getRelativeLuminanceFromRgb(referenceRgb);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function getLightModeFriendlinessIssue(hex: string) {
  const normalizedHex = normalizeHex(hex);
  const profile = normalizedHex ? getColorProfile(normalizedHex) : null;

  if (!normalizedHex || !profile) {
    return null;
  }

  const whiteTextContrast = getContrastRatio(normalizedHex, "#FFFFFF");
  const hsl = profile.hsl;
  const hue = hsl.hue;
  const isYellowLime = hue >= 40 && hue <= 90;
  const isCyanMintTeal = hue >= 155 && hue <= 195;
  const isBlueIndigo = hue >= 200 && hue <= 250;
  const isPinkPurple = hue >= 260 && hue <= 345;
  const isRedOrange = hue <= 30 || hue >= 345;
  const isPastel = hsl.lightness >= 76 && hsl.saturation >= 32;
  const isWashedOutWhiteBlue = hsl.lightness >= 92 && hue >= 190 && hue <= 230;
  const isVeryBrightLightAccent = isYellowLime
    && hsl.saturation >= 96
    && hsl.lightness >= 42
    && hsl.lightness <= 62;
  const isTooLightForWhiteText = whiteTextContrast < 4.5
    && hsl.lightness >= 72
    && (hsl.saturation < 72 || isYellowLime || isCyanMintTeal);
  const isWeakSemanticAccent = isPastel && (
    isYellowLime
    || isCyanMintTeal
    || isBlueIndigo
    || isPinkPurple
    || isRedOrange
  );

  return isVeryBrightLightAccent || isTooLightForWhiteText || isWeakSemanticAccent || isWashedOutWhiteBlue
    ? {
      hex: normalizedHex,
      category: isVeryBrightLightAccent
        ? "very-bright-light-accent"
        : isWashedOutWhiteBlue
          ? "washed-out-white-blue"
          : isWeakSemanticAccent
            ? "weak-pastel-accent"
            : "low-contrast-on-light",
      contrast: whiteTextContrast,
    }
    : null;
}

function getApcaContrast(foregroundHex: string, backgroundHex: string): number {
  const foreground = getColorProfile(foregroundHex);
  const background = getColorProfile(backgroundHex);

  if (!foreground || !background) {
    return 0;
  }

  const foregroundLuminance = clamp(foreground.luminance, 0, 1);
  const backgroundLuminance = clamp(background.luminance, 0, 1);
  const isReversePolarity = foregroundLuminance > backgroundLuminance;
  const contrast = isReversePolarity
    ? (backgroundLuminance ** 0.65 - foregroundLuminance ** 0.62) * 1.14
    : (backgroundLuminance ** 0.56 - foregroundLuminance ** 0.57) * 1.14;

  return Math.abs(contrast * 100);
}

function createRisk(type: string, reason: string): SpectroPrismRisk {
  return {
    type,
    level: "danger",
    reason,
  };
}

function hasDanger(risks: SpectroPrismRisk[]): boolean {
  return risks.some((risk) => risk.level === "danger");
}

function getFallbackAdjustment(hex: string, theme: SpectroPrismTheme): string {
  const hsl = hexToHsl(hex);

  if (!hsl) {
    return hex;
  }

  if (theme === "dark") {
    return hslToHex(
      hsl.hue,
      clamp(hsl.saturation * 0.86, 45, 78),
      clamp(hsl.lightness, 36, 68),
    );
  }

  return hslToHex(
    hsl.hue,
    clamp(hsl.saturation, 68, 94),
    clamp(hsl.lightness, 38, 58),
  );
}

function getClosestSafePrimaryHex(hex: string, theme: SpectroPrismTheme): string {
  const normalizedHex = normalizeHex(hex);
  const sourceHsl = normalizedHex ? hexToHsl(normalizedHex) : null;

  if (!normalizedHex || !sourceHsl) {
    return normalizedHex;
  }

  const hueDeltas = [0, -3, 3, -6, 6, -9, 9];
  const saturationDeltas = [0, 10, 18, 25, 32, 42, 55];
  const lightnessDeltas = theme === "dark"
    ? [-4, -8, 0, 4, 8, -14, -22, 12]
    : [-6, -10, -14, -22, -30, -2, 0, 4];
  const seenCandidates = new Set<string>();

  for (const hueDelta of hueDeltas) {
    for (const saturationDelta of saturationDeltas) {
      for (const lightnessDelta of lightnessDeltas) {
        const candidateHex = hslToHex(
          sourceHsl.hue + hueDelta,
          sourceHsl.saturation - saturationDelta,
          sourceHsl.lightness + lightnessDelta,
        );
        if (seenCandidates.has(candidateHex)) {
          continue;
        }

        seenCandidates.add(candidateHex);
        const candidateAnalysis = analyzeSpectroPrismPrimaryColor(candidateHex, theme);

        if (!candidateAnalysis || candidateAnalysis.danger) {
          continue;
        }

        return candidateHex;
      }
    }
  }

  return normalizedHex;
}

export function getSpectroPrismAdjustedPrimaryHex(hex: unknown, theme: unknown): string {
  const normalizedHex = normalizeHex(hex);
  const normalizedTheme = normalizePrismTheme(theme);
  if (!normalizedHex) {
    return normalizedHex;
  }

  const adjustedHex = getClosestSafePrimaryHex(normalizedHex, normalizedTheme);
  const normalizedAdjustedHex = normalizeHex(adjustedHex);

  if (normalizedAdjustedHex && normalizedAdjustedHex !== normalizedHex) {
    return normalizedAdjustedHex;
  }

  return getFallbackAdjustment(normalizedHex, normalizedTheme);
}

function getPrimaryMessage(analysis: SpectroPrismPrimaryAnalysis): string {
  const risks = Array.isArray(analysis.risks) ? analysis.risks : [];
  const hasGlowRisk = risks.some((risk) => risk.type === "glow-vibration-risk");
  const hasSurfaceRisk = risks.some((risk) => risk.type === "low-visibility-surface");
  const hasTextRisk = risks.some((risk) => risk.type === "unsafe-text-background");

  if (analysis.theme === "dark") {
    if (hasGlowRisk) {
      return "Primary may glow in dark mode. Keep or adjust?";
    }

    if (hasSurfaceRisk) {
      return "Primary may fade on dark surfaces. Keep or adjust?";
    }

    return "Primary is risky in dark mode. Keep or adjust?";
  }

  if (hasTextRisk) {
    return "Primary may be hard to read in light mode. Keep or adjust?";
  }

  if (hasSurfaceRisk) {
    return "Primary may look washed out in light mode. Keep or adjust?";
  }

  return "Primary is risky in light mode. Keep or adjust?";
}

export function analyzeSpectroPrismPrimaryColor(hex: unknown, theme: unknown): SpectroPrismPrimaryAnalysis | null {
  const normalizedHex = normalizeHex(hex);
  const normalizedTheme = normalizePrismTheme(theme);
  const profile = normalizedHex ? getColorProfile(normalizedHex) : null;

  if (!normalizedHex || !profile) {
    return null;
  }

  const hsl = profile.hsl;
  const risks: SpectroPrismRisk[] = [];

  if (normalizedTheme === "dark") {
    const darkIssue = getDarkModeFriendlinessIssue(normalizedHex);
    const darkSurfaceContrast = getApcaContrast(normalizedHex, "#1A1A1A");
    const whiteTextContrast = getContrastRatio(normalizedHex, "#FFFFFF");
    const isHighEnergyAccent = hsl.saturation >= 88
      && hsl.lightness >= 40
      && hsl.lightness <= 72
      && profile.channelMax >= 238;

    if (darkIssue) {
      risks.push(createRisk(darkIssue.category, "Primary has unstable color behavior on dark UI."));
    }

    if (isHighEnergyAccent && darkSurfaceContrast >= 54) {
      risks.push(createRisk("glow-vibration-risk", "Primary may feel too bright or visually vibrating on dark surfaces."));
    }

    if (darkSurfaceContrast < 18 && hsl.lightness < 30) {
      risks.push(createRisk("low-visibility-surface", "Primary may collapse into dark surfaces."));
    }

    if (whiteTextContrast < 3.2 && hsl.lightness >= 58) {
      risks.push(createRisk("unsafe-text-background", "White text on this primary fill may be difficult to read."));
    }
  } else {
    const lightIssue = getLightModeFriendlinessIssue(normalizedHex);
    const lightSurfaceContrast = getApcaContrast(normalizedHex, "#FFFFFF");
    const whiteTextContrast = getContrastRatio(normalizedHex, "#FFFFFF");
    const isWashedOut = hsl.lightness >= 82 && hsl.saturation <= 48;

    if (lightIssue) {
      risks.push(createRisk(lightIssue.category, "Primary has weak color behavior on light UI."));
    }

    if (lightSurfaceContrast < 34 && hsl.lightness >= 72) {
      risks.push(createRisk("low-visibility-surface", "Primary may be too faint on light surfaces."));
    }

    if (isWashedOut) {
      risks.push(createRisk("washed-out-ui-color", "Primary may look washed out in light interfaces."));
    }

    if (whiteTextContrast < 4.5 && hsl.lightness >= 68) {
      risks.push(createRisk("unsafe-text-background", "White text on this primary fill may be difficult to read."));
    }
  }

  return {
    engine: "spectro-prism",
    role: "primary",
    theme: normalizedTheme,
    hex: normalizedHex,
    risks,
    danger: hasDanger(risks),
  };
}

export function getSpectroPrismPrimaryThemeAdjustment(
  hex: unknown,
  theme: unknown,
): SpectroPrismPrimaryAdjustment | null {
  const analysis = analyzeSpectroPrismPrimaryColor(hex, theme);

  if (!analysis || !analysis.danger) {
    return null;
  }

  return {
    theme: analysis.theme,
    role: "primary",
    originalHex: analysis.hex,
    adjustedHex: getSpectroPrismAdjustedPrimaryHex(analysis.hex, analysis.theme),
    message: getPrimaryMessage(analysis),
    prism: analysis,
  };
}

function isSafeZonePrimaryHex(hex: string): boolean {
  const normalizedHex = normalizeHex(hex);
  if (!normalizedHex) {
    return false;
  }

  return (["light", "dark"] as const).every((theme) => {
    const analysis = analyzeSpectroPrismPrimaryColor(normalizedHex, theme);
    return analysis && !analysis.danger;
  });
}

function getRandomNumberBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function getRandomSpectroPrismSafePrimaryHex(excludedHex: unknown): string {
  const normalizedExcludedHex = normalizeHex(excludedHex);

  for (let attemptIndex = 0; attemptIndex < 80; attemptIndex += 1) {
    const candidateHex = hslToHex(
      getRandomNumberBetween(0, 360),
      getRandomNumberBetween(48, 76),
      getRandomNumberBetween(40, 56),
    );

    if (candidateHex !== normalizedExcludedHex && isSafeZonePrimaryHex(candidateHex)) {
      return candidateHex;
    }
  }

  return SAFE_ZONE_FALLBACK_HEXES.find((hex) => hex !== normalizedExcludedHex && isSafeZonePrimaryHex(hex))
    || SAFE_ZONE_FALLBACK_HEXES.find((hex) => hex !== normalizedExcludedHex)
    || "#2563EB";
}
