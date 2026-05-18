import {
  createColorData,
  type GeneratePaletteRequest,
  normalizeHex,
} from "@/lib/contracts/palette";

const SCALE_SPECTRUM_SIZE = 160;

const DEFAULT_SETTINGS = {
  hue: 220,
  lightness: {
    min: 0,
    max: 100,
  },
  wide: 3,
  offset: 5,
  steps: 11,
  easing: {
    type: "Linear",
  },
  density: 3,
};

const DENSITY_LEVELS = [
  { power: 0.35 },
  { power: 0.6 },
  { power: 1 },
  { power: 2 },
  { power: 3 },
];

type NeutralSettings = typeof DEFAULT_SETTINGS & {
  hex?: {
    value?: string;
    locked?: boolean;
  };
};

type CurvePoint = {
  x: number;
  y: number;
  hex?: string;
  lightness?: number;
};

export type NeutralPaletteResult = {
  colors: string[];
  colorData: ReturnType<typeof createColorData>;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function readNumber(value: unknown, fallback: number): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeEasingType(value: unknown): string {
  const easingType = String(value || "");
  if (easingType === "Light Side") {
    return "Light Theme";
  }
  if (easingType === "Dark Side") {
    return "Dark Theme";
  }
  return ["Linear", "Light Theme", "Dark Theme", "Balance"].includes(easingType)
    ? easingType
    : DEFAULT_SETTINGS.easing.type;
}

function normalizeNeutralSettings(input: GeneratePaletteRequest): NeutralSettings {
  const settings = readRecord(input.settings);
  const lightness = readRecord(settings.lightness);
  const easing = readRecord(settings.easing);
  const hex = readRecord(settings.hex);
  const lightnessMin = clamp(readNumber(lightness.min, DEFAULT_SETTINGS.lightness.min), 0, 100);
  const lightnessMax = clamp(readNumber(lightness.max, DEFAULT_SETTINGS.lightness.max), 0, 100);

  return {
    hue: clamp(readNumber(settings.hue, DEFAULT_SETTINGS.hue), 0, 360),
    lightness: {
      min: Math.min(lightnessMin, lightnessMax),
      max: Math.max(lightnessMin, lightnessMax),
    },
    wide: clamp(readNumber(settings.wide, DEFAULT_SETTINGS.wide), 0, 100),
    offset: clamp(readNumber(settings.offset, DEFAULT_SETTINGS.offset), 0, 100),
    steps: clamp(Math.round(readNumber(input.steps ?? settings.steps, DEFAULT_SETTINGS.steps)), 2, 20),
    easing: {
      type: normalizeEasingType(easing.type),
    },
    density: clamp(Math.round(readNumber(settings.density, DEFAULT_SETTINGS.density)), 1, 5),
    hex: {
      value: normalizeHex(hex.value || input.seedHex || input.seedColor),
      locked: Boolean(hex.locked),
    },
  };
}

function getDensityPower(settings: NeutralSettings): number {
  return DENSITY_LEVELS[settings.density - 1]?.power || DENSITY_LEVELS[2].power;
}

function getDensityExponent(power: number): number {
  return power <= 1 ? 2 : power + 1;
}

function mixProgress(linearProgress: number, easedProgress: number, densityPower: number): number {
  const strength = densityPower <= 1 ? densityPower : 1;
  return linearProgress + (easedProgress - linearProgress) * strength;
}

function easeIn(progress: number, densityPower: number): number {
  const easedProgress = progress ** getDensityExponent(densityPower);
  return mixProgress(progress, easedProgress, densityPower);
}

function easeOut(progress: number, densityPower: number): number {
  const easedProgress = 1 - (1 - progress) ** getDensityExponent(densityPower);
  return mixProgress(progress, easedProgress, densityPower);
}

function easeInOut(progress: number, densityPower: number): number {
  const exponent = getDensityExponent(densityPower);
  const easedProgress = progress < 0.5
    ? (2 * progress) ** exponent / 2
    : 1 - (2 * (1 - progress)) ** exponent / 2;

  return mixProgress(progress, easedProgress, densityPower);
}

function getDistributedProgress(progress: number, settings: NeutralSettings): number {
  const densityPower = getDensityPower(settings);

  if (settings.easing.type === "Light Theme") {
    return easeIn(progress, densityPower);
  }
  if (settings.easing.type === "Dark Theme") {
    return easeOut(progress, densityPower);
  }
  if (settings.easing.type === "Balance") {
    return easeInOut(progress, densityPower);
  }

  return progress;
}

function mapPointToLightnessRange(point: CurvePoint, settings: NeutralSettings): CurvePoint {
  const topY = (settings.lightness.min / 100) * SCALE_SPECTRUM_SIZE;
  const bottomY = (settings.lightness.max / 100) * SCALE_SPECTRUM_SIZE;
  const yRatio = clamp(point.y / SCALE_SPECTRUM_SIZE, 0, 1);

  return {
    ...point,
    y: topY + yRatio * (bottomY - topY),
  };
}

function getBaseCurveXAtRawY(rawY: number, settings: NeutralSettings): number {
  const wide = (settings.wide / 100) * 4;
  const offset = (settings.offset / 100) * 4;
  const yGraph = 2 - (clamp(rawY, 0, SCALE_SPECTRUM_SIZE) / SCALE_SPECTRUM_SIZE) * 4;
  const xGraph = wide * yGraph ** 2 + offset;
  return clamp((xGraph / 4) * SCALE_SPECTRUM_SIZE, 0, SCALE_SPECTRUM_SIZE);
}

function createCurvePoints(settings: NeutralSettings): CurvePoint[] {
  const points: CurvePoint[] = [];

  for (let index = 0; index <= SCALE_SPECTRUM_SIZE; index += 1) {
    const rawY = (index / SCALE_SPECTRUM_SIZE) * SCALE_SPECTRUM_SIZE;
    points.push(mapPointToLightnessRange({
      x: getBaseCurveXAtRawY(rawY, settings),
      y: rawY,
    }, settings));
  }

  return points;
}

function interpolatePoint(first: CurvePoint, second: CurvePoint, ratio: number): CurvePoint {
  return {
    x: first.x + (second.x - first.x) * ratio,
    y: first.y + (second.y - first.y) * ratio,
  };
}

function sampleCurveAtProgress(points: CurvePoint[], progress: number): CurvePoint {
  const segmentLengths: number[] = [];
  let totalLength = 0;

  for (let index = 1; index < points.length; index += 1) {
    const length = Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    segmentLengths.push(length);
    totalLength += length;
  }

  let targetLength = clamp(progress, 0, 1) * totalLength;

  for (let index = 1; index < points.length; index += 1) {
    const segmentLength = segmentLengths[index - 1];
    if (targetLength <= segmentLength || index === points.length - 1) {
      const ratio = segmentLength > 0 ? targetLength / segmentLength : 0;
      return interpolatePoint(points[index - 1], points[index], ratio);
    }
    targetLength -= segmentLength;
  }

  return points[points.length - 1];
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

function rgbToHsl(red: number, green: number, blue: number, fallbackHue: number): {
  hue: number;
  saturation: number;
  lightness: number;
} {
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
    hue: Math.round(((hue % 360) + 360) % 360),
    saturation: saturation * 100,
    lightness: lightness * 100,
  };
}

function getLockedHexAnchorPoint(settings: NeutralSettings): CurvePoint | null {
  if (!settings.hex?.locked || !settings.hex.value) {
    return null;
  }

  const rgb = hexToRgb(settings.hex.value);
  const hsl = rgb ? rgbToHsl(rgb.red, rgb.green, rgb.blue, settings.hue) : null;

  if (!hsl) {
    return null;
  }

  return {
    x: (hsl.saturation / 100) * SCALE_SPECTRUM_SIZE,
    y: ((100 - hsl.lightness) / 100) * SCALE_SPECTRUM_SIZE,
    hex: settings.hex.value,
    lightness: hsl.lightness,
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
    .padStart(6, "0")
    .replace(/^/, "#");
}

function getColorForPoint(point: CurvePoint, settings: NeutralSettings): string {
  if (point.hex) {
    return point.hex;
  }

  const saturation = clamp((point.x / SCALE_SPECTRUM_SIZE) * 100, 0, 100);
  const lightness = clamp(100 - (point.y / SCALE_SPECTRUM_SIZE) * 100, 0, 100);

  return hslToHex(settings.hue, saturation, lightness);
}

export function generateNeutralPalette(input: GeneratePaletteRequest): NeutralPaletteResult {
  const settings = normalizeNeutralSettings(input);
  const pointCount = settings.steps;
  const curvePoints = createCurvePoints(settings);
  const sampledPoints: CurvePoint[] = [];

  for (let index = 0; index < pointCount; index += 1) {
    const progress = pointCount === 1 ? 0 : index / (pointCount - 1);
    sampledPoints.push(sampleCurveAtProgress(curvePoints, getDistributedProgress(progress, settings)));
  }

  const anchorPoint = getLockedHexAnchorPoint(settings);
  if (anchorPoint && sampledPoints.length) {
    const anchorIndex = sampledPoints.reduce((closestIndex, point, index) => {
      const closestDistance = Math.abs(sampledPoints[closestIndex].y - anchorPoint.y);
      const distance = Math.abs(point.y - anchorPoint.y);
      return distance < closestDistance ? index : closestIndex;
    }, 0);
    sampledPoints[anchorIndex] = anchorPoint;
  }

  const colors = sampledPoints
    .sort((first, second) => first.y - second.y)
    .map((point) => getColorForPoint(point, settings));

  if (settings.easing.type === "Dark Theme") {
    colors.reverse();
  }

  return {
    colors,
    colorData: createColorData(colors),
  };
}
