// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Server-side port of the tintshadenew Status ramp engine from the Figma plugin.
// Keep this module server-only; it contains the protected tint/shade palette logic.

const SETTING_CONFIGS = {
  hue: { default: 220 },
  lightness: { min: 0, max: 100, defaultMin: 0, defaultMax: 100 },
};

let hexAnchor = null;
let hexInput = null;
let isHexLocked = true;
let tintShadeNewStatusRefreshSeed = 0;
let tintShadeNewColorSystemCacheKey = '';
let tintShadeNewColorSystemCache = null;

function getTintShadeAnchorHex() {
  if (hexAnchor && hexAnchor.hex) {
    return hexAnchor.hex;
  }

  const inputHex = normalizeHexInputValue(hexInput && hexInput.value);
  return inputHex || DEFAULT_TINT_SHADE_REFERENCE_HEX;
}

function getTintShadeLightnessRange() {
  return {
    max: TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MAX,
    min: TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MIN,
  };
}

function normalizeTintShadeNewStatusRefreshSeed(seed) {
  const numericSeed = Number(seed);
  const safeSeed = Number.isFinite(numericSeed) ? Math.round(numericSeed) : 0;
  return clamp(safeSeed, 0, TINT_SHADE_NEW_STATUS_REFRESH_SEED_MAX);
}

function getTintShadeNewStatusRefreshSeed() {
  return normalizeTintShadeNewStatusRefreshSeed(tintShadeNewStatusRefreshSeed);
}

function getTintShadeNewSeedUnit(seed, roleKey, salt = 0) {
  const normalizedSeed = normalizeTintShadeNewStatusRefreshSeed(seed);
  let hash = 2166136261;
  const input = String(normalizedSeed) + '|' + String(roleKey || '') + '|' + String(salt);

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return clamp((hash >>> 0) / 4294967295, 0, 1);
}

function getTintShadeNewSeedSignedJitter(seed, roleKey, maxOffset, salt = 0) {
  if (normalizeTintShadeNewStatusRefreshSeed(seed) === 0) {
    return 0;
  }

  const unit = getTintShadeNewSeedUnit(seed, roleKey, salt);
  return (unit * 2 - 1) * Math.max(0, Number(maxOffset) || 0);
}

function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }

  const progress = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function getRelativeLuminanceFromRgb(rgb) {
  return 0.2126 * srgbToLinear(rgb.red)
    + 0.7152 * srgbToLinear(rgb.green)
    + 0.0722 * srgbToLinear(rgb.blue);
}
const SCALE_SPECTRUM_SIZE = 160;
const DEFAULT_TINT_SHADE_REFERENCE_HEX = "#8B5CF6";
const HEX_NEUTRAL_BASE_SATURATION_MAX = 24;
const HEX_NEUTRAL_EXTREME_LIGHTNESS_SATURATION_BONUS = 36;
const HEX_NEUTRAL_BASE_OKLAB_CHROMA_MAX = 0.045;
const HEX_NEUTRAL_EXTREME_LIGHTNESS_OKLAB_CHROMA_BONUS = 0.058;
const TINT_SHADE_NEW_COLOR_SYSTEM_VERSION = 11;
const TINT_SHADE_NEW_OKLCH_TEMPLATE_RAMP_LOGIC = "oklch-family-template";
const TINT_SHADE_NEW_STATUS_REFRESH_SEED_MAX = 9999;
const TINT_SHADE_NEW_SWATCH_LABEL_OPACITY = 0.9;
const TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MAX = 0.97;
const TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MIN = 0.23;
const TINT_SHADE_NEW_TINT_VISIBLE_LIGHTNESS_STEP = 0.04;
const TINT_SHADE_NEW_STATUS_CORE_TONE_INDEX = {
  positive: 5,
  negative: 5,
  warning: 5,
  info: 5,
};
const TINT_SHADE_NEW_STATUS_ROLE_VARIATION_PROFILE = {
  positive: {
    baseHue: 150,
    warmHue: 143,
    coolHue: 154,
    minHue: 136,
    maxHue: 160,
    adaptability: 0.62,
    collisionMin: 8,
    collisionMax: 42,
    collisionWeight: 0.18,
    collisionPush: 7,
    seedHueJitter: 7,
    familyTopN: 2,
    anchorVisibleLightness: 0.56,
    anchorRelativeChroma: 74,
    primaryLightnessInfluence: 0.48,
    primaryLightnessLightenInfluence: 0.16,
    lightnessJitter: 0.012,
    chromaJitter: 0.08,
  },
  negative: {
    baseHue: 26,
    warmHue: 20,
    coolHue: 31,
    minHue: 10,
    maxHue: 36,
    adaptability: 0.58,
    collisionMin: 8,
    collisionMax: 34,
    collisionWeight: 0.16,
    collisionPush: 6,
    seedHueJitter: 7,
    familyTopN: 2,
    anchorVisibleLightness: 0.57,
    anchorRelativeChroma: 86,
    primaryLightnessInfluence: 0.22,
    primaryLightnessLightenInfluence: 0.08,
    lightnessJitter: 0.012,
    chromaJitter: 0.08,
  },
  warning: {
    baseHue: 82,
    warmHue: 74,
    coolHue: 90,
    minHue: 66,
    maxHue: 96,
    adaptability: 0.72,
    collisionMin: 8,
    collisionMax: 34,
    collisionWeight: 0.1,
    collisionPush: 6,
    seedHueJitter: 8,
    familyTopN: 2,
    anchorVisibleLightness: 0.61,
    anchorRelativeChroma: 90,
    primaryLightnessInfluence: 0.38,
    primaryLightnessLightenInfluence: 0.1,
    lightnessJitter: 0.016,
    chromaJitter: 0.06,
  },
  info: {
    baseHue: 242,
    warmHue: 226,
    coolHue: 254,
    minHue: 214,
    maxHue: 264,
    adaptability: 0.76,
    collisionMin: 10,
    collisionMax: 48,
    collisionWeight: 0.22,
    collisionPush: 9,
    seedHueJitter: 10,
    familyTopN: 2,
    anchorVisibleLightness: 0.57,
    anchorRelativeChroma: 82,
    primaryLightnessInfluence: 0.52,
    primaryLightnessLightenInfluence: 0.1,
    lightnessJitter: 0.01,
    chromaJitter: 0.07,
  },
};
const TINT_SHADE_NEW_STATUS_ROLE_FAMILY_ORDER = {
  positive: ["green", "emerald", "lime"],
  negative: ["red", "rose", "pink"],
  warning: ["yellow", "amber", "orange"],
  info: ["blue", "sky", "cyan"],
};
const TINT_SHADE_NEW_FAMILY_HSL_LIGHTNESS_RANGES = {
  red: { max: 0.97, min: 0.15 },
  orange: { max: 0.96, min: 0.15 },
  amber: { max: 0.96, min: 0.14 },
  yellow: { max: 0.95, min: 0.14 },
  lime: { max: 0.95, min: 0.10 },
  green: { max: 0.97, min: 0.10 },
  emerald: { max: 0.96, min: 0.09 },
  teal: { max: 0.97, min: 0.10 },
  cyan: { max: 0.96, min: 0.15 },
  sky: { max: 0.97, min: 0.15 },
  blue: { max: 0.97, min: 0.21 },
  indigo: { max: 0.97, min: 0.20 },
  violet: { max: 0.98, min: 0.23 },
  purple: { max: 0.98, min: 0.21 },
  fuchsia: { max: 0.98, min: 0.15 },
  pink: { max: 0.97, min: 0.17 },
  rose: { max: 0.97, min: 0.15 },
  slate: { max: 0.98, min: 0.05 },
  gray: { max: 0.98, min: 0.04 },
  zinc: { max: 0.98, min: 0.04 },
  neutral: { max: 0.98, min: 0.04 },
  stone: { max: 0.98, min: 0.04 },
  mauve: { max: 0.98, min: 0.04 },
  olive: { max: 0.98, min: 0.04 },
  mist: { max: 0.98, min: 0.04 },
  taupe: { max: 0.98, min: 0.04 },
};
const TINT_SHADE_NEW_FAMILY_STYLE_HINTS = {
  red: { temperature: 0.78, vividness: 0.82, softness: 0.18, earthiness: 0.16, depth: 0.42 },
  rose: { temperature: 0.32, vividness: 0.68, softness: 0.38, earthiness: 0.12, depth: 0.38 },
  pink: { temperature: 0.08, vividness: 0.72, softness: 0.46, earthiness: 0.06, depth: 0.34 },
  fuchsia: { temperature: -0.16, vividness: 0.9, softness: 0.24, earthiness: 0.02, depth: 0.34 },
  purple: { temperature: -0.42, vividness: 0.82, softness: 0.24, earthiness: 0.04, depth: 0.42 },
  violet: { temperature: -0.56, vividness: 0.78, softness: 0.28, earthiness: 0.04, depth: 0.46 },
  indigo: { temperature: -0.72, vividness: 0.74, softness: 0.26, earthiness: 0.04, depth: 0.5 },
  blue: { temperature: -0.86, vividness: 0.72, softness: 0.24, earthiness: 0.04, depth: 0.5 },
  sky: { temperature: -0.72, vividness: 0.64, softness: 0.42, earthiness: 0.04, depth: 0.3 },
  cyan: { temperature: -0.58, vividness: 0.7, softness: 0.36, earthiness: 0.05, depth: 0.3 },
  teal: { temperature: -0.34, vividness: 0.58, softness: 0.34, earthiness: 0.18, depth: 0.38 },
  emerald: { temperature: -0.18, vividness: 0.62, softness: 0.32, earthiness: 0.18, depth: 0.4 },
  green: { temperature: 0.02, vividness: 0.64, softness: 0.3, earthiness: 0.22, depth: 0.4 },
  lime: { temperature: 0.28, vividness: 0.72, softness: 0.28, earthiness: 0.18, depth: 0.32 },
  yellow: { temperature: 0.62, vividness: 0.7, softness: 0.36, earthiness: 0.18, depth: 0.24 },
  amber: { temperature: 0.78, vividness: 0.72, softness: 0.28, earthiness: 0.34, depth: 0.36 },
  orange: { temperature: 0.9, vividness: 0.78, softness: 0.22, earthiness: 0.3, depth: 0.42 },
  slate: { temperature: -0.42, vividness: 0.08, softness: 0.7, earthiness: 0.1, depth: 0.56 },
  gray: { temperature: -0.12, vividness: 0.04, softness: 0.76, earthiness: 0.12, depth: 0.54 },
  zinc: { temperature: -0.08, vividness: 0.03, softness: 0.78, earthiness: 0.1, depth: 0.54 },
  neutral: { temperature: 0, vividness: 0.02, softness: 0.8, earthiness: 0.08, depth: 0.54 },
  stone: { temperature: 0.26, vividness: 0.04, softness: 0.76, earthiness: 0.28, depth: 0.54 },
};
const TINT_SHADE_NEW_FAMILY_PROFILES = [
  { key: "rose", label: "Rose", targetHue: 16, statusRole: "negative", oklch: [[0.969, 0.015, 12.422], [0.941, 0.030, 12.580], [0.892, 0.058, 10.001], [0.810, 0.117, 11.638], [0.712, 0.194, 13.428], [0.645, 0.246, 16.439], [0.586, 0.253, 17.585], [0.514, 0.222, 16.935], [0.455, 0.188, 13.697], [0.410, 0.159, 10.272], [0.271, 0.105, 12.094]] },
  { key: "pink", label: "Pink", targetHue: 354, statusRole: "negative", exactHexes: ["#fff0fa", "#ffe3f6", "#ffc6ec", "#ff98da", "#ff58bf", "#ff27a6", "#ff1493", "#df0072", "#b8005c", "#98034d", "#5f002f"], oklch: [[0.970, 0.021, 338], [0.940, 0.039, 338], [0.890, 0.081, 339], [0.810, 0.146, 342], [0.710, 0.225, 346], [0.670, 0.260, 352], [0.650, 0.261, 357], [0.580, 0.236, 1], [0.510, 0.204, 2], [0.440, 0.177, 1], [0.310, 0.128, 360]] },
  { key: "fuchsia", label: "Fuchsia", targetHue: 322, oklch: [[0.977, 0.017, 320.058], [0.952, 0.037, 318.852], [0.903, 0.076, 319.620], [0.833, 0.145, 321.434], [0.740, 0.238, 322.160], [0.667, 0.295, 322.150], [0.591, 0.293, 322.896], [0.518, 0.253, 323.949], [0.452, 0.211, 324.591], [0.401, 0.170, 325.612], [0.293, 0.136, 325.661]] },
  { key: "purple", label: "Purple", targetHue: 304, oklch: [[0.977, 0.014, 308.299], [0.946, 0.033, 307.174], [0.902, 0.063, 306.703], [0.827, 0.119, 306.383], [0.714, 0.203, 305.504], [0.627, 0.265, 303.900], [0.558, 0.288, 302.321], [0.496, 0.265, 301.924], [0.438, 0.218, 303.724], [0.381, 0.176, 304.987], [0.291, 0.149, 302.717]] },
  { key: "violet", label: "Violet", targetHue: 293, oklch: [[0.969, 0.016, 293.756], [0.943, 0.029, 294.588], [0.894, 0.057, 293.283], [0.811, 0.111, 293.571], [0.702, 0.183, 293.541], [0.606, 0.250, 292.717], [0.541, 0.281, 293.009], [0.491, 0.270, 292.581], [0.432, 0.232, 292.759], [0.380, 0.189, 293.745], [0.283, 0.141, 291.089]] },
  { key: "indigo", label: "Indigo", targetHue: 277, oklch: [[0.962, 0.018, 272.314], [0.930, 0.034, 272.788], [0.870, 0.065, 274.039], [0.785, 0.115, 274.713], [0.673, 0.182, 276.935], [0.585, 0.233, 277.117], [0.511, 0.262, 276.966], [0.457, 0.240, 277.023], [0.398, 0.195, 277.366], [0.359, 0.144, 278.697], [0.257, 0.090, 281.288]] },
  { key: "blue", label: "Blue", targetHue: 260, statusRole: "info", oklch: [[0.970, 0.014, 254.604], [0.932, 0.032, 255.585], [0.882, 0.059, 254.128], [0.809, 0.105, 251.813], [0.707, 0.165, 254.624], [0.623, 0.214, 259.815], [0.546, 0.245, 262.881], [0.488, 0.243, 264.376], [0.424, 0.199, 265.638], [0.379, 0.146, 265.522], [0.282, 0.091, 267.935]] },
  { key: "sky", label: "Sky", targetHue: 237, statusRole: "info", exactHexes: ["#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1", "#075985", "#0c4a6e", "#082f49"], oklch: [[0.977, 0.013, 236.620], [0.951, 0.026, 236.824], [0.901, 0.058, 230.902], [0.828, 0.111, 230.318], [0.746, 0.160, 232.661], [0.685, 0.169, 237.323], [0.588, 0.158, 241.966], [0.500, 0.134, 242.749], [0.443, 0.110, 240.790], [0.391, 0.090, 240.876], [0.293, 0.066, 243.157]] },
  { key: "cyan", label: "Cyan", targetHue: 215, statusRole: "info", exactHexes: ["#ecfeff", "#cffafe", "#a5f3fc", "#67e8f9", "#22d3ee", "#06b6d4", "#0891b2", "#0e7490", "#155e75", "#164e63", "#083344"], oklch: [[0.984, 0.019, 200.873], [0.956, 0.045, 203.388], [0.917, 0.080, 205.041], [0.865, 0.127, 207.078], [0.789, 0.154, 211.530], [0.715, 0.143, 215.221], [0.609, 0.126, 221.723], [0.520, 0.105, 223.128], [0.450, 0.085, 224.283], [0.398, 0.070, 227.392], [0.302, 0.056, 229.695]] },
  { key: "teal", label: "Teal", targetHue: 183, oklch: [[0.984, 0.014, 180.720], [0.953, 0.051, 180.801], [0.910, 0.096, 180.426], [0.855, 0.138, 181.071], [0.777, 0.152, 181.912], [0.704, 0.140, 182.503], [0.600, 0.118, 184.704], [0.511, 0.096, 186.391], [0.437, 0.078, 188.216], [0.386, 0.063, 188.416], [0.277, 0.046, 192.524]] },
  { key: "emerald", label: "Emerald", targetHue: 162, statusRole: "positive", oklch: [[0.979, 0.021, 166.113], [0.950, 0.052, 163.051], [0.905, 0.093, 164.150], [0.845, 0.143, 164.978], [0.765, 0.177, 163.223], [0.696, 0.170, 162.480], [0.596, 0.145, 163.225], [0.508, 0.118, 165.612], [0.432, 0.095, 166.913], [0.378, 0.077, 168.940], [0.262, 0.051, 172.552]] },
  { key: "green", label: "Green", targetHue: 150, statusRole: "positive", oklch: [[0.982, 0.018, 155.826], [0.962, 0.044, 156.743], [0.925, 0.084, 155.995], [0.871, 0.150, 154.449], [0.792, 0.209, 151.711], [0.723, 0.219, 149.579], [0.627, 0.194, 149.214], [0.527, 0.154, 150.069], [0.448, 0.119, 151.328], [0.393, 0.095, 152.535], [0.266, 0.065, 152.934]] },
  { key: "lime", label: "Lime", targetHue: 131, statusRole: "positive", oklch: [[0.986, 0.031, 120.757], [0.967, 0.067, 122.328], [0.938, 0.127, 124.321], [0.897, 0.196, 126.665], [0.841, 0.238, 128.850], [0.768, 0.233, 130.850], [0.648, 0.200, 131.684], [0.532, 0.157, 131.589], [0.453, 0.124, 130.933], [0.405, 0.101, 131.063], [0.274, 0.072, 132.109]] },
  { key: "yellow", label: "Yellow", targetHue: 86, statusRole: "warning", oklch: [[0.987, 0.026, 102.212], [0.973, 0.071, 103.193], [0.945, 0.129, 101.540], [0.905, 0.182, 98.111], [0.852, 0.199, 91.936], [0.795, 0.184, 86.047], [0.681, 0.162, 75.834], [0.554, 0.135, 66.442], [0.476, 0.114, 61.907], [0.421, 0.095, 57.708], [0.286, 0.066, 53.813]] },
  { key: "amber", label: "Amber", targetHue: 70, statusRole: "warning", oklch: [[0.987, 0.022, 95.277], [0.962, 0.059, 95.617], [0.924, 0.120, 95.746], [0.879, 0.169, 91.605], [0.828, 0.189, 84.429], [0.769, 0.188, 70.080], [0.666, 0.179, 58.318], [0.555, 0.163, 48.998], [0.473, 0.137, 46.201], [0.414, 0.112, 45.904], [0.279, 0.077, 45.635]] },
  { key: "orange", label: "Orange", targetHue: 48, statusRole: "warning", oklch: [[0.980, 0.016, 73.684], [0.954, 0.038, 75.164], [0.901, 0.076, 70.697], [0.837, 0.128, 66.290], [0.750, 0.183, 55.934], [0.705, 0.213, 47.604], [0.646, 0.222, 41.116], [0.553, 0.195, 38.402], [0.470, 0.157, 37.304], [0.408, 0.123, 38.172], [0.266, 0.079, 36.259]] },
  { key: "red", label: "Red", targetHue: 27, statusRole: "negative", oklch: [[0.971, 0.013, 17.380], [0.936, 0.032, 17.717], [0.885, 0.062, 18.334], [0.808, 0.114, 19.571], [0.704, 0.191, 22.216], [0.637, 0.237, 25.331], [0.577, 0.245, 27.325], [0.505, 0.213, 27.518], [0.444, 0.177, 26.899], [0.396, 0.141, 25.723], [0.258, 0.092, 26.042]] },
  { key: "slate", label: "Slate", targetHue: 257, neutral: true, oklch: [[0.984, 0.003, 247.858], [0.968, 0.007, 247.896], [0.929, 0.013, 255.508], [0.869, 0.022, 252.894], [0.704, 0.040, 256.788], [0.554, 0.046, 257.417], [0.446, 0.043, 257.281], [0.372, 0.044, 257.287], [0.279, 0.041, 260.031], [0.208, 0.042, 265.755], [0.129, 0.042, 264.695]] },
  { key: "gray", label: "Gray", targetHue: 264, neutral: true, oklch: [[0.985, 0.002, 247.839], [0.967, 0.003, 264.542], [0.928, 0.006, 264.531], [0.872, 0.010, 258.338], [0.707, 0.022, 261.325], [0.551, 0.027, 264.364], [0.446, 0.030, 256.802], [0.373, 0.034, 259.733], [0.278, 0.033, 256.848], [0.210, 0.034, 264.665], [0.130, 0.028, 261.692]] },
  { key: "zinc", label: "Zinc", targetHue: 286, neutral: true, oklch: [[0.985, 0.000, 0.000], [0.967, 0.001, 286.375], [0.920, 0.004, 286.320], [0.871, 0.006, 286.286], [0.705, 0.015, 286.067], [0.552, 0.016, 285.938], [0.442, 0.017, 285.786], [0.370, 0.013, 285.805], [0.274, 0.006, 286.033], [0.210, 0.006, 285.885], [0.141, 0.005, 285.823]] },
  { key: "neutral", label: "Neutral", targetHue: 0, neutral: true, oklch: [[0.985, 0.000, 0.000], [0.970, 0.000, 0.000], [0.922, 0.000, 0.000], [0.870, 0.000, 0.000], [0.708, 0.000, 0.000], [0.556, 0.000, 0.000], [0.439, 0.000, 0.000], [0.371, 0.000, 0.000], [0.269, 0.000, 0.000], [0.205, 0.000, 0.000], [0.145, 0.000, 0.000]] },
  { key: "stone", label: "Stone", targetHue: 56, neutral: true, oklch: [[0.985, 0.001, 106.423], [0.970, 0.001, 106.424], [0.923, 0.003, 48.717], [0.869, 0.005, 56.366], [0.709, 0.010, 56.259], [0.553, 0.013, 58.071], [0.444, 0.011, 73.639], [0.374, 0.010, 67.558], [0.268, 0.007, 34.298], [0.216, 0.006, 56.043], [0.147, 0.004, 49.250]] },
];
const tintShadeNewFamilyToneTemplateCache = new Map();
const COLOR_SYSTEM_TONES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const COLOR_SYSTEM_TONE_CURVE = [0, 0.035, 0.085, 0.16, 0.26, 0.39, 0.52, 0.65, 0.78, 0.9, 1];
const COLOR_SYSTEM_REFERENCE_TONE_INDEX = 5;
const TINT_SHADE_NEW_PRIMARY_SOURCE_TRUTH_RAMPS = {
  "#E9FF7A": {
    label: "Honeysuckle",
    anchorToneIndex: 2,
    exactHexes: ["#FBFFE7", "#F4FFC5", "#E9FF7A", "#E2FD50", "#D8F81D", "#C5E307", "#A9BD02", "#8A9306", "#73770C", "#636510", "#393A04"],
  },
  "#7A99D9": {
    label: "Portage",
    anchorToneIndex: 5,
    exactHexes: ["#F1F7FC", "#E5F0FA", "#D0E3F5", "#B4CFED", "#95B4E4", "#7A99D9", "#617BCA", "#5067B2", "#435690", "#3C4B73", "#232B43"],
  },
};
const COLOR_SYSTEM_NEON_YELLOW_GREEN_HUE_MIN = 76;
const COLOR_SYSTEM_NEON_YELLOW_GREEN_HUE_MAX = 176;
const COLOR_SYSTEM_NEON_YELLOW_GREEN_CHROMA_MIN = 70;
const COLOR_SYSTEM_NEON_YELLOW_GREEN_LIGHTNESS_MIN = 0.78;
const COLOR_SYSTEM_NEON_YELLOW_GREEN_FAMILY_KEYS = ["yellow", "lime", "green", "emerald", "teal"];
const COLOR_SYSTEM_YELLOW_GREEN_LIME_HUE_MIN = 108;
const COLOR_SYSTEM_YELLOW_GREEN_LIME_HUE_MAX = 142;
const COLOR_SYSTEM_YELLOW_GREEN_LIME_CHROMA_MIN = 56;
const COLOR_SYSTEM_SHADE_CHROMA_RAMP_LIFT = [0, 0.46, 0.84, 1];
const COLOR_SYSTEM_SHADE_START_TONE_INDEX = 7;
const COLOR_SYSTEM_SHADE_CHROMA_BOOST = 1.14;
const COLOR_SYSTEM_SHADE_CHROMA_FLOOR_BOOST = 1.18;
const COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT = "rgb";
const COLOR_SYSTEM_UNLOCKED_CHROMA_EDGE_SOFTENING = 0.18;
const COLOR_SYSTEM_ROLE_CONFIGS = [
  { key: "primary", label: "Primary", referenceHex: "#8B5CF6", type: "brand" },
  { key: "positive", label: "Positive", referenceHex: "#22C55E", targetHue: 150, hueMin: 140, hueMax: 160 },
  { key: "negative", label: "Negative", referenceHex: "#EF4444", targetHue: 27, hueMin: 20, hueMax: 35 },
  { key: "warning", label: "Warning", referenceHex: "#EAB308", targetHue: 86, hueMin: 75, hueMax: 95 },
  { key: "info", label: "Info", referenceHex: "#0EA5E9", targetHue: 245, hueMin: 230, hueMax: 260 },
];
const COLOR_SYSTEM_ROLE_RELATIVE_CHROMA_TONE_MULTIPLIERS = [
  0.38,
  0.5,
  0.66,
  0.82,
  0.94,
  1,
  0.9,
  0.78,
  0.64,
  0.48,
  0.34,
];
const COLOR_SYSTEM_TINT_SHADE_HUE_SHIFT_MAX = 24;
const COLOR_SYSTEM_ROLE_TONE_LIGHTNESS_COMPENSATION = {
  default: { width: 0.22, maxLift: 0.1, maxDrop: 0.05 },
  warning: { width: 0.24, maxLift: 0.18, maxDrop: 0.04 },
};
const COLOR_SYSTEM_SEMANTIC_HUE_RANGES = {
  positive: { min: 140, max: 160, preferred: 150, warmTarget: 157, coolTarget: 144, step: 1, adaptability: 1 },
  negative: { min: 20, max: 35, preferred: 27, warmTarget: 21, coolTarget: 31, step: 1, adaptability: 1 },
  warning: { min: 75, max: 95, preferred: 86, warmTarget: 92, coolTarget: 80, step: 1, adaptability: 1 },
  info: { min: 230, max: 260, preferred: 245, warmTarget: 235, coolTarget: 255, step: 1, adaptability: 1 },
};
const COLOR_SYSTEM_ROLE_LIGHTNESS_OFFSETS = {
  primary: 0,
  positive: 0.006,
  negative: -0.006,
  warning: 0.01,
  info: 0.002,
};
const COLOR_SYSTEM_ROLE_CHROMA_CEILINGS = {
  primary: [0.12, 0.18, 0.3, 0.46, 0.61, 0.72, 0.7, 0.62, 0.48, 0.34, 0.24],
  positive: [0.12, 0.18, 0.3, 0.46, 0.61, 0.72, 0.7, 0.62, 0.48, 0.34, 0.24],
  negative: [0.12, 0.18, 0.3, 0.46, 0.61, 0.72, 0.7, 0.62, 0.48, 0.34, 0.24],
  warning: [0.12, 0.18, 0.3, 0.46, 0.61, 0.72, 0.7, 0.62, 0.48, 0.34, 0.24],
  info: [0.12, 0.18, 0.3, 0.46, 0.61, 0.72, 0.7, 0.62, 0.48, 0.34, 0.24],
};

function getMaxSrgbChromaForOklch(lightness, hue) {
  const l = clamp(lightness, 0, 1);
  const h = ((hue % 360) + 360) % 360;
  const colorEngine = getCuloriEngine();

  if (colorEngine && typeof colorEngine.maxOklchChroma === "function") {
    try {
      return colorEngine.maxOklchChroma(l, h, COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT);
    } catch (error) {
      // Fall through to the local gamut search.
    }
  }

  let low = 0;
  let high = 0.45;

  if (isOklchInSrgbGamut({ l, c: high, h })) {
    high = 1;
  }

  for (let index = 0; index < 18; index += 1) {
    const mid = (low + high) / 2;
    if (isOklchInSrgbGamut({ l, c: mid, h })) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return low;
}

function getCuloriEngine() {
  return null;
}

function getColorSystemRelativeChromaMax(lightness, hue, gamut = COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT) {
  const safeLightness = clamp(lightness, 0, 1);
  const safeHue = ((hue % 360) + 360) % 360;
  const colorEngine = getCuloriEngine();

  if (colorEngine && typeof colorEngine.maxOklchChroma === "function") {
    try {
      return colorEngine.maxOklchChroma(safeLightness, safeHue, gamut);
    } catch (error) {
      // Fall through to the existing sRGB max chroma helper.
    }
  }

  return getMaxSrgbChromaForOklch(safeLightness, safeHue);
}

function getColorSystemAbsoluteChromaFromRelative(lightness, hue, relativeChroma, options = {}) {
  const gamut = options.gamut || COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT;
  const maxChroma = getColorSystemRelativeChromaMax(lightness, hue, gamut);
  const relativePercent = clamp(Number(relativeChroma) || 0, 0, 100);
  return maxChroma > 0 ? maxChroma * (relativePercent / 100) : 0;
}

function getColorSystemRelativeChromaFromAbsolute(lightness, hue, absoluteChroma, options = {}) {
  const gamut = options.gamut || COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT;
  const maxChroma = getColorSystemRelativeChromaMax(lightness, hue, gamut);
  if (maxChroma <= 0) {
    return 0;
  }

  return clamp((Math.max(0, Number(absoluteChroma) || 0) * 100) / maxChroma, 0, 100);
}

function getColorSystemProfileRelativeChroma(profile) {
  if (!profile) {
    return 0;
  }

  return getColorSystemRelativeChromaFromAbsolute(profile.l, profile.h, profile.c);
}

function normalizeColorSystemHue(hue) {
  return ((hue % 360) + 360) % 360;
}

function getColorSystemSignedHueDelta(hue, targetHue) {
  return ((normalizeColorSystemHue(hue) - normalizeColorSystemHue(targetHue) + 540) % 360) - 180;
}

function getColorSystemHueDistance(hue, targetHue) {
  return Math.abs(getColorSystemSignedHueDelta(hue, targetHue));
}

function getColorSystemToneSourceIndex(toneStop, fallbackIndex = COLOR_SYSTEM_REFERENCE_TONE_INDEX) {
  return clamp(
    Math.round(Number.isFinite(toneStop && toneStop.sourceIndex) ? toneStop.sourceIndex : fallbackIndex),
    0,
    COLOR_SYSTEM_ROLE_RELATIVE_CHROMA_TONE_MULTIPLIERS.length - 1,
  );
}

function getTintShadeToneChromaMultiplier(toneStop, anchorSourceIndex, baseRelativeChroma) {
  const toneIndex = getColorSystemToneSourceIndex(toneStop);
  const anchorIndex = getColorSystemToneSourceIndex(null, anchorSourceIndex);
  const toneMultiplier = COLOR_SYSTEM_ROLE_RELATIVE_CHROMA_TONE_MULTIPLIERS[toneIndex] || 1;
  const anchorMultiplier = COLOR_SYSTEM_ROLE_RELATIVE_CHROMA_TONE_MULTIPLIERS[anchorIndex] || 1;
  const normalizedMultiplier = anchorMultiplier > 0 ? toneMultiplier / anchorMultiplier : toneMultiplier;
  const chromaStrength = smoothstep(34, 82, clamp(baseRelativeChroma, 0, 100));
  const curveStrength = 0.58 + chromaStrength * 0.28;

  return clamp(1 + (normalizedMultiplier - 1) * curveStrength, 0.42, 1.18);
}

function getTintShadeToneHue(baseHue, toneStop, anchorSourceIndex, baseRelativeChroma = 100) {
  const safeHue = normalizeColorSystemHue(baseHue);
  const toneProgress = clamp(
    toneStop && Number.isFinite(toneStop.progress)
      ? toneStop.progress
      : getColorSystemToneProgressForSourceIndex(toneStop && toneStop.sourceIndex),
    0,
    1,
  );
  const anchorProgress = clamp(getColorSystemToneProgressForSourceIndex(anchorSourceIndex), 0, 1);
  const lighterAmount = anchorProgress > 0
    ? Math.pow(clamp((anchorProgress - toneProgress) / anchorProgress, 0, 1), 0.82)
    : 0;
  const darkerAmount = anchorProgress < 1
    ? Math.pow(clamp((toneProgress - anchorProgress) / (1 - anchorProgress), 0, 1), 0.88)
    : 0;

  if (lighterAmount <= 0 && darkerAmount <= 0) {
    return safeHue;
  }

  const vividness = smoothstep(28, 78, clamp(baseRelativeChroma, 0, 100));
  const redInfluence = Math.max(getHueWindowScore(safeHue, 24, 42), getHueWindowScore(safeHue, 358, 36));
  const orangeInfluence = getHueWindowScore(safeHue, 45, 46);
  const yellowInfluence = getHueWindowScore(safeHue, 92, 52);
  const greenInfluence = getHueWindowScore(safeHue, 150, 56);
  const blueInfluence = Math.max(getHueWindowScore(safeHue, 220, 62), getHueWindowScore(safeHue, 258, 62));
  const violetInfluence = Math.max(getHueWindowScore(safeHue, 292, 50), getHueWindowScore(safeHue, 326, 52));
  const lightShift = (
    -redInfluence * 8
    + orangeInfluence * 8
    + yellowInfluence * 4
    - greenInfluence * 2
    - blueInfluence * 2
    + violetInfluence * 32
  );
  const darkShift = (
    -redInfluence * 4
    + orangeInfluence * 2
    - yellowInfluence * 4
    - greenInfluence * 2
    + blueInfluence * 4
    + violetInfluence * 8
  );
  const shift = clamp(
    (lightShift * lighterAmount + darkShift * darkerAmount) * vividness,
    -COLOR_SYSTEM_TINT_SHADE_HUE_SHIFT_MAX,
    COLOR_SYSTEM_TINT_SHADE_HUE_SHIFT_MAX,
  );

  return normalizeColorSystemHue(safeHue + shift);
}

function getTintShadeToneRelativeChroma(baseRelativeChroma, toneStop, options = {}) {
  const lockedRelativeChroma = clamp(baseRelativeChroma, 0, 100);
  const toneMultiplier = getTintShadeToneChromaMultiplier(
    toneStop,
    options.anchorSourceIndex,
    lockedRelativeChroma,
  );
  const toneRelativeChroma = lockedRelativeChroma * toneMultiplier;

  if (isHexLocked) {
    return clamp(toneRelativeChroma, 0, 100);
  }

  const progress = clamp(toneStop && Number.isFinite(toneStop.progress) ? toneStop.progress : 0.5, 0, 1);
  const edgeStrength = Math.abs(progress - 0.5) * 2;
  const middleLift = 1 - edgeStrength;
  const multiplier = 1
    - COLOR_SYSTEM_UNLOCKED_CHROMA_EDGE_SOFTENING * edgeStrength
    + 0.06 * middleLift;

  return clamp(toneRelativeChroma * multiplier, 0, 100);
}

function getColorSystemRoleToneRelativeChroma(baseRelativeChroma, toneStop, anchorSourceIndex) {
  return getTintShadeToneRelativeChroma(baseRelativeChroma, toneStop, { anchorSourceIndex });
}

function getColorSystemToneProgressForSourceIndex(sourceIndex) {
  const toneIndex = clamp(
    Math.round(Number.isFinite(sourceIndex) ? sourceIndex : COLOR_SYSTEM_REFERENCE_TONE_INDEX),
    0,
    COLOR_SYSTEM_TONE_CURVE.length - 1,
  );

  return COLOR_SYSTEM_TONE_CURVE[toneIndex] || 0;
}

function getColorSystemRoleToneLightness(role, baseLightness, toneStop, options = {}) {
  if (!role || role.type === "brand" || !options.roleAnchorProfile) {
    return baseLightness;
  }

  const range = getTintShadeLightnessRange();
  const compensation = COLOR_SYSTEM_ROLE_TONE_LIGHTNESS_COMPENSATION[role.key]
    || COLOR_SYSTEM_ROLE_TONE_LIGHTNESS_COMPENSATION.default;
  const anchorLightness = clamp(options.roleAnchorProfile.l, range.min, range.max);
  const primaryAnchorLightness = clamp(
    Number.isFinite(options.primaryAnchorLightness) ? options.primaryAnchorLightness : baseLightness,
    range.min,
    range.max,
  );
  const rawDelta = anchorLightness - primaryAnchorLightness;
  const limitedDelta = rawDelta >= 0
    ? clamp(rawDelta, 0, compensation.maxLift)
    : clamp(rawDelta, -compensation.maxDrop, 0);
  const toneProgress = clamp(
    toneStop && Number.isFinite(toneStop.progress)
      ? toneStop.progress
      : getColorSystemToneProgressForSourceIndex(toneStop && toneStop.sourceIndex),
    0,
    1,
  );
  const anchorProgress = clamp(getColorSystemToneProgressForSourceIndex(options.anchorSourceIndex), 0, 1);
  const width = Math.max(0.001, compensation.width);
  const distance = (toneProgress - anchorProgress) / width;
  const influence = Math.exp(-(distance * distance));

  return clamp(baseLightness + limitedDelta * influence, range.min, range.max);
}

function createTintShadeRelativeChromaColor(lightness, hue, relativeChroma) {
  const safeLightness = clamp(lightness, 0, 1);
  const safeHue = ((hue % 360) + 360) % 360;
  const safeRelativeChroma = clamp(relativeChroma, 0, 100);
  const maxChroma = getColorSystemRelativeChromaMax(safeLightness, safeHue);
  const chroma = getColorSystemAbsoluteChromaFromRelative(safeLightness, safeHue, safeRelativeChroma);
  const hex = createColorSystemHex(safeLightness, chroma, safeHue);
  const profile = parseColorSystemOklch(hex);
  const actualRelativeChroma = profile
    ? getColorSystemRelativeChromaFromAbsolute(safeLightness, safeHue, profile.c)
    : safeRelativeChroma;

  return {
    hex,
    oklchLightness: profile ? profile.l : safeLightness,
    visibleLightness: safeLightness,
    chroma: profile ? profile.c : chroma,
    relativeChroma: actualRelativeChroma,
    targetRelativeChroma: safeRelativeChroma,
    relativeChromaMax: maxChroma,
    relativeChromaGamut: COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT,
  };
}

function normalizeHexOutput(hex) {
  return normalizeHexInputValue(hex) || DEFAULT_TINT_SHADE_REFERENCE_HEX;
}

function parseColorSystemOklch(hex) {
  const normalizedHex = normalizeHexInputValue(hex);
  const colorEngine = getCuloriEngine();

  if (!normalizedHex) {
    return null;
  }

  if (colorEngine && typeof colorEngine.hexToOklch === "function") {
    try {
      const oklchValue = colorEngine.hexToOklch(normalizedHex);
      if (oklchValue) {
        return {
          hex: normalizedHex,
          l: clamp(Number(oklchValue.l), 0, 1),
          c: Math.max(0, Number(oklchValue.c) || 0),
          h: Number.isFinite(oklchValue.h) ? ((oklchValue.h % 360) + 360) % 360 : 0,
        };
      }
    } catch (error) {
      // Fall through to the local OKLCH conversion.
    }
  }

  const rgb = hexToRgb(normalizedHex);
  if (!rgb) {
    return null;
  }

  const oklch = rgbToOklch(rgb.red, rgb.green, rgb.blue);
  return {
    hex: normalizedHex,
    l: clamp(oklch.l, 0, 1),
    c: Math.max(0, oklch.c),
    h: ((oklch.h % 360) + 360) % 360,
  };
}

function createColorSystemHex(lightness, chroma, hue) {
  const target = {
    l: clamp(lightness, 0, 1),
    c: Math.max(0, chroma),
    h: ((hue % 360) + 360) % 360,
  };
  const colorEngine = getCuloriEngine();

  if (colorEngine && typeof colorEngine.oklchToHex === "function") {
    try {
      return normalizeHexOutput(colorEngine.oklchToHex(target));
    } catch (error) {
      // Fall through to the local OKLCH conversion.
    }
  }

  const fitted = fitOklchToSrgb(target);
  return oklchToHex(fitted);
}

function getVisibleLightnessFromHex(hex) {
  const colorEngine = getCuloriEngine();
  const hsl = colorEngine && typeof colorEngine.hexToHsl === "function"
    ? colorEngine.hexToHsl(hex)
    : hexToHsl(hex);
  return hsl ? clamp(hsl.lightness / 100, 0, 1) : 0;
}

function createColorSystemHexForVisibleLightness(targetLightness, chromaRatio, hue, options = {}) {
  const targetVisibleLightness = clamp(targetLightness, 0, 1);
  const safeHue = ((hue % 360) + 360) % 360;
  const safeRatio = clamp(chromaRatio, 0, 0.94);
  const relativeChroma = safeRatio * 100;
  const minChroma = Math.max(0, Number(options.minChroma) || 0);
  let low = 0;
  let high = 1;
  let best = null;

  for (let index = 0; index < 24; index += 1) {
    const candidateLightness = (low + high) / 2;
    const maxChroma = getColorSystemRelativeChromaMax(candidateLightness, safeHue);
    const chroma = maxChroma > 0
      ? clamp(
          Math.max(getColorSystemAbsoluteChromaFromRelative(candidateLightness, safeHue, relativeChroma), minChroma),
          0,
          maxChroma * 0.96,
        )
      : 0;
    const hex = createColorSystemHex(candidateLightness, chroma, safeHue);
    const visibleLightness = getVisibleLightnessFromHex(hex);
    const distance = Math.abs(visibleLightness - targetVisibleLightness);

    if (!best || distance < best.distance) {
      best = {
        hex,
        oklchLightness: candidateLightness,
        chroma,
        visibleLightness,
        distance,
      };
    }

    if (visibleLightness < targetVisibleLightness) {
      low = candidateLightness;
    } else {
      high = candidateLightness;
    }
  }

  return best || {
    hex: createColorSystemHex(targetVisibleLightness, 0, safeHue),
    oklchLightness: targetVisibleLightness,
    chroma: 0,
    visibleLightness: targetVisibleLightness,
  };
}

function createColorSystemHexForPerceptualLightness(targetLightness, chromaRatio, hue, options = {}) {
  const lightness = clamp(targetLightness, 0, 1);
  const safeHue = ((hue % 360) + 360) % 360;
  const maxChroma = getColorSystemRelativeChromaMax(lightness, safeHue);
  const minChroma = Math.max(0, Number(options.minChroma) || 0);
  const relativeChroma = clamp(chromaRatio, 0, 0.94) * 100;
  const chroma = maxChroma > 0
    ? clamp(
        Math.max(getColorSystemAbsoluteChromaFromRelative(lightness, safeHue, relativeChroma), minChroma),
        0,
        maxChroma * 0.96,
      )
    : 0;
  const hex = createColorSystemHex(lightness, chroma, safeHue);

  return {
    hex,
    oklchLightness: lightness,
    chroma,
    visibleLightness: lightness,
  };
}

function constrainColorSystemColorToGlobalLightness(colorResult, chromaRatio, hue, options = {}) {
  const range = getTintShadeLightnessRange();
  const visibleLightness = getVisibleLightnessFromHex(colorResult.hex);
  const constrainedLightness = clamp(visibleLightness, range.min, range.max);

  if (Math.abs(visibleLightness - constrainedLightness) < 0.002) {
    return {
      ...colorResult,
      visibleLightness,
    };
  }

  return createColorSystemHexForVisibleLightness(constrainedLightness, chromaRatio, hue, options);
}

function getColorSystemContrast(firstHex, secondHex) {
  const colorEngine = getCuloriEngine();
  if (colorEngine && typeof colorEngine.contrast === "function") {
    try {
      return colorEngine.contrast(firstHex, secondHex);
    } catch (error) {
      // Fall through to the local contrast calculation.
    }
  }

  const firstRgb = hexToRgb(firstHex);
  const secondRgb = hexToRgb(secondHex);
  if (!firstRgb || !secondRgb) {
    return 1;
  }

  const firstLuminance = getRelativeLuminanceFromRgb(firstRgb);
  const secondLuminance = getRelativeLuminanceFromRgb(secondRgb);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function getColorSystemToneStops(pointCount) {
  const safePointCount = clamp(Math.round(pointCount), 2, COLOR_SYSTEM_TONES.length);

  if (safePointCount === COLOR_SYSTEM_TONES.length) {
    return COLOR_SYSTEM_TONES.map((tone, index) => ({
      tone,
      sourceIndex: index,
      progress: COLOR_SYSTEM_TONE_CURVE[index],
    }));
  }

  if (safePointCount === COLOR_SYSTEM_TONES.length - 1) {
    return COLOR_SYSTEM_TONES.slice(0, -1).map((tone, index) => ({
      tone,
      sourceIndex: index,
      progress: COLOR_SYSTEM_TONE_CURVE[index],
    }));
  }

  return Array.from({ length: safePointCount }, (_, index) => {
    const sourceIndex = Math.round((index / (safePointCount - 1)) * (COLOR_SYSTEM_TONES.length - 1));
    return {
      tone: COLOR_SYSTEM_TONES[sourceIndex],
      sourceIndex,
      progress: COLOR_SYSTEM_TONE_CURVE[sourceIndex],
    };
  });
}

function getColorSystemLightnessLadder(pointCount) {
  const range = getTintShadeLightnessRange();
  const toneStops = getColorSystemToneStops(pointCount);
  const span = Math.max(range.max - range.min, 0.02);

  return toneStops.map((toneStop, index) => {
    return {
      ...toneStop,
      index,
      lightness: clamp(range.max - span * toneStop.progress, range.min, range.max),
    };
  });
}

function getColorSystemAnchoredLightnessLadder(toneLadder, anchorSourceIndex, anchorLightness) {
  const range = getTintShadeLightnessRange();
  const anchorIndex = getColorSystemAvailableToneSourceIndex(toneLadder, anchorSourceIndex);
  const anchorStop = toneLadder.find((toneStop) => toneStop.sourceIndex === anchorIndex);

  if (!anchorStop) {
    return toneLadder;
  }

  const anchorProgress = clamp(anchorStop.progress, 0, 1);
  const safeAnchorLightness = clamp(anchorLightness, range.min, range.max);
  const tintSpan = Math.max(range.max - safeAnchorLightness, 0.001);
  const shadeSpan = Math.max(safeAnchorLightness - range.min, 0.001);

  return toneLadder.map((toneStop) => {
    const progress = clamp(toneStop.progress, 0, 1);
    let lightness = safeAnchorLightness;

    if (toneStop.sourceIndex < anchorIndex && anchorProgress > 0) {
      const tintProgress = clamp(progress / anchorProgress, 0, 1);
      lightness = range.max - tintSpan * tintProgress;
    } else if (toneStop.sourceIndex > anchorIndex && anchorProgress < 1) {
      const shadeProgress = clamp((progress - anchorProgress) / (1 - anchorProgress), 0, 1);
      lightness = safeAnchorLightness - shadeSpan * shadeProgress;
    }

    return {
      ...toneStop,
      lightness: clamp(lightness, range.min, range.max),
    };
  });
}

function getColorSystemClosestToneSourceIndex(toneStops, anchorLightness) {
  let closestSourceIndex = COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  let closestDistance = Infinity;

  toneStops.forEach((toneStop) => {
    const distance = Math.abs(toneStop.lightness - anchorLightness);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestSourceIndex = toneStop.sourceIndex;
    }
  });

  return closestSourceIndex;
}

function getColorSystemAvailableToneSourceIndex(toneStops, preferredSourceIndex) {
  if (!Array.isArray(toneStops) || toneStops.length === 0) {
    return COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  }

  const safePreferredIndex = Number.isFinite(preferredSourceIndex)
    ? preferredSourceIndex
    : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  let closestSourceIndex = toneStops[0].sourceIndex;
  let closestDistance = Infinity;

  toneStops.forEach((toneStop) => {
    const distance = Math.abs(toneStop.sourceIndex - safePreferredIndex);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestSourceIndex = toneStop.sourceIndex;
    }
  });

  return closestSourceIndex;
}

function getTintShadeBalancedPrimaryAnchorSourceIndex(toneStops, brandProfile) {
  const closestSourceIndex = getColorSystemClosestToneSourceIndex(toneStops, brandProfile.l);
  const hue = normalizeColorSystemHue(brandProfile.h);
  const relativeChroma = getColorSystemProfileRelativeChroma(brandProfile);
  const warmCoreInfluence = Math.max(
    getHueWindowScore(hue, 24, 44),
    getHueWindowScore(hue, 45, 48),
    getHueWindowScore(hue, 92, 54),
    getHueWindowScore(hue, 350, 40),
  );
  const warmVividAnchor = warmCoreInfluence
    * smoothstep(48, 82, relativeChroma)
    * smoothstep(0.56, 0.84, brandProfile.l);

  if (closestSourceIndex < COLOR_SYSTEM_REFERENCE_TONE_INDEX && warmVividAnchor > 0.22) {
    return getColorSystemAvailableToneSourceIndex(toneStops, COLOR_SYSTEM_REFERENCE_TONE_INDEX);
  }

  return closestSourceIndex;
}

function getTintShadePrimaryAnchorSourceIndex(toneLadder, brandProfile) {
  const closestSourceIndex = getTintShadeBalancedPrimaryAnchorSourceIndex(toneLadder, brandProfile);
  const anchorHex = normalizeHexInputValue(brandProfile.hex);

  if (!lockedTintShadeAnchorState || lockedTintShadeAnchorState.hex !== anchorHex) {
    lockedTintShadeAnchorState = {
      hex: anchorHex,
      sourceIndex: closestSourceIndex,
    };
  }

  return getColorSystemAvailableToneSourceIndex(toneLadder, lockedTintShadeAnchorState.sourceIndex);
}

function getColorSystemBestAnchorSourceIndex(toneStops, profile, options = {}) {
  if (!profile) {
    return COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  }

  const range = getTintShadeLightnessRange();
  const anchorLightness = clamp(
    Number.isFinite(options.anchorLightness) ? options.anchorLightness : profile.l,
    range.min,
    range.max,
  );
  const chromaRatio = Number.isFinite(options.chromaRatio)
    ? clamp(options.chromaRatio, 0, 0.94)
    : getColorSystemChromaRatio(profile);
  const hue = ((profile.h % 360) + 360) % 360;
  const vividness = smoothstep(0.34, 0.72, chromaRatio);
  const softness = 1 - smoothstep(0.2, 0.48, chromaRatio);
  const warmLightHue = Math.max(
    getHueWindowScore(hue, 82, 46),
    getHueWindowScore(hue, 104, 42),
  );
  const coolElectricHue = Math.max(
    getHueWindowScore(hue, 190, 46),
    getHueWindowScore(hue, 235, 50),
    getHueWindowScore(hue, 270, 44),
  );
  const yellowAnchorGravity = clamp(
    warmLightHue
      * smoothstep(0.62, 0.82, anchorLightness)
      * smoothstep(0.42, 0.76, chromaRatio),
    0,
    1,
  );
  const coreBias = clamp(
    vividness * (0.48 + warmLightHue * 0.34 + coolElectricHue * 0.12) - softness * 0.16,
    0,
    0.86,
  );
  const lightnessWeight = clamp(1 - coreBias * 0.78, 0.22, 1);
  const tintPenalty = coreBias * (0.22 + warmLightHue * 0.08) * (1 - yellowAnchorGravity * 0.72);
  const corePull = coreBias * (0.34 + warmLightHue * 0.16) * (1 - yellowAnchorGravity * 0.58);
  const visualAnchorTarget = COLOR_SYSTEM_REFERENCE_TONE_INDEX - yellowAnchorGravity * 1.08;
  const lowChromaTintPull = softness * smoothstep(0.72, 0.96, anchorLightness) * 0.22;
  let bestSourceIndex = getColorSystemClosestToneSourceIndex(toneStops, anchorLightness);
  let bestScore = Infinity;

  toneStops.forEach((toneStop) => {
    const sourceIndex = toneStop.sourceIndex;
    const lightnessDistance = Math.abs(toneStop.lightness - anchorLightness);
    const coreDistance = Math.abs(sourceIndex - COLOR_SYSTEM_REFERENCE_TONE_INDEX) / COLOR_SYSTEM_REFERENCE_TONE_INDEX;
    const tintDistance = sourceIndex / COLOR_SYSTEM_REFERENCE_TONE_INDEX;
    let score = lightnessDistance * lightnessWeight;

    score += coreDistance * corePull;
    score += Math.abs(sourceIndex - visualAnchorTarget) * yellowAnchorGravity * 0.08;

    if (sourceIndex < COLOR_SYSTEM_REFERENCE_TONE_INDEX) {
      score += tintPenalty * Math.pow((COLOR_SYSTEM_REFERENCE_TONE_INDEX - sourceIndex) / COLOR_SYSTEM_REFERENCE_TONE_INDEX, 1.2);
    }

    if (sourceIndex > COLOR_SYSTEM_REFERENCE_TONE_INDEX + 1 && anchorLightness > 0.58) {
      score += (sourceIndex - COLOR_SYSTEM_REFERENCE_TONE_INDEX - 1) * 0.04;
    }

    score -= lowChromaTintPull * (1 - tintDistance);

    if (score < bestScore) {
      bestScore = score;
      bestSourceIndex = sourceIndex;
    }
  });

  return bestSourceIndex;
}

function getColorSystemChromaRatio(profile) {
  const relativeChroma = getColorSystemProfileRelativeChroma(profile);
  return relativeChroma > 0 ? clamp(relativeChroma / 100, 0.04, 0.94) : 0.48;
}

function getColorSystemDefaultPrimaryProfile() {
  return parseColorSystemOklch(DEFAULT_TINT_SHADE_REFERENCE_HEX);
}

function getColorSystemRoleReferenceProfile(role) {
  return parseColorSystemOklch(role.referenceHex || DEFAULT_TINT_SHADE_REFERENCE_HEX);
}

function getColorSystemFamilyTransform(brandProfile) {
  const defaultPrimary = getColorSystemDefaultPrimaryProfile();
  if (!defaultPrimary) {
    return {
      chromaRatioDelta: 1,
      mood: getColorSystemMood(brandProfile, getColorSystemChromaRatio(brandProfile)),
    };
  }

  const defaultChromaRatio = getColorSystemChromaRatio(defaultPrimary);
  const brandChromaRatio = getColorSystemChromaRatio(brandProfile);

  return {
    chromaRatioDelta: defaultChromaRatio > 0
      ? clamp(brandChromaRatio / defaultChromaRatio, 0.45, 1.7)
      : 1,
    brandChromaRatio,
    mood: getColorSystemMood(brandProfile, brandChromaRatio),
  };
}

function getHueDistanceDegrees(sourceHue, targetHue) {
  const source = ((sourceHue % 360) + 360) % 360;
  const target = ((targetHue % 360) + 360) % 360;
  return Math.abs(((target - source + 540) % 360) - 180);
}

function getHueWindowScore(hue, center, radius) {
  return clamp(1 - getHueDistanceDegrees(hue, center) / radius, 0, 1);
}

function getColorSystemBrandTemperature(brandProfile) {
  const hue = brandProfile.h;
  return {
    warm: Math.max(
      getHueWindowScore(hue, 28, 62),
      getHueWindowScore(hue, 72, 58),
    ),
    cool: Math.max(
      getHueWindowScore(hue, 205, 70),
      getHueWindowScore(hue, 255, 76),
      getHueWindowScore(hue, 305, 62),
    ),
    redWarm: Math.max(
      getHueWindowScore(hue, 25, 42),
      getHueWindowScore(hue, 48, 42),
    ),
    green: getHueWindowScore(hue, 150, 34),
    greenCyan: Math.max(
      getHueWindowScore(hue, 160, 36),
      getHueWindowScore(hue, 198, 54),
    ),
  };
}

function getColorSystemMood(brandProfile, brandChromaRatio) {
  const temperature = getColorSystemBrandTemperature(brandProfile);
  const chromaRatio = clamp(brandChromaRatio, 0, 1);
  const visibleLightness = typeof brandProfile.visibleLightness === "number"
    ? brandProfile.visibleLightness
    : getVisibleLightnessFromHex(brandProfile.hex);
  const vividness = smoothstep(0.52, 0.86, chromaRatio);
  const softness = 1 - smoothstep(0.28, 0.62, chromaRatio);
  const brightness = smoothstep(0.5, 0.78, visibleLightness);
  const depth = 1 - smoothstep(0.32, 0.58, visibleLightness);
  const temperatureBias = clamp(temperature.warm - temperature.cool, -1, 1);
  const coolFresh = clamp(
    temperature.cool * 0.72 + vividness * 0.18 + brightness * 0.1 - temperature.warm * 0.22,
    0,
    1,
  );
  const warmGlow = clamp(
    temperature.warm * 0.78 + brightness * 0.08 - temperature.cool * 0.18,
    0,
    1,
  );
  const natural = clamp(
    Math.max(temperature.green, temperature.warm * 0.64) * (0.74 + softness * 0.26) * (1 - vividness * 0.34),
    0,
    1,
  );
  const corporate = clamp(
    temperature.cool * (1 - vividness * 0.38) * (0.7 + softness * 0.18 + depth * 0.12),
    0,
    1,
  );
  const playful = clamp(
    vividness * (0.68 + brightness * 0.22) * (0.86 + Math.abs(temperatureBias) * 0.14),
    0,
    1,
  );
  const modern = clamp(
    0.36 + coolFresh * 0.22 + vividness * 0.14 - natural * 0.16 - softness * 0.08,
    0,
    1,
  );
  const premium = clamp(depth * 0.44 + softness * 0.34 + (1 - vividness) * 0.18 - brightness * 0.08, 0, 1);
  const clean = clamp(0.42 + corporate * 0.24 + modern * 0.18 + softness * 0.08 - vividness * 0.08, 0, 1);
  const technical = clamp(temperature.cool * 0.42 + modern * 0.24 + (1 - softness) * 0.2 + corporate * 0.1, 0, 1);
  const elegant = clamp(premium * 0.48 + softness * 0.28 + (1 - vividness) * 0.18 + depth * 0.06, 0, 1);
  const energyLevel = clamp(vividness * 0.62 + Math.abs(temperatureBias) * 0.16 + brightness * 0.12 - softness * 0.16, 0, 1);
  const contrastHardness = clamp((1 - softness) * 0.36 + depth * 0.22 + vividness * 0.22 + playful * 0.14 - premium * 0.12, 0, 1);
  const harmonyWidth = clamp(
    0.34 + energyLevel * 0.24 + playful * 0.12 + contrastHardness * 0.1 - natural * 0.12 - elegant * 0.1,
    0.18,
    0.78,
  );
  const semanticWeight = clamp(
    0.4 + energyLevel * 0.28 + contrastHardness * 0.18 + playful * 0.08 - premium * 0.1 - softness * 0.08,
    0.24,
    0.82,
  );
  const intensity = softness > 0.58 ? "soft" : vividness > 0.55 ? "vivid" : "balanced";
  const temperatureName = temperatureBias > 0.18 ? "warm" : temperatureBias < -0.18 ? "cool" : "balanced";
  const hueFamily = temperatureName === "warm" ? "warm" : "cool";
  const lightnessName = brightness > 0.56 ? "light" : depth > 0.54 ? "dark" : "balanced";
  const chromaPersonality = softness > 0.55 ? "low-chroma" : vividness > 0.56 ? "high-chroma" : "balanced-chroma";
  const energyName = energyLevel > 0.58 ? "high" : energyLevel < 0.32 ? "low" : "medium";
  const contrastName = contrastHardness > 0.58 ? "hard" : contrastHardness < 0.34 ? "soft" : "balanced";
  const harmonyStyle = harmonyWidth > 0.56 ? "wide" : harmonyWidth < 0.34 ? "tight" : "balanced";
  const semanticWeightName = semanticWeight > 0.58 ? "strong" : semanticWeight < 0.36 ? "soft" : "balanced";
  const characterScores = [
    ["natural", natural],
    ["corporate", corporate],
    ["playful", playful],
    ["modern", modern],
    ["premium", premium],
    ["technical", technical],
    ["elegant", elegant],
    ["clean", clean],
  ];
  const character = characterScores.reduce((best, item) => (item[1] > best[1] ? item : best), characterScores[0])[0];

  return {
    hueFamily,
    lightnessName,
    chromaPersonality,
    temperatureName,
    intensity,
    character,
    energyName,
    contrastName,
    harmonyStyle,
    semanticWeightName,
    temperature,
    temperatureBias,
    coolFresh,
    warmGlow,
    softness,
    vividness,
    natural,
    corporate,
    playful,
    modern,
    premium,
    clean,
    technical,
    elegant,
    energyLevel,
    contrastHardness,
    harmonyWidth,
    semanticWeight,
    chromaSystemBias: clamp(
      1 + vividness * 0.08 + playful * 0.03 + energyLevel * 0.03 - softness * 0.035,
      0.94,
      1.2,
    ),
    darkTailIdentity: clamp(
      0.065 + vividness * 0.04 + modern * 0.018 + energyLevel * 0.018 - softness * 0.025 + depth * 0.01,
      0.045,
      0.16,
    ),
  };
}

function getColorSystemRoleHueRange(role) {
  const configuredRange = COLOR_SYSTEM_SEMANTIC_HUE_RANGES[role.key];
  if (configuredRange) {
    const configuredMin = Number(configuredRange.min);
    const configuredMax = Number(configuredRange.max);
    const configuredPreferred = Number(configuredRange.preferred);
    const configuredWarmTarget = Number(configuredRange.warmTarget);
    const configuredCoolTarget = Number(configuredRange.coolTarget);
    const configuredAdaptability = Number(configuredRange.adaptability);
    const min = Number.isFinite(configuredMin) ? configuredMin : 0;
    const max = Number.isFinite(configuredMax) ? configuredMax : min;
    const step = Number.isFinite(Number(configuredRange.step))
      ? Math.max(Number(configuredRange.step), 0.25)
      : 1;
    const base = Number.isFinite(configuredPreferred) ? configuredPreferred : (min + max) / 2;

    return {
      base,
      min: Math.min(min, max),
      max: Math.max(min, max),
      warmTarget: Number.isFinite(configuredWarmTarget) ? configuredWarmTarget : base,
      coolTarget: Number.isFinite(configuredCoolTarget) ? configuredCoolTarget : base,
      step,
      adaptability: Number.isFinite(configuredAdaptability) ? clamp(configuredAdaptability, 0, 1.5) : 1,
    };
  }

  const targetHue = Number(role.targetHue);
  const hueMin = Number.isFinite(Number(role.hueMin)) ? Number(role.hueMin) : targetHue;
  const hueMax = Number.isFinite(Number(role.hueMax)) ? Number(role.hueMax) : targetHue;
  return {
    base: Number.isFinite(targetHue) ? targetHue : hueMin,
    min: Math.min(hueMin, hueMax),
    max: Math.max(hueMin, hueMax),
    warmTarget: Number.isFinite(targetHue) ? targetHue : hueMin,
    coolTarget: Number.isFinite(targetHue) ? targetHue : hueMin,
    step: 1,
    adaptability: 1,
  };
}

function getColorSystemRoleHueCandidates(role) {
  const range = getColorSystemRoleHueRange(role);
  const step = range.step || 1;
  const candidates = [];

  for (let hue = range.min; hue <= range.max + 0.001; hue += step) {
    candidates.push(Number(hue.toFixed(3)));
  }

  if (!candidates.some((hue) => Math.abs(hue - range.base) < 0.001)) {
    candidates.push(range.base);
  }

  return candidates.sort((a, b) => a - b);
}

function getColorSystemRoleMoodHueTarget(role, brandProfile, fallbackHue, systemMood) {
  if (role.type === "brand") {
    return fallbackHue;
  }

  const range = getColorSystemRoleHueRange(role);
  const mood = systemMood || getColorSystemMood(brandProfile, getColorSystemChromaRatio(brandProfile));
  const brandTemperature = mood.temperature || getColorSystemBrandTemperature(brandProfile);
  const warmSignal = clamp(
    brandTemperature.warm * 0.72
      + brandTemperature.redWarm * 0.18
      + (mood.warmGlow || 0) * 0.24
      - brandTemperature.cool * 0.3,
    0,
    1,
  );
  const coolSignal = clamp(
    brandTemperature.cool * 0.72
      + brandTemperature.greenCyan * 0.12
      + (mood.coolFresh || 0) * 0.24
      - brandTemperature.warm * 0.3,
    0,
    1,
  );
  const dominantSignal = Math.max(warmSignal, coolSignal);
  const laneTarget = warmSignal >= coolSignal ? range.warmTarget : range.coolTarget;
  const pullStrength = clamp(
    dominantSignal * 0.92
      + Math.abs(mood.temperatureBias || 0) * 0.18
      + (mood.vividness || 0) * 0.08,
    0,
    1,
  ) * range.adaptability * clamp(0.82 + (mood.harmonyWidth || 0.44) * 0.36, 0.82, 1.12);
  let hue = range.base + (laneTarget - range.base) * pullStrength;

  if (role.key === "positive" && brandTemperature.green > 0.45) {
    hue += brandProfile.h <= range.base ? 3.2 : -3.2;
  } else if (role.key === "negative" && brandTemperature.redWarm > 0.48) {
    hue += range.warmTarget < range.base ? -1.2 : 1.2;
  } else if (role.key === "warning") {
    hue += brandTemperature.green * -2.4 + brandTemperature.redWarm * 2.2 - (mood.natural || 0) * 0.8;
  } else if (role.key === "info" && brandTemperature.greenCyan > 0.42) {
    hue += range.coolTarget > range.base ? 2.4 : -2.4;
  } else if (role.key === "info") {
    const bluePrimaryCollision = Math.max(
      getHueWindowScore(brandProfile.h, 245, 42),
      getHueWindowScore(brandProfile.h, 275, 42),
    );
    if (bluePrimaryCollision > 0.18) {
      const cyanSeparation = clamp(0.45 + bluePrimaryCollision * 0.5, 0, 0.92);
      hue = hue + (range.warmTarget - hue) * cyanSeparation;
    }
  }

  return clamp(hue, range.min, range.max);
}

function getColorSystemSemanticHueScore(role, candidateHue, brandProfile, referenceProfile, systemMood, idealHue) {
  const range = getColorSystemRoleHueRange(role);
  const span = Math.max(range.max - range.min, 1);
  const mood = systemMood || getColorSystemMood(brandProfile, getColorSystemChromaRatio(brandProfile));
  const brandTemperature = mood.temperature || getColorSystemBrandTemperature(brandProfile);
  const centerScore = getHueDistanceDegrees(candidateHue, range.base) / span;
  const idealScore = getHueDistanceDegrees(candidateHue, idealHue) / span;
  const brandDistance = getHueDistanceDegrees(candidateHue, brandProfile.h);
  const sameLane = brandProfile.h >= range.min && brandProfile.h <= range.max;
  const brandCloseness = 1 - smoothstep(12, 38, brandDistance);
  const referenceLightness = referenceProfile ? referenceProfile.l : 0.7;
  const midCapacity = getColorSystemRelativeChromaMax(referenceLightness, candidateHue);
  const tintCapacity = getColorSystemRelativeChromaMax(0.96, candidateHue);
  const darkCapacity = getColorSystemRelativeChromaMax(0.32, candidateHue);
  let score = idealScore * (0.68 + range.adaptability * 0.08) + centerScore * 0.045;

  score += clamp((0.16 - midCapacity) / 0.16, 0, 1) * 0.13;
  score += clamp((0.026 - tintCapacity) / 0.026, 0, 1) * 0.08;
  score += clamp((0.08 - darkCapacity) / 0.08, 0, 1) * 0.06;

  if (sameLane) {
    const distinctnessWeight = role.key === "positive" ? 0.32 : role.key === "info" ? 0.22 : 0.18;
    score += brandCloseness * distinctnessWeight;
  } else {
    score += brandCloseness * 0.035;
  }

  if (role.key === "positive") {
    score += getHueWindowScore(candidateHue, 140, 5) * (brandTemperature.green > 0.35 ? 0.06 : 0.025);
    score += getHueWindowScore(candidateHue, 160, 5) * (brandTemperature.cool > 0.35 ? 0.04 : 0.02);
  } else if (role.key === "negative") {
    score += getHueWindowScore(candidateHue, 35, 5) * (brandTemperature.redWarm > 0.35 ? 0.04 : 0.015);
  } else if (role.key === "warning") {
    score += getHueWindowScore(candidateHue, 95, 5) * (brandTemperature.green > 0.35 ? 0.07 : 0.02);
    score += getHueWindowScore(candidateHue, 75, 5) * (brandTemperature.redWarm > 0.35 ? 0.04 : 0.015);
  } else if (role.key === "info") {
    score += getHueWindowScore(candidateHue, 260, 5) * (brandTemperature.cool > 0.45 ? 0.03 : 0.015);
    score += getHueWindowScore(candidateHue, 230, 5) * (brandTemperature.greenCyan > 0.35 ? 0.05 : 0.015);
  }

  return score;
}

function getColorSystemRoleTargetHue(role, brandProfile, fallbackHue, systemMood, referenceProfile) {
  if (role.type === "brand") {
    return fallbackHue;
  }

  const idealHue = getColorSystemRoleMoodHueTarget(role, brandProfile, fallbackHue, systemMood);
  const candidates = getColorSystemRoleHueCandidates(role);
  return candidates.reduce((bestHue, candidateHue) => {
    const candidateScore = getColorSystemSemanticHueScore(
      role,
      candidateHue,
      brandProfile,
      referenceProfile,
      systemMood,
      idealHue,
    );
    const bestScore = getColorSystemSemanticHueScore(
      role,
      bestHue,
      brandProfile,
      referenceProfile,
      systemMood,
      idealHue,
    );

    return candidateScore < bestScore ? candidateHue : bestHue;
  }, candidates[0] || idealHue);
}

function getColorSystemRoleMoodChromaMultiplier(role, systemMood) {
  const mood = systemMood || {};
  let multiplier = mood.chromaSystemBias || 1;

  if (role.key === "positive") {
    multiplier *= 1 + (mood.warmGlow || 0) * 0.02 + (mood.energyLevel || 0) * 0.02;
  } else if (role.key === "negative") {
    multiplier *= 1 + (mood.playful || 0) * 0.03 + (mood.semanticWeight || 0) * 0.02;
  } else if (role.key === "warning") {
    multiplier *= 1
      + (mood.coolFresh || 0) * 0.05
      + (mood.energyLevel || 0) * 0.035;
  } else if (role.key === "info") {
    multiplier *= 1 + (mood.coolFresh || 0) * 0.04 + (mood.technical || 0) * 0.02;
  }

  return clamp(multiplier, 0.94, 1.24);
}

function getColorSystemRoleDarkTailIdentity(role, systemMood) {
  const mood = systemMood || {};
  let identity = mood.darkTailIdentity || 0.07;

  if (role.key === "primary") {
    identity += 0.02;
  } else if (role.key === "positive") {
    identity += 0.026;
  } else if (role.key === "negative") {
    identity += 0.024;
  } else if (role.key === "warning") {
    identity += 0.024 + (mood.coolFresh || 0) * 0.014 - (mood.natural || 0) * 0.006;
  } else if (role.key === "info") {
    identity += 0.034;
  }

  return clamp(identity, 0.04, 0.2);
}

function getColorSystemRatioAtHue(profile, hue) {
  const relativeChroma = getColorSystemRelativeChromaFromAbsolute(profile.l, hue, profile.c);
  return relativeChroma > 0 ? clamp(relativeChroma / 100, 0.04, 0.94) : getColorSystemChromaRatio(profile);
}

function getColorSystemRoleCollisionStrength(role, brandProfile, hue) {
  if (role.type === "brand") {
    return 0;
  }

  const range = getColorSystemRoleHueRange(role);
  const distance = getHueDistanceDegrees(brandProfile.h, hue);
  const rangeWidth = Math.max(range.max - range.min, 1);
  const laneDistance = brandProfile.h >= range.min && brandProfile.h <= range.max
    ? 0
    : Math.min(
      getHueDistanceDegrees(brandProfile.h, range.min),
      getHueDistanceDegrees(brandProfile.h, range.max),
    );
  const distanceStrength = 1 - smoothstep(10, 34 + rangeWidth * 0.55, distance);
  const laneStrength = 1 - smoothstep(0, 22, laneDistance);

  return clamp(Math.max(distanceStrength, laneStrength * 0.86), 0, 1);
}

function getColorSystemRoleDistinctness(role, brandProfile, hue, systemMood) {
  if (role.type === "brand") {
    return {
      chromaMultiplier: 1,
      lightnessOffset: 0,
      collisionStrength: 0,
    };
  }

  const mood = systemMood || getColorSystemMood(brandProfile, getColorSystemChromaRatio(brandProfile));
  const collisionStrength = getColorSystemRoleCollisionStrength(role, brandProfile, hue);

  return {
    chromaMultiplier: 1,
    lightnessOffset: 0,
    collisionStrength,
  };
}

function getColorSystemRoleSourceRatio(role, rawRatio, brandProfile, familyTransform, hue) {
  if (role.type === "brand") {
    return rawRatio;
  }

  return clamp(rawRatio, 0.08, 0.9);
}

function createColorSystemRoleProfile(role, brandProfile, familyTransform, toneLadder) {
  const referenceProfile = getColorSystemRoleReferenceProfile(role);
  const systemMood = familyTransform && familyTransform.mood
    ? familyTransform.mood
    : getColorSystemMood(brandProfile, getColorSystemChromaRatio(brandProfile));
  if (!referenceProfile) {
    return brandProfile;
  }

  if (role.type === "brand") {
    const anchorLightness = clamp(
      Number.isFinite(brandProfile.visibleLightness) ? brandProfile.visibleLightness : brandProfile.l,
      getTintShadeLightnessRange().min,
      getTintShadeLightnessRange().max,
    );
    const sourceRatio = getColorSystemChromaRatio(brandProfile);
    return {
      ...brandProfile,
      referenceHex: referenceProfile.hex,
      sourceRatio,
      roleKey: role.key,
      hueMin: 0,
      hueMax: 360,
      anchorLightness,
      anchorSourceIndex: getColorSystemBestAnchorSourceIndex(toneLadder, brandProfile, {
        anchorLightness,
        chromaRatio: sourceRatio,
      }),
      systemMood,
      darkTailIdentity: getColorSystemRoleDarkTailIdentity(role, systemMood),
      usesSharedLightness: false,
    };
  }

  const hueRange = getColorSystemRoleHueRange(role);
  const hue = getColorSystemRoleTargetHue(role, brandProfile, referenceProfile.h, systemMood, referenceProfile);
  const lightness = referenceProfile.l;
  const referenceRatio = getColorSystemRatioAtHue(referenceProfile, hue);
  const distinctness = getColorSystemRoleDistinctness(role, brandProfile, hue, systemMood);
  const moodChromaMultiplier = getColorSystemRoleMoodChromaMultiplier(role, systemMood);
  const chromaRatioDelta = familyTransform && Number.isFinite(familyTransform.chromaRatioDelta)
    ? familyTransform.chromaRatioDelta
    : 1;
  const chromaInfluence = Number.isFinite(role.chromaInfluence) ? role.chromaInfluence : 1;
  const shiftedRatio = clamp(
    referenceRatio
      * Math.pow(chromaRatioDelta, chromaInfluence)
      * distinctness.chromaMultiplier
      * moodChromaMultiplier,
    0.08,
    0.9,
  );
  const sourceRatio = getColorSystemRoleSourceRatio(role, shiftedRatio, brandProfile, familyTransform, hue);
  const maxChroma = getColorSystemRelativeChromaMax(lightness, hue);
  const chroma = getColorSystemAbsoluteChromaFromRelative(lightness, hue, sourceRatio * 100);
  const roleHex = createColorSystemHex(lightness, chroma, hue);
  const anchorLightness = clamp(
    parseColorSystemOklch(roleHex).l + distinctness.lightnessOffset,
    getTintShadeLightnessRange().min,
    getTintShadeLightnessRange().max,
  );

  return {
    hex: roleHex,
    l: lightness,
    c: chroma,
    h: hue,
    hueMin: hueRange.min,
    hueMax: hueRange.max,
    referenceHex: referenceProfile.hex,
    sourceRatio,
    roleKey: role.key,
    lightnessOffset: distinctness.lightnessOffset,
    collisionStrength: distinctness.collisionStrength,
    anchorLightness,
    anchorSourceIndex: getColorSystemBestAnchorSourceIndex(toneLadder, {
      l: anchorLightness,
      c: chroma,
      h: hue,
      hex: roleHex,
    }, {
      anchorLightness,
      chromaRatio: sourceRatio,
    }),
    systemMood,
    darkTailIdentity: getColorSystemRoleDarkTailIdentity(role, systemMood),
    usesSharedLightness: true,
  };
}

function getColorSystemRoleLightness(roleProfile, toneStop) {
  const range = getTintShadeLightnessRange();
  const roleOffset = COLOR_SYSTEM_ROLE_LIGHTNESS_OFFSETS[roleProfile.roleKey] || 0;
  const mood = roleProfile.systemMood || {};
  const semanticSoftening = roleProfile.roleKey !== "primary"
    ? (mood.softness || 0) * 0.006 - (mood.semanticWeight || 0.5) * 0.004
    : 0;
  const offset = clamp(roleOffset + semanticSoftening + (roleProfile.lightnessOffset || 0) * 0.28, -0.04, 0.04);

  return clamp(toneStop.lightness + offset, range.min, range.max);
}

function getColorSystemLegacyRoleLightness(roleProfile, toneStop) {
  const range = getTintShadeLightnessRange();
  const anchorSourceIndex = Number.isFinite(roleProfile.anchorSourceIndex)
    ? clamp(Math.round(roleProfile.anchorSourceIndex), 0, COLOR_SYSTEM_TONE_CURVE.length - 1)
    : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  const anchorProgress = COLOR_SYSTEM_TONE_CURVE[anchorSourceIndex];
  const lowerBound = Math.min(Math.max(range.min + 0.04, 0.08), range.max - 0.02);
  const upperBound = Math.max(Math.min(range.max - 0.04, 0.96), lowerBound + 0.01);
  const fallbackProfile = parseColorSystemOklch(roleProfile.hex);
  const referenceVisibleLightness = typeof roleProfile.anchorLightness === "number"
    ? roleProfile.anchorLightness
    : clamp(roleProfile.l || (fallbackProfile ? fallbackProfile.l : 0.5), range.min, range.max);
  const anchorLightness = clamp(
    referenceVisibleLightness,
    lowerBound,
    upperBound,
  );

  if (toneStop.sourceIndex === anchorSourceIndex) {
    return clamp(referenceVisibleLightness, range.min, range.max);
  }

  if (toneStop.progress <= anchorProgress) {
    const localProgress = anchorProgress > 0 ? toneStop.progress / anchorProgress : 0;
    const easedProgress = smoothstep(0, 1, localProgress);
    return clamp(range.max - (range.max - anchorLightness) * easedProgress, range.min, range.max);
  }

  const localProgress = (toneStop.progress - anchorProgress) / Math.max(1 - anchorProgress, 0.001);
  const easedProgress = smoothstep(0, 1, localProgress);
  return clamp(anchorLightness - (anchorLightness - range.min) * easedProgress, range.min, range.max);
}

function getColorSystemToneRecipe(roleProfile, toneStop) {
  const toneIndex = clamp(toneStop.sourceIndex, 0, COLOR_SYSTEM_TONES.length - 1);
  const toneRecipes = {
    primary: {
      minChroma: [0.016, 0.025, 0.04, 0.058, 0.02, 0, 0, 0, 0, 0, 0],
      hueOffset: [0, 0, 0, 0, 0, 0, 0.25, 0.5, 0.7, 0.9, 1],
      chromaMultiplier: [1.12, 1.09, 1.075, 1.065, 1.03, 0.97, 0.96, 0.91, 0.86, 0.82, 0.78],
    },
    positive: {
      minChroma: [0.016, 0.026, 0.041, 0.058, 0.052, 0.014, 0, 0, 0, 0, 0],
      hueOffset: [4, 3, 2, 1, 0.35, 0, -0.2, -0.35, -0.5, -0.65, -0.8],
      chromaMultiplier: [1.1, 1.085, 1.075, 1.08, 1.02, 0.95, 0.94, 0.94, 0.92, 0.88, 0.84],
    },
    negative: {
      minChroma: [0.017, 0.028, 0.043, 0.061, 0.054, 0.015, 0, 0, 0, 0, 0],
      hueOffset: [3, 2.1, 1.15, 0.55, 0.15, 0, -0.15, -0.35, -0.6, -0.85, -1],
      chromaMultiplier: [1.11, 1.09, 1.08, 1.075, 1.04, 0.96, 0.95, 0.95, 0.93, 0.9, 0.86],
    },
    warning: {
      minChroma: [0.018, 0.029, 0.046, 0.064, 0.056, 0.016, 0, 0, 0, 0, 0],
      hueOffset: [3.5, 2.5, 1.3, 0.6, 0.15, 0, -0.55, -1.2, -1.8, -2.3, -2.8],
      chromaMultiplier: [1.09, 1.08, 1.075, 1.085, 1.08, 1.03, 1.02, 1.02, 0.98, 0.94, 0.88],
    },
    info: {
      minChroma: [0.019, 0.03, 0.046, 0.062, 0.054, 0.016, 0, 0, 0, 0, 0],
      hueOffset: [-5, -3.5, -2, -0.8, -0.2, 0, 0.45, 0.9, 1.35, 1.8, 2.2],
      chromaMultiplier: [1.12, 1.095, 1.08, 1.085, 1.04, 0.97, 0.97, 0.98, 0.96, 0.92, 0.88],
    },
  };
  const recipe = toneRecipes[roleProfile.roleKey] || toneRecipes.primary;
  const mood = roleProfile.systemMood || {};
  const softnessGuard = toneIndex <= 4 ? 1 - (mood.softness || 0) * 0.08 : 1;
  const vividGuard = toneIndex <= 4 ? 1 + (mood.vividness || 0) * 0.035 : 1;
  const sourceRatio = clamp(roleProfile.sourceRatio || getColorSystemChromaRatio(roleProfile), 0.04, 0.94);
  const minChromaGovernor = clamp(
    0.66
      + sourceRatio * 0.42
      + (mood.energyLevel || 0) * 0.08
      - (mood.softness || 0) * 0.04,
    0.7,
    1.12,
  );
  const vividModernWarning = clamp(
    (mood.coolFresh || 0) * 0.5
      + (mood.energyLevel || 0) * 0.34
      + (mood.modern || 0) * 0.22
      - (mood.natural || 0) * 0.28
      - (mood.elegant || 0) * 0.18,
    0,
    1,
  );
  const roleHarmonyChroma = roleProfile.roleKey === "warning"
    ? clamp(
      1
        + vividModernWarning * 0.16
        + (mood.semanticWeight || 0) * 0.035
        + smoothstep(5.5, 8, toneIndex) * 0.035,
      1,
      1.2,
    )
    : 1;
  const hueOffset = recipe.hueOffset[toneIndex] || 0;
  const hasFixedHueRange = roleProfile.roleKey !== "primary";
  const range = hasFixedHueRange
    ? getColorSystemRoleHueRange({
      targetHue: roleProfile.h,
      hueMin: roleProfile.hueMin,
      hueMax: roleProfile.hueMax,
    })
    : null;
  const rawHue = roleProfile.h + hueOffset;
  const hue = range
    ? clamp(rawHue, range.min, range.max)
    : ((rawHue % 360) + 360) % 360;

  return {
    hue,
    minChroma: (recipe.minChroma[toneIndex] || 0) * softnessGuard * vividGuard * minChromaGovernor,
    chromaMultiplier: (recipe.chromaMultiplier[toneIndex] || 1) * roleHarmonyChroma,
  };
}

function getColorSystemRoleChromaCeiling(roleProfile, toneIndex) {
  const ceilings = COLOR_SYSTEM_ROLE_CHROMA_CEILINGS[roleProfile.roleKey] || COLOR_SYSTEM_ROLE_CHROMA_CEILINGS.primary;
  const baseCeiling = ceilings[toneIndex] || ceilings[ceilings.length - 1] || 0.5;
  const mood = roleProfile.systemMood || {};
  const sourceRatio = clamp(roleProfile.sourceRatio || getColorSystemChromaRatio(roleProfile), 0.04, 0.94);
  const shadeBoost = getColorSystemShadeChromaBoost(toneIndex);
  const sourceGovernor = clamp(0.76 + sourceRatio * 0.34, 0.78, 1.08);
  const energyGovernor = clamp(
    1
      + (mood.energyLevel || 0) * 0.12
      + (mood.semanticWeight || 0) * 0.04
      - (mood.softness || 0) * 0.035,
    0.9,
    1.16,
  );
  let roleGovernor = 1;

  if (roleProfile.roleKey === "warning") {
    const vividModernWarning = clamp(
      (mood.coolFresh || 0) * 0.5
        + (mood.energyLevel || 0) * 0.34
        + (mood.modern || 0) * 0.22
        - (mood.natural || 0) * 0.28
        - (mood.elegant || 0) * 0.18,
      0,
      1,
    );
    roleGovernor += vividModernWarning * 0.12 + (mood.energyLevel || 0) * 0.04;
  } else if (roleProfile.roleKey === "info") {
    roleGovernor += (mood.technical || 0) * 0.025;
  } else if (roleProfile.roleKey === "positive") {
    roleGovernor += 0;
  } else if (roleProfile.roleKey === "negative") {
    roleGovernor += (mood.semanticWeight || 0) * 0.025;
  }

  return clamp(baseCeiling * sourceGovernor * energyGovernor * roleGovernor * shadeBoost, 0.06, 0.88);
}

function getColorSystemShadeChromaBoost(toneIndex) {
  return 1 + (COLOR_SYSTEM_SHADE_CHROMA_BOOST - 1) * smoothstep(
    COLOR_SYSTEM_SHADE_START_TONE_INDEX - 1,
    COLOR_SYSTEM_TONES.length - 1,
    toneIndex,
  );
}

function getColorSystemDarkTailChromaFloor(roleProfile, toneIndex, toneStop) {
  if (toneIndex < COLOR_SYSTEM_SHADE_START_TONE_INDEX) {
    return 0;
  }

  const mood = roleProfile.systemMood || {};
  const sourceRatio = clamp(roleProfile.sourceRatio || getColorSystemChromaRatio(roleProfile), 0.04, 0.94);
  const darkTailProgress = smoothstep(0.58, 1, toneStop.progress);
  const floors = {
    primary: [0, 0, 0, 0, 0, 0, 0, 0.34, 0.28, 0.22, 0.17],
    positive: [0, 0, 0, 0, 0, 0, 0, 0.32, 0.26, 0.2, 0.16],
    negative: [0, 0, 0, 0, 0, 0, 0, 0.34, 0.28, 0.22, 0.17],
    warning: [0, 0, 0, 0, 0, 0, 0, 0.3, 0.24, 0.19, 0.15],
    info: [0, 0, 0, 0, 0, 0, 0, 0.36, 0.3, 0.24, 0.19],
  };
  const roleFloors = floors[roleProfile.roleKey] || floors.primary;
  const baseFloor = roleFloors[toneIndex] || 0;
  const moodGovernor = clamp(
    0.82
      + sourceRatio * 0.26
      + (mood.energyLevel || 0) * 0.08
      + (mood.darkTailIdentity || 0) * 0.95
      - (mood.softness || 0) * 0.03,
    0.82,
    1.16,
  );
  let roleGovernor = 1;

  if (roleProfile.roleKey === "warning") {
    roleGovernor += (mood.energyLevel || 0) * 0.025;
  } else if (roleProfile.roleKey === "info") {
    roleGovernor += (mood.technical || 0) * 0.04 + (mood.coolFresh || 0) * 0.04;
  } else if (roleProfile.roleKey === "negative") {
    roleGovernor += (mood.semanticWeight || 0) * 0.035;
  }

  return clamp(baseFloor * moodGovernor * roleGovernor * darkTailProgress * COLOR_SYSTEM_SHADE_CHROMA_FLOOR_BOOST, 0, 0.48);
}

function getColorSystemUnifiedChromaArc(roleProfile, toneStop) {
  const mood = roleProfile.systemMood || {};
  const toneIndex = clamp(toneStop.sourceIndex, 0, COLOR_SYSTEM_TONES.length - 1);
  const sourceRatio = clamp(roleProfile.sourceRatio || getColorSystemChromaRatio(roleProfile), 0.04, 0.94);
  const anchorSourceIndex = Number.isFinite(roleProfile.anchorSourceIndex)
    ? roleProfile.anchorSourceIndex
    : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  const peakIndex = clamp(anchorSourceIndex, 4.4, 5.9);
  const tintProgress = smoothstep(0, peakIndex, toneIndex);
  const shadeProgress = smoothstep(peakIndex, COLOR_SYSTEM_TONES.length - 1, toneIndex);
  const tintStart = clamp(
    0.15
      + sourceRatio * 0.05
      + (mood.energyLevel || 0) * 0.015
      - (mood.softness || 0) * 0.015,
    0.12,
    0.24,
  );
  const peakStrength = clamp(
    0.82
      + sourceRatio * 0.1
      + (mood.vividness || 0) * 0.035
      + (mood.energyLevel || 0) * 0.025
      - (mood.softness || 0) * 0.015,
    0.78,
    0.96,
  );
  const tailEnd = clamp(
    0.2
      + sourceRatio * 0.08
      + (roleProfile.darkTailIdentity || 0.08) * 0.7
      + (mood.energyLevel || 0) * 0.02
      - (mood.softness || 0) * 0.01,
    0.2,
    0.36,
  );
  const risingArc = tintStart + (peakStrength - tintStart) * tintProgress;
  const fallingArc = tailEnd + (peakStrength - tailEnd) * (1 - shadeProgress);
  const coreBlend = smoothstep(peakIndex - 0.65, peakIndex + 0.65, toneIndex);
  const corePlateau = smoothstep(3.6, 4.85, toneIndex) * (1 - smoothstep(5.85, 7.1, toneIndex));
  const plateauSoftener = corePlateau * clamp(0.02 + (mood.softness || 0) * 0.015, 0.015, 0.045);
  const roleMidTemper = 0;

  return clamp(
    (risingArc * (1 - coreBlend) + fallingArc * coreBlend - plateauSoftener - roleMidTemper * corePlateau)
      * sourceRatio,
    0.02,
    0.94,
  );
}

function getColorSystemToneChromaRatio(roleProfile, toneStop) {
  const toneIndex = clamp(toneStop.sourceIndex, 0, COLOR_SYSTEM_TONES.length - 1);
  const chromaRatio = getColorSystemUnifiedChromaArc(roleProfile, toneStop);
  const toneRecipe = getColorSystemToneRecipe(roleProfile, toneStop);
  const recipeMultiplier = 1 + ((toneRecipe.chromaMultiplier || 1) - 1) * 0.45;
  const rawRatio = chromaRatio * recipeMultiplier;
  const chromaCeiling = getColorSystemRoleChromaCeiling(roleProfile, toneIndex);
  const darkTailFloor = getColorSystemDarkTailChromaFloor(roleProfile, toneIndex, toneStop);
  const cappedFloor = Math.min(darkTailFloor, chromaCeiling * 0.92);
  const shadeBoost = getColorSystemShadeChromaBoost(toneIndex);
  const finalRatio = Math.max(Math.min(rawRatio * shadeBoost, chromaCeiling), cappedFloor);

  return clamp(finalRatio, 0.02, 0.94);
}

function getColorSystemActualChromaRatio(hex, lightness, hue, fallbackRatio) {
  const profile = parseColorSystemOklch(hex);
  const safeLightness = Number.isFinite(lightness)
    ? lightness
    : profile
      ? profile.l
      : 0.5;
  const safeHue = Number.isFinite(hue)
    ? hue
    : profile
      ? profile.h
      : 0;
  const maxChroma = getColorSystemRelativeChromaMax(safeLightness, safeHue);

  if (!profile || maxChroma <= 0) {
    return clamp(Number.isFinite(fallbackRatio) ? fallbackRatio : 0.04, 0.02, 0.94);
  }

  return clamp(getColorSystemRelativeChromaFromAbsolute(safeLightness, safeHue, profile.c) / 100, 0.02, 0.94);
}

function updateColorSystemPointColor(point, nextChromaRatio) {
  if (!point || point.isHexAnchor) {
    return point;
  }

  const range = getTintShadeLightnessRange();
  const pointLightness = clamp(
    Number.isFinite(point.pointLightness) ? point.pointLightness : point.lightness / 100,
    range.min,
    range.max,
  );
  const pointHue = Number.isFinite(point.hue) ? point.hue : 0;
  const chromaCeiling = Number.isFinite(point.chromaCeiling) ? point.chromaCeiling : 0.94;
  const chromaRatio = clamp(nextChromaRatio, 0.02, chromaCeiling);
  const generatedColor = createColorSystemHexForPerceptualLightness(pointLightness, chromaRatio, pointHue, {
    minChroma: point.minChroma,
  });
  const hex = generatedColor.hex;
  const visibleLightness = clamp(generatedColor.visibleLightness, range.min, range.max);
  const actualChromaRatio = getColorSystemActualChromaRatio(hex, pointLightness, pointHue, chromaRatio);
  const relativeChromaMax = getColorSystemRelativeChromaMax(pointLightness, pointHue);
  const relativeChroma = actualChromaRatio * 100;

  return {
    ...point,
    hex,
    y: clamp((1 - visibleLightness) * SCALE_SPECTRUM_SIZE, 0, SCALE_SPECTRUM_SIZE),
    lightness: visibleLightness * 100,
    chromaRatio: actualChromaRatio,
    targetChromaRatio: chromaRatio,
    relativeChroma,
    targetRelativeChroma: chromaRatio * 100,
    relativeChromaMax,
    relativeChromaGamut: COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT,
    contrastOnWhite: getColorSystemContrast(hex, "#FFFFFF"),
    contrastOnBlack: getColorSystemContrast(hex, "#000000"),
  };
}

function getColorSystemContinuityCorrectedRatio(currentRatio, targetRatio, options = {}) {
  const threshold = Number.isFinite(options.threshold) ? options.threshold : 0.024;
  const strength = Number.isFinite(options.strength) ? options.strength : 0.28;
  const maxDelta = Number.isFinite(options.maxDelta) ? options.maxDelta : 0.04;
  const delta = targetRatio - currentRatio;

  if (Math.abs(delta) <= threshold) {
    return currentRatio;
  }

  return clamp(currentRatio + clamp(delta * strength, -maxDelta, maxDelta), 0.02, 0.94);
}

function refineColorSystemRowContinuity(points) {
  return points.map((point, index) => {
    if (index <= 0 || index >= points.length - 1 || point.isHexAnchor) {
      return point;
    }

    const previousPoint = points[index - 1];
    const nextPoint = points[index + 1];
    const expectedRatio = (previousPoint.chromaRatio + nextPoint.chromaRatio) / 2;
    const middleWeight = smoothstep(2, 4, point.toneIndex) * (1 - smoothstep(6, 8, point.toneIndex));
    const correctedRatio = getColorSystemContinuityCorrectedRatio(point.chromaRatio, expectedRatio, {
      threshold: 0.022,
      strength: 0.22 + middleWeight * 0.18,
      maxDelta: 0.026 + middleWeight * 0.022,
    });

    return updateColorSystemPointColor(point, correctedRatio);
  });
}

function refineColorSystemColumnContinuity(groups) {
  const pointCount = Math.max(...groups.map((group) => group.points.length));

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const columnPoints = groups
      .map((group) => group.points[pointIndex])
      .filter((point) => point && !point.isHexAnchor);

    if (columnPoints.length < 3) {
      continue;
    }

    const sortedRatios = columnPoints
      .map((point) => point.chromaRatio)
      .sort((a, b) => a - b);
    const medianRatio = sortedRatios[Math.floor(sortedRatios.length / 2)];

    groups.forEach((group) => {
      const point = group.points[pointIndex];
      if (!point || point.isHexAnchor) {
        return;
      }

      const semanticStrength = point.role === "primary" ? 0.08 : 0.14;
      const correctedRatio = getColorSystemContinuityCorrectedRatio(point.chromaRatio, medianRatio, {
        threshold: 0.045,
        strength: semanticStrength,
        maxDelta: 0.022,
      });

      group.points[pointIndex] = updateColorSystemPointColor(point, correctedRatio);
    });
  }

  return groups;
}

function refineColorSystemContinuity(groups) {
  return groups.map((group) => ({
    ...group,
    points: refineColorSystemRowContinuity(group.points),
  }));
}

function createColorSystemPoint(role, roleProfile, toneStop) {
  const pointLightness = getColorSystemRoleLightness(roleProfile, toneStop);
  const chromaRatio = getColorSystemToneChromaRatio(roleProfile, toneStop);
  const toneRecipe = getColorSystemToneRecipe(roleProfile, toneStop);
  const chromaCeiling = getColorSystemRoleChromaCeiling(roleProfile, toneStop.sourceIndex);
  const pointHue = toneRecipe.hue;
  const isAnchorTone = toneStop.sourceIndex === roleProfile.anchorSourceIndex;
  const range = getTintShadeLightnessRange();
  const referenceVisibleLightness = getVisibleLightnessFromHex(roleProfile.hex);
  const shouldUseReferenceHex = !roleProfile.usesSharedLightness
    && isAnchorTone
    && referenceVisibleLightness >= range.min
    && referenceVisibleLightness <= range.max;
  const generatedColor = shouldUseReferenceHex
    ? {
      hex: roleProfile.hex,
      visibleLightness: referenceVisibleLightness,
    }
    : createColorSystemHexForPerceptualLightness(pointLightness, chromaRatio, pointHue, {
      minChroma: toneRecipe.minChroma,
    });
  const hex = generatedColor.hex;
  const visibleLightness = clamp(generatedColor.visibleLightness, range.min, range.max);
  const actualChromaRatio = getColorSystemActualChromaRatio(hex, pointLightness, pointHue, chromaRatio);
  const relativeChromaMax = getColorSystemRelativeChromaMax(pointLightness, pointHue);
  const relativeChroma = actualChromaRatio * 100;

  return {
    x: SCALE_SPECTRUM_SIZE / 2,
    y: clamp((1 - visibleLightness) * SCALE_SPECTRUM_SIZE, 0, SCALE_SPECTRUM_SIZE),
    hex,
    lightness: visibleLightness * 100,
    isHexAnchor: role.type === "brand" && shouldUseReferenceHex,
    role: role.key,
    tone: toneStop.tone,
    toneIndex: toneStop.sourceIndex,
    pointLightness,
    hue: pointHue,
    minChroma: toneRecipe.minChroma,
    chromaRatio: actualChromaRatio,
    targetChromaRatio: chromaRatio,
    relativeChroma,
    targetRelativeChroma: chromaRatio * 100,
    relativeChromaMax,
    relativeChromaGamut: COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT,
    chromaCeiling,
    contrastOnWhite: getColorSystemContrast(hex, "#FFFFFF"),
    contrastOnBlack: getColorSystemContrast(hex, "#000000"),
  };
}

function getTintShadeAnchorProfile() {
  const profile = parseColorSystemOklch(getTintShadeAnchorHex());
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    oklch: {
      l: profile.l,
      c: profile.c,
      h: profile.h,
    },
    visibleLightness: profile.l,
  };
}

function createLockedRelativeTintShadePoint(role, toneStop, options) {
  const roleAnchorProfile = options.roleAnchorProfile || options.brandProfile;
  const roleHue = normalizeColorSystemHue(roleAnchorProfile.h);
  const toneRelativeChroma = getTintShadeToneRelativeChroma(options.relativeChroma, toneStop, {
    anchorSourceIndex: options.anchorSourceIndex,
  });
  const toneHue = getTintShadeToneHue(roleHue, toneStop, options.anchorSourceIndex, toneRelativeChroma);
  const range = getTintShadeLightnessRange();
  const isPrimary = role.type === "brand";
  const isLockedAnchorTone = Boolean(
    options.lockAnchor
      && toneStop.sourceIndex === options.anchorSourceIndex
      && roleAnchorProfile.l >= range.min
      && roleAnchorProfile.l <= range.max
  );
  const generatedColor = isLockedAnchorTone
    ? {
      hex: roleAnchorProfile.hex,
      visibleLightness: roleAnchorProfile.l,
      relativeChroma: options.relativeChroma,
      targetRelativeChroma: options.relativeChroma,
      relativeChromaMax: getColorSystemRelativeChromaMax(roleAnchorProfile.l, roleAnchorProfile.h),
      relativeChromaGamut: COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT,
    }
    : createTintShadeRelativeChromaColor(toneStop.lightness, toneHue, toneRelativeChroma);
  const visibleLightness = clamp(generatedColor.visibleLightness, range.min, range.max);
  const pointLightness = isLockedAnchorTone ? roleAnchorProfile.l : toneStop.lightness;
  const pointHue = isLockedAnchorTone ? roleAnchorProfile.h : toneHue;
  const actualRelativeChroma = Number.isFinite(generatedColor.relativeChroma)
    ? generatedColor.relativeChroma
    : getColorSystemActualChromaRatio(generatedColor.hex, pointLightness, pointHue, toneRelativeChroma / 100) * 100;

  return {
    x: SCALE_SPECTRUM_SIZE / 2,
    y: clamp((1 - visibleLightness) * SCALE_SPECTRUM_SIZE, 0, SCALE_SPECTRUM_SIZE),
    hex: generatedColor.hex,
    lightness: visibleLightness * 100,
    isHexAnchor: isPrimary && isLockedAnchorTone,
    isRoleAnchor: isLockedAnchorTone,
    role: role.key,
    tone: toneStop.tone,
    toneIndex: toneStop.sourceIndex,
    pointLightness,
    hue: pointHue,
    minChroma: 0,
    chromaRatio: actualRelativeChroma / 100,
    targetChromaRatio: toneRelativeChroma / 100,
    relativeChroma: actualRelativeChroma,
    targetRelativeChroma: toneRelativeChroma,
    relativeChromaMax: generatedColor.relativeChromaMax,
    relativeChromaGamut: generatedColor.relativeChromaGamut,
    roleAnchorHex: roleAnchorProfile.roleAnchorHex || roleAnchorProfile.hex,
    roleAnchorType: roleAnchorProfile.roleAnchorType,
    chromaCeiling: 1,
    contrastOnWhite: getColorSystemContrast(generatedColor.hex, "#FFFFFF"),
    contrastOnBlack: getColorSystemContrast(generatedColor.hex, "#000000"),
  };
}

function createTintShadeRoleTonePointFromPrimary(role, toneStop, primaryPoint, options) {
  const roleAnchorProfile = options.roleAnchorProfile;
  const roleHue = normalizeColorSystemHue(roleAnchorProfile.h);
  const range = getTintShadeLightnessRange();
  const primaryLightness = clamp(
    Number.isFinite(primaryPoint.pointLightness)
      ? primaryPoint.pointLightness
      : primaryPoint.lightness / 100,
    range.min,
    range.max,
  );
  const roleLightness = getColorSystemRoleToneLightness(role, primaryLightness, toneStop, {
    anchorSourceIndex: options.anchorSourceIndex,
    primaryAnchorLightness: options.primaryAnchorLightness,
    roleAnchorProfile,
  });
  const roleRelativeChroma = getColorSystemRoleToneRelativeChroma(
    options.roleRelativeChroma,
    toneStop,
    options.anchorSourceIndex,
  );
  const roleToneHue = getTintShadeToneHue(roleHue, toneStop, options.anchorSourceIndex, roleRelativeChroma);
  const isRoleAnchorTone = toneStop.sourceIndex === options.anchorSourceIndex;
  const generatedColor = createTintShadeRelativeChromaColor(roleLightness, roleToneHue, roleRelativeChroma);
  const visibleLightness = clamp(generatedColor.visibleLightness, range.min, range.max);
  const pointLightness = roleLightness;
  const pointHue = roleToneHue;
  const actualRelativeChroma = Number.isFinite(generatedColor.relativeChroma)
    ? generatedColor.relativeChroma
    : getColorSystemActualChromaRatio(generatedColor.hex, pointLightness, pointHue, roleRelativeChroma / 100) * 100;
  const targetRelativeChroma = Number.isFinite(generatedColor.targetRelativeChroma)
    ? generatedColor.targetRelativeChroma
    : roleRelativeChroma;

  return {
    x: SCALE_SPECTRUM_SIZE / 2,
    y: clamp((1 - visibleLightness) * SCALE_SPECTRUM_SIZE, 0, SCALE_SPECTRUM_SIZE),
    hex: generatedColor.hex,
    lightness: visibleLightness * 100,
    isHexAnchor: false,
    isRoleAnchor: isRoleAnchorTone,
    role: role.key,
    tone: toneStop.tone,
    toneIndex: toneStop.sourceIndex,
    pointLightness,
    hue: pointHue,
    minChroma: 0,
    chromaRatio: actualRelativeChroma / 100,
    targetChromaRatio: targetRelativeChroma / 100,
    relativeChroma: actualRelativeChroma,
    targetRelativeChroma,
    relativeChromaMax: generatedColor.relativeChromaMax,
    relativeChromaGamut: generatedColor.relativeChromaGamut,
    roleAnchorHex: roleAnchorProfile.roleAnchorHex || roleAnchorProfile.hex,
    roleAnchorType: roleAnchorProfile.roleAnchorType,
    followsPrimaryTone: primaryPoint.tone,
    chromaCeiling: 1,
    contrastOnWhite: getColorSystemContrast(generatedColor.hex, "#FFFFFF"),
    contrastOnBlack: getColorSystemContrast(generatedColor.hex, "#000000"),
  };
}

function getTintShadeNewAnchorProfile() {
  const profile = parseColorSystemOklch(getTintShadeAnchorHex());
  if (!profile) {
    return null;
  }

  const visibleLightness = getVisibleLightnessFromHex(profile.hex);
  const boundedVisibleLightness = clamp(
    visibleLightness,
    TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MIN,
    TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MAX,
  );
  const relativeChromaMax = getColorSystemRelativeChromaMax(profile.l, profile.h);
  const relativeChroma = relativeChromaMax > 0
    ? clamp((profile.c / relativeChromaMax) * 100, 0, 100)
    : 0;

  const anchorProfile = {
    ...profile,
    visibleLightness,
    boundedVisibleLightness,
    relativeChroma,
    relativeChromaMax,
    relativeChromaGamut: COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT,
  };
  const familyMatch = getTintShadeNewFamilyMatch(anchorProfile);
  const sourceTruthRamp = getTintShadeNewPrimarySourceTruthRamp({
    ...anchorProfile,
    roleKey: "primary",
  });

  return {
    ...anchorProfile,
    familyMatch,
    familyKey: familyMatch ? familyMatch.familyKey : null,
    familyLabel: sourceTruthRamp && sourceTruthRamp.label
      ? sourceTruthRamp.label
      : familyMatch ? familyMatch.familyLabel : null,
    anchorToneIndex: sourceTruthRamp && Number.isFinite(sourceTruthRamp.anchorToneIndex)
      ? sourceTruthRamp.anchorToneIndex
      : undefined,
    anchorTone: sourceTruthRamp && Number.isFinite(sourceTruthRamp.anchorToneIndex)
      ? COLOR_SYSTEM_TONES[sourceTruthRamp.anchorToneIndex]
      : undefined,
  };
}

function getTintShadeNewFamilyByKey(familyKey) {
  return TINT_SHADE_NEW_FAMILY_PROFILES.find((family) => family.key === familyKey)
    || TINT_SHADE_NEW_FAMILY_PROFILES.find((family) => family.key === "blue")
    || TINT_SHADE_NEW_FAMILY_PROFILES[0];
}

function getTintShadeNewPrimarySourceTruthRamp(anchorProfile) {
  if (!anchorProfile || anchorProfile.roleKey !== "primary") {
    return null;
  }

  const anchorHex = normalizeHexInputValue(anchorProfile.hex);
  return anchorHex ? TINT_SHADE_NEW_PRIMARY_SOURCE_TRUTH_RAMPS[anchorHex] || null : null;
}

function getTintShadeNewPrimarySourceTruthToneHex(anchorProfile, toneStop) {
  const sourceTruthRamp = getTintShadeNewPrimarySourceTruthRamp(anchorProfile);

  if (!sourceTruthRamp || !toneStop) {
    return "";
  }

  const anchorToneIndex = Number.isFinite(sourceTruthRamp.anchorToneIndex)
    ? sourceTruthRamp.anchorToneIndex
    : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  const anchorExactHex = normalizeHexInputValue(sourceTruthRamp.exactHexes && sourceTruthRamp.exactHexes[anchorToneIndex]);

  if (!anchorExactHex || normalizeHexInputValue(anchorProfile.hex) !== anchorExactHex) {
    return "";
  }

  return normalizeHexInputValue(sourceTruthRamp.exactHexes[toneStop.sourceIndex]) || "";
}

function getTintShadeNewExactFamilyToneHex(anchorProfile, toneStop) {
  if (!anchorProfile || !toneStop || anchorProfile.roleKey !== "primary") {
    return "";
  }

  const sourceTruthToneHex = getTintShadeNewPrimarySourceTruthToneHex(anchorProfile, toneStop);
  if (sourceTruthToneHex) {
    return sourceTruthToneHex;
  }

  const family = anchorProfile.familyMatch && anchorProfile.familyMatch.family
    ? anchorProfile.familyMatch.family
    : getTintShadeNewFamilyByKey(anchorProfile.familyKey);
  const exactHexes = family && Array.isArray(family.exactHexes) ? family.exactHexes : null;

  if (!exactHexes) {
    return "";
  }

  const anchorToneIndex = Number.isFinite(anchorProfile.anchorToneIndex)
    ? anchorProfile.anchorToneIndex
    : anchorProfile.familyMatch && Number.isFinite(anchorProfile.familyMatch.sourceIndex)
      ? anchorProfile.familyMatch.sourceIndex
      : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  const anchorExactHex = normalizeHexInputValue(exactHexes[anchorToneIndex]);

  if (!anchorExactHex || normalizeHexInputValue(anchorProfile.hex) !== anchorExactHex) {
    return "";
  }

  return normalizeHexInputValue(exactHexes[toneStop.sourceIndex]) || "";
}

function createTintShadeNewExactFamilyColor(hex) {
  const normalizedHex = normalizeHexInputValue(hex);
  const profile = normalizedHex ? parseColorSystemOklch(normalizedHex) : null;

  if (!normalizedHex || !profile) {
    return null;
  }

  const relativeChromaMax = getColorSystemRelativeChromaMax(profile.l, profile.h);
  const relativeChroma = relativeChromaMax > 0
    ? getColorSystemRelativeChromaFromAbsolute(profile.l, profile.h, profile.c)
    : 0;

  return {
    hex: normalizedHex,
    hue: profile.h,
    visibleLightness: getVisibleLightnessFromHex(normalizedHex),
    oklchLightness: profile.l,
    relativeChroma,
    targetRelativeChroma: relativeChroma,
    relativeChromaMax,
    relativeChromaGamut: COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT,
  };
}

function getTintShadeNewFamilyHslLightnessRange(family) {
  const configuredRange = TINT_SHADE_NEW_FAMILY_HSL_LIGHTNESS_RANGES[family.key];
  if (configuredRange) {
    return configuredRange;
  }

  return {
    max: TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MAX,
    min: TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MIN,
  };
}

function getTintShadeNewFamilyStyleHint(familyKey) {
  return TINT_SHADE_NEW_FAMILY_STYLE_HINTS[familyKey] || {
    temperature: 0,
    vividness: 0.5,
    softness: 0.5,
    earthiness: 0.1,
    depth: 0.45,
  };
}

function getTintShadeNewPrimaryStyle(primaryProfile) {
  const familyKey = primaryProfile.familyKey
    || (primaryProfile.familyMatch ? primaryProfile.familyMatch.familyKey : "");
  const familyHint = getTintShadeNewFamilyStyleHint(familyKey);
  const anchorIndex = primaryProfile.familyMatch
    ? primaryProfile.familyMatch.sourceIndex
    : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  const anchorTemplate = primaryProfile.familyMatch
    ? primaryProfile.familyMatch.template
    : null;
  const chromaIntensity = clamp(primaryProfile.relativeChroma / 100, 0, 1);
  const lightnessDelta = anchorTemplate
    ? clamp(primaryProfile.visibleLightness - anchorTemplate.visibleLightness, -0.28, 0.28)
    : 0;
  const depthFromTone = clamp((anchorIndex - 3) / 7, 0, 1);
  const depthFromLightness = clamp((0.64 - primaryProfile.visibleLightness) / 0.46, 0, 1);
  const muted = 1 - chromaIntensity;

  return {
    familyKey,
    temperature: familyHint.temperature,
    sourceRelativeChroma: primaryProfile.relativeChroma,
    chromaIntensity,
    mutedness: muted,
    vividness: clamp(chromaIntensity * 0.68 + familyHint.vividness * 0.32, 0, 1),
    softness: clamp(muted * 0.62 + Math.max(lightnessDelta, 0) * 1.2 + familyHint.softness * 0.22, 0, 1),
    earthiness: clamp(familyHint.earthiness * 0.65 + muted * 0.28 + depthFromTone * 0.12, 0, 1),
    depth: clamp(depthFromTone * 0.42 + depthFromLightness * 0.42 + familyHint.depth * 0.16, 0, 1),
    visibleLightness: primaryProfile.visibleLightness,
    lightnessDelta,
    hueShift: anchorTemplate
      ? clamp(getColorSystemSignedHueDelta(primaryProfile.h, anchorTemplate.h), -18, 18)
      : 0,
  };
}

function getTintShadeNewStatusRoleVariation(roleKey) {
  return TINT_SHADE_NEW_STATUS_ROLE_VARIATION_PROFILE[roleKey]
    || TINT_SHADE_NEW_STATUS_ROLE_VARIATION_PROFILE.info;
}

function isTintShadeNewHueInRange(hue, minHue, maxHue) {
  const normalizedHue = normalizeColorSystemHue(hue);
  const normalizedMin = normalizeColorSystemHue(minHue);
  const normalizedMax = normalizeColorSystemHue(maxHue);

  if (normalizedMin <= normalizedMax) {
    return normalizedHue >= normalizedMin && normalizedHue <= normalizedMax;
  }

  return normalizedHue >= normalizedMin || normalizedHue <= normalizedMax;
}

function clampTintShadeNewHueToRange(hue, minHue, maxHue) {
  const normalizedHue = normalizeColorSystemHue(hue);
  if (isTintShadeNewHueInRange(normalizedHue, minHue, maxHue)) {
    return normalizedHue;
  }

  const normalizedMin = normalizeColorSystemHue(minHue);
  const normalizedMax = normalizeColorSystemHue(maxHue);
  return getColorSystemHueDistance(normalizedHue, normalizedMin) <= getColorSystemHueDistance(normalizedHue, normalizedMax)
    ? normalizedMin
    : normalizedMax;
}

function getTintShadeNewStatusRoleTargetHue(roleKey, primaryProfile, primaryStyle, refreshSeed = 0) {
  const variation = getTintShadeNewStatusRoleVariation(roleKey);
  const temperature = clamp(primaryStyle.temperature || 0, -1, 1);
  const signedLaneDelta = temperature >= 0
    ? getColorSystemSignedHueDelta(variation.warmHue, variation.baseHue)
    : getColorSystemSignedHueDelta(variation.coolHue, variation.baseHue);
  const adaptiveHue = variation.baseHue + signedLaneDelta * Math.abs(temperature) * variation.adaptability;
  const seededOffset = getTintShadeNewSeedSignedJitter(refreshSeed, roleKey, variation.seedHueJitter || 0, 31);
  const primaryDistance = getColorSystemHueDistance(primaryProfile.h, adaptiveHue);
  const collisionRisk = 1 - smoothstep(variation.collisionMin, variation.collisionMax, primaryDistance);
  const collisionDirection = getColorSystemSignedHueDelta(adaptiveHue, primaryProfile.h) >= 0 ? 1 : -1;
  const collisionOffset = collisionRisk * (variation.collisionPush || 0) * collisionDirection;
  const hue = normalizeColorSystemHue(
    adaptiveHue + seededOffset + collisionOffset,
  );
  return clampTintShadeNewHueToRange(hue, variation.minHue, variation.maxHue);
}

function getTintShadeNewStatusRoleFamilies(roleKey) {
  const matchingFamilies = TINT_SHADE_NEW_FAMILY_PROFILES.filter((family) => family.statusRole === roleKey);
  if (matchingFamilies.length) {
    return matchingFamilies;
  }

  return TINT_SHADE_NEW_FAMILY_PROFILES.filter((family) => !family.neutral).slice(0, 3);
}

function getTintShadeNewStatusRoleFamilyOrderIndex(roleKey, familyKey) {
  const roleFamilyOrder = TINT_SHADE_NEW_STATUS_ROLE_FAMILY_ORDER[roleKey] || [];
  const explicitIndex = roleFamilyOrder.indexOf(familyKey);
  return explicitIndex >= 0 ? explicitIndex : roleFamilyOrder.length + 1;
}

function getTintShadeNewStatusFamilyScore(family, primaryStyle, primaryProfile, roleKey, targetHue) {
  const candidateStyle = getTintShadeNewFamilyStyleHint(family.key);
  const sourceIndex = getTintShadeNewStatusCoreToneIndex(roleKey);
  const template = getTintShadeNewFamilyToneTemplate(family, sourceIndex);
  const variation = getTintShadeNewStatusRoleVariation(roleKey);
  const hueLaneDistance = getColorSystemHueDistance(template.h, targetHue) / 180;
  const primaryDistance = getColorSystemHueDistance(primaryProfile.h, template.h);
  const collisionRisk = 1 - smoothstep(variation.collisionMin, variation.collisionMax, primaryDistance);
  const styleDistance = Math.abs(candidateStyle.temperature - primaryStyle.temperature) * 0.36
    + Math.abs(candidateStyle.vividness - primaryStyle.vividness) * 0.22
    + Math.abs(candidateStyle.softness - primaryStyle.softness) * 0.2
    + Math.abs(candidateStyle.earthiness - primaryStyle.earthiness) * 0.15
    + Math.abs(candidateStyle.depth - primaryStyle.depth) * 0.1;

  return hueLaneDistance * 0.84
    + styleDistance
    + collisionRisk * variation.collisionWeight;
}

function getTintShadeNewFamilyForStatusRole(roleKey, primaryProfile, primaryStyle, targetHue, refreshSeed = 0) {
  const candidates = getTintShadeNewStatusRoleFamilies(roleKey);
  if (!candidates.length) {
    return getTintShadeNewFamilyByKey("blue");
  }

  const rankedFamilies = candidates
    .map((family) => ({
      family,
      score: getTintShadeNewStatusFamilyScore(
        family,
        primaryStyle,
        primaryProfile,
        roleKey,
        targetHue,
      ),
      orderIndex: getTintShadeNewStatusRoleFamilyOrderIndex(roleKey, family.key),
    }))
    .sort((first, second) => {
      if (Math.abs(first.score - second.score) > 0.0001) {
        return first.score - second.score;
      }
      return first.orderIndex - second.orderIndex;
    });
  const roleJitter = getTintShadeNewStatusRoleVariation(roleKey);
  const familyTopN = clamp(
    Math.round(roleJitter.familyTopN || 1),
    1,
    rankedFamilies.length,
  );
  const rankedCandidates = rankedFamilies.slice(0, familyTopN);
  if (normalizeTintShadeNewStatusRefreshSeed(refreshSeed) === 0) {
    return rankedCandidates[0].family;
  }

  const seededUnit = getTintShadeNewSeedUnit(refreshSeed, roleKey, 83);
  const rankIndex = clamp(
    Math.floor(seededUnit * rankedCandidates.length),
    0,
    rankedCandidates.length - 1,
  );

  return rankedCandidates[rankIndex].family;
}

function getTintShadeNewFamilyRawVisibleLightness(family, sourceIndex) {
  const toneIndex = clamp(Math.round(sourceIndex), 0, COLOR_SYSTEM_TONES.length - 1);
  const [lightness, chroma, hue] = family.oklch[toneIndex] || family.oklch[COLOR_SYSTEM_REFERENCE_TONE_INDEX];
  return getVisibleLightnessFromHex(createColorSystemHex(lightness, chroma, hue));
}

function getTintShadeNewFamilyTargetVisibleLightness(family, sourceIndex, rawVisibleLightness) {
  const range = getTintShadeNewFamilyHslLightnessRange(family);
  const rawMax = getTintShadeNewFamilyRawVisibleLightness(family, 0);
  const rawMin = getTintShadeNewFamilyRawVisibleLightness(family, COLOR_SYSTEM_TONES.length - 1);
  const rawSpan = Math.max(rawMax - rawMin, 0.001);
  const rawLightness = typeof rawVisibleLightness === "number"
    ? rawVisibleLightness
    : getTintShadeNewFamilyRawVisibleLightness(family, sourceIndex);
  const progressFromMin = clamp((rawLightness - rawMin) / rawSpan, 0, 1);

  return range.min + (range.max - range.min) * progressFromMin;
}

function getTintShadeNewFamilyToneTemplate(family, sourceIndex) {
  const toneIndex = clamp(Math.round(sourceIndex), 0, COLOR_SYSTEM_TONES.length - 1);
  const cacheKey = family.key + ":" + toneIndex;
  const cachedTemplate = tintShadeNewFamilyToneTemplateCache.get(cacheKey);
  if (cachedTemplate) {
    return cachedTemplate;
  }

  const [lightness, chroma, hue] = family.oklch[toneIndex] || family.oklch[COLOR_SYSTEM_REFERENCE_TONE_INDEX];
  const hex = createColorSystemHex(lightness, chroma, hue);
  const rawVisibleLightness = getVisibleLightnessFromHex(hex);
  const relativeChromaMax = getColorSystemRelativeChromaMax(lightness, hue);
  const relativeChroma = relativeChromaMax > 0
    ? getColorSystemRelativeChromaFromAbsolute(lightness, hue, chroma)
    : 0;
  const template = {
    familyKey: family.key,
    familyLabel: family.label,
    tone: COLOR_SYSTEM_TONES[toneIndex],
    sourceIndex: toneIndex,
    hex,
    l: lightness,
    c: chroma,
    h: normalizeColorSystemHue(hue),
    rawVisibleLightness,
    visibleLightness: getTintShadeNewFamilyTargetVisibleLightness(family, toneIndex, rawVisibleLightness),
    relativeChroma,
    relativeChromaMax,
  };

  tintShadeNewFamilyToneTemplateCache.set(cacheKey, template);
  return template;
}

function getTintShadeNewFamilyToneScore(anchorProfile, family, sourceIndex) {
  const template = getTintShadeNewFamilyToneTemplate(family, sourceIndex);
  const hueDistance = getColorSystemHueDistance(anchorProfile.h, template.h) / 180;
  const visibleLightnessDistance = Math.abs(anchorProfile.visibleLightness - template.visibleLightness);
  const oklchLightnessDistance = Math.abs(anchorProfile.l - template.l);
  const chromaDistance = Math.abs(anchorProfile.c - template.c) / 0.32;
  const relativeChromaDistance = Math.abs(anchorProfile.relativeChroma - template.relativeChroma) / 100;
  const neutralInfluence = clamp((16 - anchorProfile.relativeChroma) / 16, 0, 1);
  const hueWeight = family.neutral ? 0.18 : 0.72 - neutralInfluence * 0.48;
  const neutralFit = family.neutral ? -neutralInfluence * 0.16 : neutralInfluence * 0.08;
  const chromaticNeutralPenalty = family.neutral
    ? smoothstep(18, 42, anchorProfile.relativeChroma) * 0.32
      + smoothstep(0.035, 0.09, anchorProfile.c) * 0.28
    : 0;

  return hueDistance * hueWeight
    + visibleLightnessDistance * 1.18
    + oklchLightnessDistance * 0.72
    + chromaDistance * 0.18
    + relativeChromaDistance * 0.24
    + neutralFit
    + chromaticNeutralPenalty;
}

function isTintShadeNewYellowGreenLimeAnchor(anchorProfile) {
  if (!anchorProfile) {
    return false;
  }

  const hue = normalizeColorSystemHue(anchorProfile.h);
  const relativeChroma = Number.isFinite(anchorProfile.relativeChroma)
    ? anchorProfile.relativeChroma
    : 0;

  return hue >= COLOR_SYSTEM_YELLOW_GREEN_LIME_HUE_MIN
    && hue <= COLOR_SYSTEM_YELLOW_GREEN_LIME_HUE_MAX
    && relativeChroma >= COLOR_SYSTEM_YELLOW_GREEN_LIME_CHROMA_MIN;
}

function isTintShadeNewNeonYellowGreenAnchor(anchorProfile) {
  if (!anchorProfile) {
    return false;
  }

  const hue = normalizeColorSystemHue(anchorProfile.h);
  const relativeChroma = Number.isFinite(anchorProfile.relativeChroma)
    ? anchorProfile.relativeChroma
    : 0;
  const lightness = Number.isFinite(anchorProfile.l)
    ? anchorProfile.l
    : 0;

  return hue >= COLOR_SYSTEM_NEON_YELLOW_GREEN_HUE_MIN
    && hue <= COLOR_SYSTEM_NEON_YELLOW_GREEN_HUE_MAX
    && relativeChroma >= COLOR_SYSTEM_NEON_YELLOW_GREEN_CHROMA_MIN
    && lightness >= COLOR_SYSTEM_NEON_YELLOW_GREEN_LIGHTNESS_MIN;
}

function getTintShadeNewNeonToneScore(anchorProfile, family, sourceIndex) {
  const template = getTintShadeNewFamilyToneTemplate(family, sourceIndex);
  const hueDistance = getColorSystemHueDistance(anchorProfile.h, template.h) / 180;
  const oklchLightnessDistance = Math.abs(anchorProfile.l - template.l);
  const chromaDistance = Math.abs(anchorProfile.c - template.c) / 0.32;
  const relativeChromaDistance = Math.abs(anchorProfile.relativeChroma - template.relativeChroma) / 100;
  const visibleLightnessDistance = Math.abs(anchorProfile.visibleLightness - template.visibleLightness);

  return oklchLightnessDistance * 1.45
    + hueDistance * 0.42
    + chromaDistance * 0.22
    + relativeChromaDistance * 0.18
    + visibleLightnessDistance * 0.08;
}

function getTintShadeNewNeonYellowGreenMatch(anchorProfile) {
  if (!isTintShadeNewNeonYellowGreenAnchor(anchorProfile)) {
    return null;
  }

  let bestMatch = null;

  COLOR_SYSTEM_NEON_YELLOW_GREEN_FAMILY_KEYS.forEach((familyKey) => {
    const family = getTintShadeNewFamilyByKey(familyKey);
    if (!family || family.neutral) {
      return;
    }

    family.oklch.forEach((tone, sourceIndex) => {
      const template = getTintShadeNewFamilyToneTemplate(family, sourceIndex);
      const score = getTintShadeNewNeonToneScore(anchorProfile, family, sourceIndex);

      if (!bestMatch || score < bestMatch.score) {
        bestMatch = {
          family,
          familyKey: family.key,
          familyLabel: family.label,
          tone: template.tone,
          sourceIndex,
          template,
          score,
        };
      }
    });
  });

  return bestMatch;
}

function getTintShadeNewLimeGuidedSourceIndex(anchorProfile) {
  const visibleLightness = Number.isFinite(anchorProfile && anchorProfile.visibleLightness)
    ? anchorProfile.visibleLightness
    : 0.5;

  if (visibleLightness >= 0.74) {
    return 2;
  }

  if (visibleLightness >= 0.61) {
    return 3;
  }

  if (visibleLightness >= 0.36) {
    return 4;
  }

  return 5;
}

function getTintShadeNewGuidedFamilyMatch(anchorProfile, bestMatch) {
  const neonMatch = getTintShadeNewNeonYellowGreenMatch(anchorProfile);
  if (neonMatch) {
    return neonMatch;
  }

  if (!isTintShadeNewYellowGreenLimeAnchor(anchorProfile)) {
    return bestMatch;
  }

  const limeFamily = getTintShadeNewFamilyByKey("lime");
  if (!limeFamily) {
    return bestMatch;
  }

  const sourceIndex = clamp(
    getTintShadeNewLimeGuidedSourceIndex(anchorProfile),
    0,
    COLOR_SYSTEM_TONES.length - 1,
  );
  const template = getTintShadeNewFamilyToneTemplate(limeFamily, sourceIndex);

  return {
    family: limeFamily,
    familyKey: limeFamily.key,
    familyLabel: limeFamily.label,
    tone: template.tone,
    sourceIndex,
    template,
    score: getTintShadeNewFamilyToneScore(anchorProfile, limeFamily, sourceIndex),
  };
}

function getTintShadeNewShadeChromaRampLift(shadeStep) {
  const safeStep = clamp(Math.round(shadeStep), 0, COLOR_SYSTEM_SHADE_CHROMA_RAMP_LIFT.length - 1);
  return COLOR_SYSTEM_SHADE_CHROMA_RAMP_LIFT[safeStep] ?? 1;
}

function getTintShadeNewShadeRelativeChroma(anchorProfile, toneStop, relativeChroma) {
  if (!anchorProfile || !toneStop) {
    return relativeChroma;
  }

  const anchorToneIndex = Number.isFinite(anchorProfile.anchorToneIndex)
    ? anchorProfile.anchorToneIndex
    : anchorProfile.familyMatch && Number.isFinite(anchorProfile.familyMatch.sourceIndex)
      ? anchorProfile.familyMatch.sourceIndex
      : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  const shadeStep = toneStop.sourceIndex - anchorToneIndex;

  if (shadeStep <= 0) {
    return relativeChroma;
  }

  const anchorRelativeChroma = clamp(
    Number.isFinite(anchorProfile.relativeChroma) ? anchorProfile.relativeChroma : relativeChroma,
    0,
    100,
  );
  const softAnchorInfluence = 1 - smoothstep(76, 94, anchorRelativeChroma);

  if (softAnchorInfluence <= 0) {
    return relativeChroma;
  }

  const rampLift = getTintShadeNewShadeChromaRampLift(shadeStep);
  const rampLimit = anchorRelativeChroma + (100 - anchorRelativeChroma) * rampLift;
  const blendedLimit = 100 + (rampLimit - 100) * softAnchorInfluence;

  return Math.min(relativeChroma, blendedLimit);
}

function getTintShadeNewToneTemplateInfluence(toneStop, anchorToneIndex) {
  const distance = Math.abs(toneStop.sourceIndex - anchorToneIndex);
  return 0.18 + 0.82 * Math.pow(1 - clamp(distance / 7, 0, 1), 1.25);
}

function createTintShadeNewNeonYellowGreenColor(anchorProfile, toneStop) {
  const template = toneStop ? getTintShadeNewToneTemplate(anchorProfile, toneStop) : null;
  const anchorTemplate = anchorProfile.familyMatch ? anchorProfile.familyMatch.template : null;

  if (!template || !anchorTemplate || !isTintShadeNewNeonYellowGreenAnchor(anchorProfile)) {
    return null;
  }

  const anchorToneIndex = Number.isFinite(anchorProfile.anchorToneIndex)
    ? anchorProfile.anchorToneIndex
    : anchorProfile.familyMatch && Number.isFinite(anchorProfile.familyMatch.sourceIndex)
      ? anchorProfile.familyMatch.sourceIndex
      : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  const influence = getTintShadeNewToneTemplateInfluence(toneStop, anchorToneIndex);
  const hueDelta = getColorSystemSignedHueDelta(anchorProfile.h, anchorTemplate.h);
  const hue = normalizeColorSystemHue(template.h + hueDelta);
  const oklchLightness = clamp(
    template.l + (anchorProfile.l - anchorTemplate.l) * influence,
    0,
    1,
  );
  const relativeChroma = clamp(
    template.relativeChroma + (anchorProfile.relativeChroma - anchorTemplate.relativeChroma) * influence,
    0,
    100,
  );
  const chroma = getColorSystemAbsoluteChromaFromRelative(oklchLightness, hue, relativeChroma);
  const hex = createColorSystemHex(oklchLightness, chroma, hue);
  const profile = parseColorSystemOklch(hex);
  const finalLightness = profile ? profile.l : oklchLightness;
  const finalHue = profile ? profile.h : hue;
  const relativeChromaMax = getColorSystemRelativeChromaMax(finalLightness, finalHue);
  const actualRelativeChroma = profile && relativeChromaMax > 0
    ? getColorSystemRelativeChromaFromAbsolute(finalLightness, finalHue, profile.c)
    : relativeChroma;

  return {
    hex,
    hue: finalHue,
    visibleLightness: getVisibleLightnessFromHex(hex),
    oklchLightness: finalLightness,
    relativeChroma: actualRelativeChroma,
    targetRelativeChroma: relativeChroma,
    relativeChromaMax,
    relativeChromaGamut: COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT,
  };
}

function getTintShadeNewFamilyTemplateRampLightness(anchorProfile, toneStop, template, anchorTemplate, anchorToneIndex) {
  if (!anchorProfile || !toneStop || !template || !anchorTemplate) {
    return template ? template.l : anchorProfile.l;
  }

  if (toneStop.sourceIndex === anchorToneIndex) {
    return anchorProfile.l;
  }

  const toneDistance = Math.abs(toneStop.sourceIndex - anchorToneIndex);
  const templateDelta = template.l - anchorTemplate.l;
  const anchorDelta = anchorProfile.l - anchorTemplate.l;
  const influence = getTintShadeNewToneTemplateInfluence(toneStop, anchorToneIndex);
  const targetDistance = Math.abs(templateDelta);
  const minimumDistance = Math.max(targetDistance * 0.52, toneDistance * 0.014);
  const maximumDistance = Math.max(targetDistance * 1.36, minimumDistance + 0.012);
  let lightness = template.l + anchorDelta * influence;

  if (toneStop.sourceIndex < anchorToneIndex) {
    const lower = Math.min(0.992, anchorProfile.l + minimumDistance);
    const upper = Math.min(0.992, anchorProfile.l + maximumDistance);
    lightness = lower <= upper
      ? clamp(lightness, lower, upper)
      : upper;
  } else {
    const lower = Math.max(0.05, anchorProfile.l - maximumDistance);
    const upper = Math.max(0.05, anchorProfile.l - minimumDistance);
    lightness = lower <= upper
      ? clamp(lightness, lower, upper)
      : lower;
  }

  return clamp(lightness, 0.05, 0.992);
}

function getTintShadeNewFamilyTemplateRampChroma(anchorProfile, toneStop, template, anchorTemplate, lightness, hue, anchorToneIndex) {
  if (!anchorProfile || !template || !anchorTemplate) {
    return template ? template.c : 0;
  }

  if (toneStop && toneStop.sourceIndex === anchorToneIndex) {
    return anchorProfile.c;
  }

  const anchorTemplateChroma = Math.max(anchorTemplate.c, 0.001);
  const rawScale = clamp(anchorProfile.c / anchorTemplateChroma, 0.28, 1.72);
  const influence = getTintShadeNewToneTemplateInfluence(toneStop, anchorToneIndex);
  const chromaScale = 1 + (rawScale - 1) * (0.64 + influence * 0.36);
  const targetChroma = Math.max(0, template.c * chromaScale);
  const maxChroma = getColorSystemRelativeChromaMax(lightness, hue);

  return maxChroma > 0
    ? clamp(targetChroma, 0, maxChroma * 0.96)
    : 0;
}

function createTintShadeNewFamilyTemplateRampColor(anchorProfile, toneStop) {
  if (!anchorProfile || !toneStop || anchorProfile.roleKey !== "primary" || !anchorProfile.familyMatch) {
    return null;
  }

  const template = getTintShadeNewToneTemplate(anchorProfile, toneStop);
  const anchorTemplate = anchorProfile.familyMatch.template;

  if (!template || !anchorTemplate) {
    return null;
  }

  const anchorToneIndex = Number.isFinite(anchorProfile.anchorToneIndex)
    ? anchorProfile.anchorToneIndex
    : Number.isFinite(anchorProfile.familyMatch.sourceIndex)
      ? anchorProfile.familyMatch.sourceIndex
      : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  const hueDelta = getColorSystemSignedHueDelta(anchorProfile.h, anchorTemplate.h);
  const hue = normalizeColorSystemHue(template.h + hueDelta);
  const oklchLightness = getTintShadeNewFamilyTemplateRampLightness(
    anchorProfile,
    toneStop,
    template,
    anchorTemplate,
    anchorToneIndex,
  );
  const chroma = getTintShadeNewFamilyTemplateRampChroma(
    anchorProfile,
    toneStop,
    template,
    anchorTemplate,
    oklchLightness,
    hue,
    anchorToneIndex,
  );
  const hex = createColorSystemHex(oklchLightness, chroma, hue);
  const profile = parseColorSystemOklch(hex);
  const finalLightness = profile ? profile.l : oklchLightness;
  const finalHue = profile ? profile.h : hue;
  const finalChroma = profile ? profile.c : chroma;
  const relativeChromaMax = getColorSystemRelativeChromaMax(finalLightness, finalHue);
  const relativeChroma = relativeChromaMax > 0
    ? getColorSystemRelativeChromaFromAbsolute(finalLightness, finalHue, finalChroma)
    : 0;
  const targetRelativeChroma = relativeChromaMax > 0
    ? getColorSystemRelativeChromaFromAbsolute(oklchLightness, hue, chroma)
    : relativeChroma;

  return {
    hex,
    hue: finalHue,
    visibleLightness: getVisibleLightnessFromHex(hex),
    oklchLightness: finalLightness,
    relativeChroma,
    targetRelativeChroma,
    relativeChromaMax,
    relativeChromaGamut: COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT,
    rampLogic: TINT_SHADE_NEW_OKLCH_TEMPLATE_RAMP_LOGIC,
  };
}

function getTintShadeNewFamilyMatch(anchorProfile, preferredFamily = null) {
  const families = preferredFamily ? [preferredFamily] : TINT_SHADE_NEW_FAMILY_PROFILES;
  let bestMatch = null;

  families.forEach((family) => {
    family.oklch.forEach((tone, sourceIndex) => {
      const template = getTintShadeNewFamilyToneTemplate(family, sourceIndex);
      const score = getTintShadeNewFamilyToneScore(anchorProfile, family, sourceIndex);
      if (!bestMatch || score < bestMatch.score) {
        bestMatch = {
          family,
          familyKey: family.key,
          familyLabel: family.label,
          tone: template.tone,
          sourceIndex,
          template,
          score,
        };
      }
    });
  });

  return preferredFamily
    ? bestMatch
    : getTintShadeNewGuidedFamilyMatch(anchorProfile, bestMatch);
}

function getTintShadeNewAnchorToneStop(toneStops, anchorProfile) {
  const familyMatch = anchorProfile.familyMatch || getTintShadeNewFamilyMatch(anchorProfile);
  if (!familyMatch) {
    return toneStops[COLOR_SYSTEM_REFERENCE_TONE_INDEX] || toneStops[0];
  }

  const anchorIndex = getColorSystemAvailableToneSourceIndex(toneStops, familyMatch.sourceIndex);
  return toneStops.find((toneStop) => toneStop.sourceIndex === anchorIndex) || toneStops[0];
}

function getTintShadeNewToneTemplate(anchorProfile, toneStop) {
  const family = anchorProfile.familyMatch && anchorProfile.familyMatch.family
    ? anchorProfile.familyMatch.family
    : getTintShadeNewFamilyByKey(anchorProfile.familyKey);
  return getTintShadeNewFamilyToneTemplate(family, toneStop.sourceIndex);
}

function getTintShadeNewToneVisibleLightness(toneStop, anchorProfile, anchorToneStop) {
  const template = getTintShadeNewToneTemplate(anchorProfile, toneStop);
  const anchorTemplate = anchorProfile.familyMatch
    ? anchorProfile.familyMatch.template
    : getTintShadeNewToneTemplate(anchorProfile, anchorToneStop);

  if (toneStop.sourceIndex === anchorToneStop.sourceIndex) {
    return anchorProfile.visibleLightness;
  }

  const family = anchorProfile.familyMatch && anchorProfile.familyMatch.family
    ? anchorProfile.familyMatch.family
    : getTintShadeNewFamilyByKey(anchorProfile.familyKey);
  const distance = Math.abs(toneStop.sourceIndex - anchorToneStop.sourceIndex);
  const anchorDelta = anchorProfile.visibleLightness - anchorTemplate.visibleLightness;
  const baseInfluence = 0.18 + 0.82 * Math.pow(1 - clamp(distance / 7, 0, 1), 1.25);
  const shouldPreserveYellowGreenLimeRamp = anchorProfile.roleKey === "primary"
    && anchorDelta > 0
    && isTintShadeNewYellowGreenLimeAnchor(anchorProfile);
  const yellowGreenAnchorDeltaWeight = shouldPreserveYellowGreenLimeRamp
    ? smoothstep(0.055, 0.12, anchorDelta)
    : 0;
  const yellowGreenTintDamping = 1 - yellowGreenAnchorDeltaWeight * 0.84;
  const yellowGreenShadeDamping = 1 - yellowGreenAnchorDeltaWeight * 0.54;
  const influence = shouldPreserveYellowGreenLimeRamp
    ? baseInfluence * (
      toneStop.sourceIndex < anchorToneStop.sourceIndex
        ? yellowGreenTintDamping
        : yellowGreenShadeDamping
    )
    : baseInfluence;
  const range = getTintShadeNewFamilyHslLightnessRange(family);
  const visibleLightness = clamp(
    template.visibleLightness + anchorDelta * influence,
    range.min,
    range.max,
  );

  if (toneStop.sourceIndex < anchorToneStop.sourceIndex) {
    const tintCeiling = range.max - toneStop.sourceIndex * TINT_SHADE_NEW_TINT_VISIBLE_LIGHTNESS_STEP;
    return clamp(Math.min(visibleLightness, tintCeiling), range.min, range.max);
  }

  const shadeSpan = Math.max(1 - anchorToneStop.progress, 0.001);
  const shadeProgress = clamp((toneStop.progress - anchorToneStop.progress) / shadeSpan, 0, 1);
  const spreadVisibleLightness = range.min
    + (anchorProfile.visibleLightness - range.min) * Math.pow(1 - shadeProgress, 1.12);
  return clamp(Math.max(visibleLightness, spreadVisibleLightness), range.min, range.max);
}

function getTintShadeNewStatusCoreToneIndex(roleKey) {
  return Number.isFinite(TINT_SHADE_NEW_STATUS_CORE_TONE_INDEX[roleKey])
    ? clamp(Math.round(TINT_SHADE_NEW_STATUS_CORE_TONE_INDEX[roleKey]), 0, COLOR_SYSTEM_TONES.length - 1)
    : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
}

function getTintShadeNewColorSystemCacheKey(pointCount) {
  return [
    clamp(Math.round(pointCount), 2, COLOR_SYSTEM_TONES.length),
    getTintShadeAnchorHex(),
    tintShadeNewStatusRefreshSeed,
  ].join("|");
}

function createTintShadeNewColor(visibleLightness, anchorProfile, toneStop = null) {
  if (anchorProfile && anchorProfile.roleKey === "primary") {
    const neonColor = createTintShadeNewNeonYellowGreenColor(anchorProfile, toneStop);
    if (neonColor) {
      return neonColor;
    }
  }

  const template = toneStop ? getTintShadeNewToneTemplate(anchorProfile, toneStop) : null;
  const anchorTemplate = anchorProfile.familyMatch ? anchorProfile.familyMatch.template : null;
  const hueDelta = anchorTemplate
    ? getColorSystemSignedHueDelta(anchorProfile.h, anchorTemplate.h)
    : 0;
  const hue = template
    ? normalizeColorSystemHue(template.h + hueDelta)
    : normalizeColorSystemHue(anchorProfile.h);
  const chromaScale = anchorTemplate && anchorTemplate.relativeChroma > 0
    ? clamp(anchorProfile.relativeChroma / anchorTemplate.relativeChroma, 0.15, 1.85)
    : 1;
  const rawRelativeChroma = template
    ? clamp(template.relativeChroma * chromaScale, 0, 100)
    : anchorProfile.relativeChroma;
  const relativeChroma = getTintShadeNewShadeRelativeChroma(anchorProfile, toneStop, rawRelativeChroma);
  const colorResult = createColorSystemHexForVisibleLightness(visibleLightness, relativeChroma / 100, hue);
  const hex = colorResult.hex;
  const profile = parseColorSystemOklch(hex);
  const oklchLightness = profile ? profile.l : colorResult.oklchLightness;
  const relativeChromaMax = getColorSystemRelativeChromaMax(oklchLightness, hue);
  const actualRelativeChroma = profile && relativeChromaMax > 0
    ? getColorSystemRelativeChromaFromAbsolute(oklchLightness, hue, profile.c)
    : relativeChroma;

  return {
    hex,
    hue,
    visibleLightness: colorResult.visibleLightness,
    oklchLightness,
    relativeChroma: actualRelativeChroma,
    targetRelativeChroma: relativeChroma,
    relativeChromaMax,
    relativeChromaGamut: COLOR_SYSTEM_RELATIVE_CHROMA_GAMUT,
  };
}

function getTintShadeNewStatusAnchorMetrics(roleKey, primaryStyle, refreshSeed) {
  const variation = getTintShadeNewStatusRoleVariation(roleKey);
  const vividness = clamp(primaryStyle.vividness || 0.5, 0, 1);
  const softness = clamp(primaryStyle.softness || 0.5, 0, 1);
  const depth = clamp(primaryStyle.depth || 0.5, 0, 1);
  const sourceRelativeChroma = Number.isFinite(primaryStyle.sourceRelativeChroma)
    ? clamp(primaryStyle.sourceRelativeChroma, 0, 100)
    : clamp(vividness * 100, 0, 100);
  const inferredMutedness = 1 - smoothstep(58, 82, sourceRelativeChroma);
  const mutedness = Number.isFinite(primaryStyle.mutedness)
    ? clamp(Math.max(primaryStyle.mutedness, inferredMutedness), 0, 1)
    : inferredMutedness;
  const stylePreservation = normalizeTintShadeNewStatusRefreshSeed(refreshSeed) === 0 ? 1 : 0.42;
  const configuredLightness = Number.isFinite(variation.anchorVisibleLightness)
    ? variation.anchorVisibleLightness
    : 0.6;
  const configuredChroma = Number.isFinite(variation.anchorRelativeChroma)
    ? variation.anchorRelativeChroma
    : 76;
  const primaryVisibleLightness = Number.isFinite(primaryStyle.visibleLightness)
    ? primaryStyle.visibleLightness
    : configuredLightness;
  const primaryLightnessInfluence = Number.isFinite(variation.primaryLightnessInfluence)
    ? variation.primaryLightnessInfluence
    : 0.24;
  const primaryLightnessLightenInfluence = Number.isFinite(variation.primaryLightnessLightenInfluence)
    ? variation.primaryLightnessLightenInfluence
    : primaryLightnessInfluence * 0.35;
  const primaryLightnessDelta = primaryVisibleLightness - 0.5;
  const primaryLightnessOffset = primaryLightnessDelta < 0
    ? primaryLightnessDelta * primaryLightnessInfluence
    : primaryLightnessDelta * primaryLightnessLightenInfluence;
  const moodLightnessOffset = primaryLightnessOffset
    + (softness - 0.5) * 0.018
    - (depth - 0.5) * 0.012;
  const moodChromaScale = 1
    + (vividness - 0.5) * 0.1
    - (softness - 0.5) * 0.22
    - mutedness * 0.18 * stylePreservation;
  const styleChromaCap = clamp(
    sourceRelativeChroma + 10 + vividness * 6 + (1 - stylePreservation) * 18,
    28,
    100,
  );
  const lightnessJitter = getTintShadeNewSeedSignedJitter(
    refreshSeed,
    roleKey,
    variation.lightnessJitter || 0,
    173,
  );
  const chromaJitter = getTintShadeNewSeedSignedJitter(
    refreshSeed,
    roleKey,
    variation.chromaJitter || 0,
    127,
  );

  return {
    visibleLightness: clamp(
      configuredLightness + moodLightnessOffset + lightnessJitter,
      TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MIN,
      TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MAX,
    ),
    relativeChroma: clamp(
      Math.min(configuredChroma * moodChromaScale * (1 + chromaJitter), styleChromaCap),
      8,
      100,
    ),
  };
}

function createTintShadeNewRoleProfile(role, primaryProfile) {
  const isPrimary = role.type === "brand";
  if (isPrimary) {
    return {
      ...primaryProfile,
      roleKey: role.key,
      roleLabel: role.label,
      roleAnchorType: "primary-anchor",
      statusHueRange: null,
    };
  }

  const primaryStyle = getTintShadeNewPrimaryStyle(primaryProfile);
  const refreshSeed = getTintShadeNewStatusRefreshSeed();
  const variation = getTintShadeNewStatusRoleVariation(role.key);
  const semanticHue = getTintShadeNewStatusRoleTargetHue(role.key, primaryProfile, primaryStyle, refreshSeed);
  const preferredFamily = getTintShadeNewFamilyForStatusRole(
    role.key,
    primaryProfile,
    primaryStyle,
    semanticHue,
    refreshSeed,
  );
  const sourceIndex = getTintShadeNewStatusCoreToneIndex(role.key);
  const statusFamilyTemplate = getTintShadeNewFamilyToneTemplate(preferredFamily, sourceIndex);
  const hue = semanticHue;
  const statusFamilyMatch = {
    family: preferredFamily,
    familyKey: preferredFamily.key,
    familyLabel: preferredFamily.label,
    tone: statusFamilyTemplate.tone,
    sourceIndex,
    template: statusFamilyTemplate,
    score: 0,
  };
  const statusAnchorMetrics = getTintShadeNewStatusAnchorMetrics(role.key, primaryStyle, refreshSeed);
  const statusColor = createTintShadeNewColor(statusAnchorMetrics.visibleLightness, {
    ...primaryProfile,
    h: hue,
    relativeChroma: statusAnchorMetrics.relativeChroma,
    familyMatch: statusFamilyMatch,
    familyKey: preferredFamily.key,
    familyLabel: preferredFamily.label,
  });

  return {
    ...primaryProfile,
    hex: statusColor.hex,
    l: statusColor.oklchLightness,
    h: hue,
    visibleLightness: statusColor.visibleLightness,
    boundedVisibleLightness: statusColor.visibleLightness,
    relativeChroma: statusColor.relativeChroma,
    relativeChromaMax: statusColor.relativeChromaMax,
    relativeChromaGamut: statusColor.relativeChromaGamut,
    familyMatch: statusFamilyMatch,
    familyKey: preferredFamily.key,
    familyLabel: preferredFamily.label,
    anchorToneIndex: sourceIndex,
    anchorTone: COLOR_SYSTEM_TONES[sourceIndex],
    roleKey: role.key,
    roleLabel: role.label,
    roleAnchorType: "status-generated",
    statusHueRange: {
      min: variation.minHue,
      max: variation.maxHue,
      wrapped: variation.minHue > variation.maxHue,
      targetHue: semanticHue,
    },
    statusFamilyCandidates: getTintShadeNewStatusRoleFamilies(role.key).map((family) => family.key),
    primaryStyle,
  };
}

function createTintShadeNewTonePoint(toneStop, anchorProfile, anchorToneStop) {
  const roleAnchorToneIndex = Number.isFinite(anchorProfile.anchorToneIndex)
    ? anchorProfile.anchorToneIndex
    : anchorToneStop.sourceIndex;
  const isAnchorTone = toneStop.sourceIndex === roleAnchorToneIndex;
  const isPrimaryRole = anchorProfile.roleKey === "primary";
  const roleAnchorToneStop = isPrimaryRole
    ? anchorToneStop
    : {
      ...anchorToneStop,
      sourceIndex: roleAnchorToneIndex,
      tone: COLOR_SYSTEM_TONES[roleAnchorToneIndex] || anchorToneStop.tone,
      progress: getColorSystemToneProgressForSourceIndex(roleAnchorToneIndex),
    };
  const visibleLightness = getTintShadeNewToneVisibleLightness(toneStop, anchorProfile, roleAnchorToneStop);
  const exactToneHex = getTintShadeNewExactFamilyToneHex(anchorProfile, toneStop);
  const exactToneColor = exactToneHex ? createTintShadeNewExactFamilyColor(exactToneHex) : null;
  const familyTemplateRampColor = !exactToneColor && !isAnchorTone
    ? createTintShadeNewFamilyTemplateRampColor(anchorProfile, toneStop)
    : null;
  const generatedColor = exactToneColor || (isAnchorTone
    ? {
      hex: anchorProfile.hex,
      hue: anchorProfile.h,
      visibleLightness: anchorProfile.visibleLightness,
      oklchLightness: anchorProfile.l,
      relativeChroma: anchorProfile.relativeChroma,
      targetRelativeChroma: anchorProfile.relativeChroma,
      relativeChromaMax: anchorProfile.relativeChromaMax,
      relativeChromaGamut: anchorProfile.relativeChromaGamut,
      rampLogic: isPrimaryRole ? TINT_SHADE_NEW_OKLCH_TEMPLATE_RAMP_LOGIC : null,
    }
    : familyTemplateRampColor || createTintShadeNewColor(visibleLightness, anchorProfile, toneStop));
  const displayVisibleLightness = isAnchorTone
    ? clamp(generatedColor.visibleLightness, TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MIN, TINT_SHADE_NEW_VISIBLE_LIGHTNESS_MAX)
    : generatedColor.visibleLightness;

  return {
    x: SCALE_SPECTRUM_SIZE / 2,
    y: clamp((1 - displayVisibleLightness) * SCALE_SPECTRUM_SIZE, 0, SCALE_SPECTRUM_SIZE),
    hex: generatedColor.hex,
    lightness: displayVisibleLightness * 100,
    isHexAnchor: isPrimaryRole && isAnchorTone && isHexLocked,
    isRoleAnchor: isAnchorTone,
    role: anchorProfile.roleKey,
    tone: toneStop.tone,
    toneIndex: toneStop.sourceIndex,
    pointLightness: generatedColor.oklchLightness,
    visibleLightness: generatedColor.visibleLightness,
    targetVisibleLightness: visibleLightness,
    hue: generatedColor.hue,
    minChroma: 0,
    chromaRatio: generatedColor.relativeChroma / 100,
    targetChromaRatio: anchorProfile.relativeChroma / 100,
    relativeChroma: generatedColor.relativeChroma,
    targetRelativeChroma: generatedColor.targetRelativeChroma,
    relativeChromaMax: generatedColor.relativeChromaMax,
    relativeChromaGamut: generatedColor.relativeChromaGamut,
    rampLogic: generatedColor.rampLogic || null,
    roleAnchorHex: anchorProfile.hex,
    roleAnchorType: anchorProfile.roleAnchorType,
    statusHueRange: anchorProfile.statusHueRange,
    familyKey: anchorProfile.familyKey,
    familyLabel: anchorProfile.familyLabel,
    anchorTone: roleAnchorToneStop.tone,
    anchorToneIndex: roleAnchorToneStop.sourceIndex,
    chromaCeiling: 1,
    contrastOnWhite: getColorSystemContrast(generatedColor.hex, "#FFFFFF"),
    contrastOnBlack: getColorSystemContrast(generatedColor.hex, "#000000"),
  };
}

function getTintShadeNewColorSystem(pointCount) {
  const cacheKey = getTintShadeNewColorSystemCacheKey(pointCount);
  if (cacheKey === tintShadeNewColorSystemCacheKey && tintShadeNewColorSystemCache) {
    return tintShadeNewColorSystemCache;
  }

  const anchorProfile = getTintShadeNewAnchorProfile();
  if (!anchorProfile) {
    tintShadeNewColorSystemCacheKey = cacheKey;
    tintShadeNewColorSystemCache = [];
    return [];
  }

  const toneStops = getColorSystemToneStops(pointCount);
  const anchorToneStop = getTintShadeNewAnchorToneStop(toneStops, anchorProfile);

  const colorSystem = COLOR_SYSTEM_ROLE_CONFIGS.map((role) => {
    const roleProfile = createTintShadeNewRoleProfile(role, anchorProfile);
    const roleLightnessRange = getTintShadeNewFamilyHslLightnessRange(roleProfile.familyMatch.family);
    const roleAnchorToneIndex = Number.isFinite(roleProfile.anchorToneIndex)
      ? roleProfile.anchorToneIndex
      : anchorToneStop.sourceIndex;
    return {
      key: role.key,
      label: role.label,
      roleAnchorHex: roleProfile.hex,
      roleAnchorType: roleProfile.roleAnchorType,
      statusHueRange: roleProfile.statusHueRange,
      familyKey: roleProfile.familyKey,
      familyLabel: roleProfile.familyLabel,
      anchorTone: COLOR_SYSTEM_TONES[roleAnchorToneIndex] || anchorToneStop.tone,
      anchorToneIndex: roleAnchorToneIndex,
      rampLogic: role.key === "primary" ? TINT_SHADE_NEW_OKLCH_TEMPLATE_RAMP_LOGIC : null,
      visibleLightnessMax: roleLightnessRange.max,
      visibleLightnessMin: roleLightnessRange.min,
      points: toneStops.map((toneStop) => createTintShadeNewTonePoint(toneStop, roleProfile, anchorToneStop)),
    };
  });

  tintShadeNewColorSystemCacheKey = cacheKey;
  tintShadeNewColorSystemCache = colorSystem;
  return colorSystem;
}

function getTintShadeNewPoints(pointCount) {
  const colorSystem = getTintShadeNewColorSystem(pointCount);
  const primary = colorSystem.find((group) => group.key === "primary");
  return primary ? primary.points : [];
}

function getTintShadeNewPaletteGroups(pointCount) {
  return getTintShadeNewColorSystem(pointCount);
}


function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hueToRgbChannel(p, q, t) {
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

function hslToRgb(hue, saturation, lightness) {
  const colorEngine = getCuloriEngine();
  if (colorEngine && typeof colorEngine.hslToRgb === "function") {
    return colorEngine.hslToRgb(hue, saturation, lightness);
  }

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

function hslToHex(hue, saturation, lightness) {
  const colorEngine = getCuloriEngine();
  if (colorEngine && typeof colorEngine.hslToHex === "function") {
    return colorEngine.hslToHex(hue, saturation, lightness);
  }

  return hslToRgb(hue, saturation, lightness)
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .padStart(6, "0")
    .replace(/^/, "#");
}

function srgbToLinear(channel) {
  const value = clamp(channel, 0, 255) / 255;
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearToSrgbByte(channel) {
  const value = channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
  return Math.round(clamp(value, 0, 1) * 255);
}

function rgbToHex(red, green, blue) {
  return [red, green, blue]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .replace(/^/, "#");
}

function rgbToOklch(red, green, blue) {
  const colorEngine = getCuloriEngine();
  if (colorEngine && typeof colorEngine.hexToOklch === "function") {
    const color = colorEngine.hexToOklch(rgbToHex(red, green, blue));
    if (color) {
      return {
        l: color.l,
        c: color.c,
        h: color.h,
      };
    }
  }

  const r = srgbToLinear(red);
  const g = srgbToLinear(green);
  const b = srgbToLinear(blue);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const lPrime = Math.cbrt(l);
  const mPrime = Math.cbrt(m);
  const sPrime = Math.cbrt(s);
  const lightness = 0.2104542553 * lPrime + 0.793617785 * mPrime - 0.0040720468 * sPrime;
  const a = 1.9779984951 * lPrime - 2.428592205 * mPrime + 0.4505937099 * sPrime;
  const bAxis = 0.0259040371 * lPrime + 0.7827717662 * mPrime - 0.808675766 * sPrime;
  let hue = Math.atan2(bAxis, a) * 180 / Math.PI;
  if (hue < 0) {
    hue += 360;
  }

  return {
    l: lightness,
    c: Math.sqrt(a * a + bAxis * bAxis),
    h: hue,
  };
}

function oklchToLinearRgb(oklch) {
  const hueRadians = oklch.h * Math.PI / 180;
  const a = oklch.c * Math.cos(hueRadians);
  const b = oklch.c * Math.sin(hueRadians);
  const lPrime = oklch.l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = oklch.l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = oklch.l - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;

  return {
    red: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    green: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    blue: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function isOklchInSrgbGamut(oklch) {
  const colorEngine = getCuloriEngine();
  if (colorEngine && typeof colorEngine.oklchInSrgbGamut === "function") {
    return colorEngine.oklchInSrgbGamut(oklch);
  }

  const rgb = oklchToLinearRgb(oklch);
  return rgb.red >= 0 && rgb.red <= 1
    && rgb.green >= 0 && rgb.green <= 1
    && rgb.blue >= 0 && rgb.blue <= 1;
}

function oklchToHex(oklch) {
  const colorEngine = getCuloriEngine();
  if (colorEngine && typeof colorEngine.oklchToHex === "function") {
    try {
      return colorEngine.oklchToHex(oklch);
    } catch (error) {
      // Fall through to the local OKLCH conversion.
    }
  }

  const rgb = oklchToLinearRgb(oklch);
  return rgbToHex(
    linearToSrgbByte(rgb.red),
    linearToSrgbByte(rgb.green),
    linearToSrgbByte(rgb.blue),
  );
}

function fitOklchToSrgb(oklch) {
  let chroma = Math.max(0, oklch.c);
  const lightness = clamp(oklch.l, 0, 1);
  const hue = ((oklch.h % 360) + 360) % 360;

  while (chroma > 0 && !isOklchInSrgbGamut({ l: lightness, c: chroma, h: hue })) {
    chroma -= 0.001;
  }

  return {
    l: lightness,
    c: Math.max(0, chroma),
    h: hue,
  };
}

function normalizeHexInputValue(value) {
  const normalized = String(value || "").trim().replace(/^#/, "").toUpperCase();

  if (!/^[0-9A-F]{6}$/.test(normalized)) {
    return "";
  }

  return `#${normalized}`;
}

function sanitizeHexInputValue(value) {
  const normalized = String(value || "").toUpperCase().replace(/[^0-9A-F]/g, "");
  if (normalized.length > 6) {
    return "";
  }
  return normalized ? `#${normalized}` : "";
}

function hexToRgb(hex) {
  const colorEngine = getCuloriEngine();
  if (colorEngine && typeof colorEngine.hexToRgb === "function") {
    return colorEngine.hexToRgb(hex);
  }

  const normalized = normalizeHexInputValue(hex);

  if (!normalized) {
    return null;
  }

  return {
    red: parseInt(normalized.slice(1, 3), 16),
    green: parseInt(normalized.slice(3, 5), 16),
    blue: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHsl(red, green, blue) {
  const r = clamp(red, 0, 255) / 255;
  const g = clamp(green, 0, 255) / 255;
  const b = clamp(blue, 0, 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = SETTING_CONFIGS.hue.default;
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

function hexToHsl(hex) {
  const colorEngine = getCuloriEngine();
  if (colorEngine && typeof colorEngine.hexToHsl === "function") {
    return colorEngine.hexToHsl(hex);
  }

  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb.red, rgb.green, rgb.blue) : null;
}

function srgbChannelToLinear(channel) {
  const value = clamp(channel, 0, 255) / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function rgbToOklabChroma(red, green, blue) {
  const linearRed = srgbChannelToLinear(red);
  const linearGreen = srgbChannelToLinear(green);
  const linearBlue = srgbChannelToLinear(blue);
  const longCone = 0.4122214708 * linearRed + 0.5363325363 * linearGreen + 0.0514459929 * linearBlue;
  const mediumCone = 0.2119034982 * linearRed + 0.6806995451 * linearGreen + 0.1073969566 * linearBlue;
  const shortCone = 0.0883024619 * linearRed + 0.2817188376 * linearGreen + 0.6299787005 * linearBlue;
  const longRoot = Math.cbrt(longCone);
  const mediumRoot = Math.cbrt(mediumCone);
  const shortRoot = Math.cbrt(shortCone);
  const a = 1.9779984951 * longRoot - 2.4285922050 * mediumRoot + 0.4505937099 * shortRoot;
  const b = 0.0259040371 * longRoot + 0.7827717662 * mediumRoot - 0.8086757660 * shortRoot;

  return Math.sqrt(a * a + b * b);
}


function readRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeStatusSeedHex(input) {
  const settings = readRecord(input && input.settings);
  const hex = readRecord(settings.hex);
  return normalizeHexInputValue(hex.value || input.seedHex || input.seedColor) || DEFAULT_TINT_SHADE_REFERENCE_HEX;
}

function getStatusStepCount(input) {
  const settings = readRecord(input && input.settings);
  const settingsSteps = Number(settings.steps);
  const inputSteps = Number(input && input.steps);
  const steps = Number.isFinite(settingsSteps) ? settingsSteps : inputSteps;
  return clamp(Number.isFinite(steps) ? Math.round(steps) : COLOR_SYSTEM_TONES.length, 3, COLOR_SYSTEM_TONES.length);
}

function getStatusHexLock(input) {
  const settings = readRecord(input && input.settings);
  const hex = readRecord(settings.hex);
  return hex.locked !== false;
}

function getStatusRefreshSeed(input) {
  const settings = readRecord(input && input.settings);
  return normalizeTintShadeNewStatusRefreshSeed(settings.tintShadeNewStatusSeed);
}

function normalizeStatusGroupLabel(group) {
  return group.key === 'info' ? 'Information' : group.label || group.key;
}

const STATUS_DARK_MODE_REFINEMENT_ANCHORS = [
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
];

const STATUS_DARK_MODE_FRIENDLY_REFERENCE_HEXES = Array.from(new Set(
  STATUS_DARK_MODE_REFINEMENT_ANCHORS.map((anchor) => anchor[1])
));

function normalizeStatusTheme(input) {
  const settings = readRecord(input && input.settings);
  return String(input && input.statusTheme || settings.statusTheme || "").toLowerCase() === "dark" ? "dark" : "light";
}

function getStatusThemeHueDistance(firstHue, secondHue) {
  const distance = Math.abs((((firstHue - secondHue) % 360) + 540) % 360 - 180);
  return Math.min(distance, 180);
}

function getStatusThemeColorProfile(hex) {
  const normalizedHex = normalizeHexInputValue(hex);
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

function getStatusThemeReferenceDistance(profile, referenceHex) {
  const reference = getStatusThemeColorProfile(referenceHex);
  if (!profile || !reference) {
    return Infinity;
  }

  const hueDistance = getStatusThemeHueDistance(profile.hsl.hue, reference.hsl.hue) / 180;
  const saturationDistance = Math.abs(profile.hsl.saturation - reference.hsl.saturation) / 100;
  const lightnessDistance = Math.abs(profile.hsl.lightness - reference.hsl.lightness) / 100;
  return hueDistance * 1.8 + saturationDistance * 0.9 + lightnessDistance * 0.7;
}

function getNearestStatusDarkModeRefinementAnchor(hex) {
  const profile = getStatusThemeColorProfile(hex);
  if (!profile) {
    return null;
  }

  return STATUS_DARK_MODE_REFINEMENT_ANCHORS
    .map((anchor) => ({
      badHex: anchor[0],
      betterHex: anchor[1],
      category: anchor[2],
      distance: getStatusThemeReferenceDistance(profile, anchor[0]),
    }))
    .sort((first, second) => first.distance - second.distance)[0] || null;
}

function getNearestStatusDarkModeFriendlyReference(profile) {
  if (!profile) {
    return null;
  }

  return STATUS_DARK_MODE_FRIENDLY_REFERENCE_HEXES
    .map((hex) => ({
      hex,
      distance: getStatusThemeReferenceDistance(profile, hex),
    }))
    .sort((first, second) => first.distance - second.distance)[0] || null;
}

function getStatusDarkModeFriendlySaturationMax(profile) {
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

function getStatusDarkModeFriendlinessIssue(hex) {
  const profile = getStatusThemeColorProfile(hex);

  if (!profile) {
    return null;
  }

  const hsl = profile.hsl;
  const hue = hsl.hue;
  const anchor = getNearestStatusDarkModeRefinementAnchor(profile.hex);
  const friendlyReference = getNearestStatusDarkModeFriendlyReference(profile);
  const saturationMax = getStatusDarkModeFriendlySaturationMax(profile);
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

function getStatusContrastRatio(hex, referenceHex) {
  return getColorSystemContrast(hex, referenceHex);
}

function getGentleDarkStatusAnchorHex(sourceAnchorHex) {
  const normalizedHex = normalizeHexInputValue(sourceAnchorHex);
  const profile = getStatusThemeColorProfile(normalizedHex);

  if (!normalizedHex || !profile) {
    return normalizedHex;
  }

  const hsl = profile.hsl;
  const issue = getStatusDarkModeFriendlinessIssue(normalizedHex);
  const whiteTextContrast = getStatusContrastRatio(normalizedHex, "#FFFFFF");
  const isTooBrightForWhiteText = whiteTextContrast < 3.2 && hsl.lightness >= 58;
  const isTooDarkOnDarkSurface = hsl.lightness < 22 && profile.luminance < 0.06;
  const isTooNeon = hsl.saturation >= 92 && hsl.lightness >= 42 && hsl.lightness <= 70;

  if (!issue && !isTooBrightForWhiteText && !isTooDarkOnDarkSurface && !isTooNeon) {
    return normalizedHex;
  }

  const nextHue = hsl.hue;
  let nextSaturation = hsl.saturation;
  let nextLightness = hsl.lightness;

  if (isTooNeon || issue && /oversaturated|pure-rgb|neon|radioactive|too-saturated/.test(issue.category)) {
    nextSaturation = clamp(hsl.saturation - 8, 58, hsl.saturation);
  }

  if (isTooBrightForWhiteText || issue && issue.category === "over-bright-warm") {
    nextLightness = clamp(hsl.lightness - 7, 46, hsl.lightness);
    nextSaturation = clamp(nextSaturation - 4, 54, nextSaturation);
  }

  if (isTooDarkOnDarkSurface || issue && (issue.category === "too-dark-accent" || issue.category === "low-contrast-dark")) {
    nextLightness = clamp(hsl.lightness + 10, hsl.lightness, 38);
    nextSaturation = clamp(nextSaturation + 2, nextSaturation, 82);
  }

  if (issue && issue.category === "muddy") {
    nextSaturation = clamp(nextSaturation + 6, nextSaturation, 52);
    nextLightness = clamp(nextLightness + 4, nextLightness, 54);
  }

  return hslToHex(nextHue, nextSaturation, nextLightness);
}

function getStatusSignedHueDelta(fromHue, toHue) {
  return ((((toHue - fromHue) % 360) + 540) % 360) - 180;
}

function interpolateStatusNumber(start, end, amount) {
  return start + (end - start) * clamp(amount, 0, 1);
}

function getAdjustedStatusPaletteLightness(colorLightness, sourceAnchorLightness, lightnessDelta) {
  const lightnessMin = 3;
  const lightnessMax = 97;

  if (!Number.isFinite(colorLightness) || !Number.isFinite(sourceAnchorLightness) || !Number.isFinite(lightnessDelta)) {
    return colorLightness;
  }

  const distanceFromAnchor = colorLightness - sourceAnchorLightness;
  const distanceScale = Math.abs(distanceFromAnchor) / 52;
  const adjustmentRatio = clamp(1 - distanceScale * 0.55, 0.35, 1);
  return clamp(colorLightness + lightnessDelta * adjustmentRatio, lightnessMin, lightnessMax);
}

function getDarkModeFriendlyStatusPaletteGroup(group) {
  const sourceAnchorHex = normalizeHexInputValue(group && group.roleAnchorHex);
  const adjustedAnchorHex = getGentleDarkStatusAnchorHex(sourceAnchorHex);
  const sourceAnchorHsl = sourceAnchorHex ? hexToHsl(sourceAnchorHex) : null;
  const adjustedAnchorHsl = adjustedAnchorHex ? hexToHsl(adjustedAnchorHex) : null;

  if (
    !sourceAnchorHex
    || !adjustedAnchorHex
    || adjustedAnchorHex === sourceAnchorHex
    || !sourceAnchorHsl
    || !adjustedAnchorHsl
  ) {
    return group;
  }

  const hueDelta = getStatusSignedHueDelta(sourceAnchorHsl.hue, adjustedAnchorHsl.hue);
  const saturationRatio = sourceAnchorHsl.saturation > 1
    ? adjustedAnchorHsl.saturation / sourceAnchorHsl.saturation
    : 1;
  const lightnessDelta = adjustedAnchorHsl.lightness - sourceAnchorHsl.lightness;

  return {
    ...group,
    roleAnchorHex: adjustedAnchorHex,
    colors: group.colors.map((color) => {
      const colorHex = normalizeHexInputValue(color && color.hex);
      const colorHsl = colorHex ? hexToHsl(colorHex) : null;

      if (!colorHex || !colorHsl) {
        return color;
      }

      const isAnchorColor = color.isRoleAnchor || colorHex === sourceAnchorHex;
      const nextHex = isAnchorColor
        ? adjustedAnchorHex
        : hslToHex(
          colorHsl.hue + hueDelta,
          clamp(colorHsl.saturation * saturationRatio, 0, 100),
          getAdjustedStatusPaletteLightness(colorHsl.lightness, sourceAnchorHsl.lightness, lightnessDelta),
        );

      return {
        ...color,
        sourceHex: color.sourceHex || color.hex,
        css: nextHex,
        hex: nextHex,
        lightness: getVisibleLightnessFromHex(nextHex) * 100,
        roleAnchorHex: adjustedAnchorHex,
      };
    }),
  };
}

function getDarkModeFriendlyStatusPaletteGroups(groups) {
  return groups.map(getDarkModeFriendlyStatusPaletteGroup);
}

function getLightStatusPaletteAnchorIndex(group) {
  const colors = Array.isArray(group && group.colors) ? group.colors : [];
  const roleAnchorHex = normalizeHexInputValue(group && group.roleAnchorHex);
  const explicitAnchorIndex = colors.findIndex((color) => color && color.isRoleAnchor);

  if (explicitAnchorIndex >= 0) {
    return explicitAnchorIndex;
  }

  if (roleAnchorHex) {
    const matchingAnchorIndex = colors.findIndex((color) => normalizeHexInputValue(color && color.hex) === roleAnchorHex);
    if (matchingAnchorIndex >= 0) {
      return matchingAnchorIndex;
    }
  }

  return Math.min(COLOR_SYSTEM_REFERENCE_TONE_INDEX, Math.max(colors.length - 1, 0));
}

function getLightStatusRampShadeHueTarget(anchorHue, rampStyle = "") {
  const hue = ((anchorHue % 360) + 360) % 360;

  if (rampStyle === "electric-lime") return hue - 6;
  if (hue >= 35 && hue <= 95) return hue - 18;
  if (hue > 95 && hue <= 145) return hue - 10;
  if (hue > 145 && hue <= 205) return hue + 8;
  if (hue > 205 && hue <= 260) return hue + 5;
  if (hue > 260 && hue <= 335) return hue - 4;
  if (hue < 35) return hue + 6;
  return hue + 4;
}

function shouldRefineLightStatusRamp(anchorHsl, theme = "light") {
  const lightnessThreshold = theme === "dark" ? 60 : 70;

  return Boolean(anchorHsl)
    && anchorHsl.lightness >= lightnessThreshold
    && anchorHsl.saturation >= 14;
}

function shouldRefineVividPrimaryStatusRamp(anchorHsl) {
  if (!anchorHsl) {
    return false;
  }

  const hue = ((anchorHsl.hue % 360) + 360) % 360;
  const isBlueIndigo = hue >= 205 && hue <= 265;
  const isViolet = hue > 265 && hue <= 290;

  return (isBlueIndigo || isViolet)
    && anchorHsl.saturation >= 72
    && anchorHsl.lightness >= 44
    && anchorHsl.lightness <= 68;
}

function shouldRefineElectricPrimaryStatusRamp(anchorHsl) {
  if (!anchorHsl) {
    return false;
  }

  const hue = ((anchorHsl.hue % 360) + 360) % 360;
  return hue >= 50
    && hue <= 105
    && anchorHsl.saturation >= 84
    && anchorHsl.lightness >= 42
    && anchorHsl.lightness <= 78;
}

function getLightStatusRampTintHex(anchorHsl, index, anchorIndex, rampStyle = "") {
  if (anchorIndex <= 0) {
    return hslToHex(anchorHsl.hue, anchorHsl.saturation, anchorHsl.lightness);
  }

  const progress = clamp(index / anchorIndex, 0, 1);
  if (rampStyle === "vivid-primary") {
    const curve = Math.pow(progress, 2.1);
    return hslToHex(
      anchorHsl.hue,
      clamp(anchorHsl.saturation, 72, 88),
      interpolateStatusNumber(96.5, anchorHsl.lightness, curve),
    );
  }

  if (rampStyle === "electric-lime") {
    const curve = Math.pow(progress, 1.28);
    return hslToHex(
      anchorHsl.hue,
      clamp(anchorHsl.saturation, 86, 100),
      interpolateStatusNumber(95, anchorHsl.lightness, curve),
    );
  }

  const curve = Math.pow(progress, 1.2);
  const tintSurfaceLightness = clamp(Math.max(anchorHsl.lightness + 5, 96.5), anchorHsl.lightness, 98.5);
  const tintLightness = interpolateStatusNumber(tintSurfaceLightness, anchorHsl.lightness, curve);
  const tintSaturation = clamp(
    interpolateStatusNumber(
      anchorHsl.saturation >= 82 ? Math.max(anchorHsl.saturation - 2, 86) : anchorHsl.saturation,
      anchorHsl.saturation,
      curve,
    ),
    0,
    100,
  );

  return hslToHex(anchorHsl.hue, tintSaturation, tintLightness);
}

function getLightStatusRampShadeHex(anchorHsl, index, anchorIndex, colorCount, rampStyle = "") {
  const lastIndex = Math.max(colorCount - 1, anchorIndex + 1);
  const progress = clamp((index - anchorIndex) / Math.max(lastIndex - anchorIndex, 1), 0, 1);
  const isElectricLimeRamp = rampStyle === "electric-lime";
  const isVividPrimaryRamp = rampStyle === "vivid-primary";

  if (isVividPrimaryRamp) {
    const shadeHueTarget = getLightStatusRampShadeHueTarget(anchorHsl.hue, rampStyle);
    const hueCurve = Math.pow(progress, 0.72);
    const lightnessCurve = Math.pow(progress, 1.3);
    const earlySaturation = clamp(anchorHsl.saturation - 6, 70, 86);
    const midSaturation = clamp(anchorHsl.saturation - 18, 58, 72);
    const finalSaturation = clamp(anchorHsl.saturation - 16, 60, 72);
    const saturation = progress <= 0.2
      ? interpolateStatusNumber(anchorHsl.saturation, earlySaturation, progress / 0.2)
      : progress <= 0.45
      ? interpolateStatusNumber(earlySaturation, midSaturation, (progress - 0.2) / 0.25)
      : interpolateStatusNumber(midSaturation, finalSaturation, (progress - 0.45) / 0.55);
    const hue = anchorHsl.hue + getStatusSignedHueDelta(anchorHsl.hue, shadeHueTarget) * hueCurve;
    const lightness = interpolateStatusNumber(anchorHsl.lightness, 23, lightnessCurve);

    return hslToHex(hue, clamp(saturation, 0, 100), lightness);
  }

  const highChromaRamp = isElectricLimeRamp || anchorHsl.saturation >= 82;
  const shadeHueTarget = getLightStatusRampShadeHueTarget(anchorHsl.hue, rampStyle);
  const hueCurve = Math.pow(progress, highChromaRamp ? 1.1 : 0.82);
  const lightnessCurve = Math.pow(progress, isElectricLimeRamp ? 0.78 : 1.05);
  const finalSaturation = isElectricLimeRamp
    ? clamp(anchorHsl.saturation - 24, 64, 84)
    : highChromaRamp
    ? clamp(anchorHsl.saturation - 10, 76, 94)
    : clamp(anchorHsl.saturation - 8, 36, 70);
  const midSaturation = isElectricLimeRamp
    ? clamp(anchorHsl.saturation - 12, 72, 90)
    : highChromaRamp
    ? clamp(anchorHsl.saturation - 2, 80, 100)
    : clamp(anchorHsl.saturation - 4, 32, anchorHsl.saturation);
  const saturation = progress <= 0.5
    ? interpolateStatusNumber(anchorHsl.saturation, midSaturation, progress / 0.5)
    : interpolateStatusNumber(midSaturation, finalSaturation, (progress - 0.5) / 0.5);
  const hue = anchorHsl.hue + getStatusSignedHueDelta(anchorHsl.hue, shadeHueTarget) * hueCurve;
  const lightness = interpolateStatusNumber(anchorHsl.lightness, isElectricLimeRamp ? 10 : highChromaRamp ? 13 : 14, lightnessCurve);

  return hslToHex(hue, clamp(saturation, 0, 100), lightness);
}

function getLightStatusRampHex(anchorHex, anchorIndex, index, colorCount, rampStyle = "") {
  const anchorHsl = hexToHsl(anchorHex);

  if (!anchorHsl) {
    return anchorHex;
  }

  if (index === anchorIndex) {
    return anchorHex;
  }

  return index < anchorIndex
    ? getLightStatusRampTintHex(anchorHsl, index, anchorIndex, rampStyle)
    : getLightStatusRampShadeHex(anchorHsl, index, anchorIndex, colorCount, rampStyle);
}

function getLightStatusRampMinimumGap(rampStyle = "") {
  if (rampStyle === "electric-lime") return 4.2;
  if (rampStyle === "vivid-primary") return 3.8;
  return 3.4;
}

function getLightStatusRampMaximumGap(anchorHsl, rampStyle = "") {
  if (rampStyle === "electric-lime") return 13.5;
  if (rampStyle === "vivid-primary") return 14;

  const hue = ((anchorHsl.hue % 360) + 360) % 360;
  const isBlueCyan = hue >= 185 && hue <= 245;
  const chromaPressure = clamp((anchorHsl.saturation - 55) / 45, 0, 1);
  const baseGap = isBlueCyan ? 14.8 : 17;

  return baseGap - chromaPressure * 1.4;
}

function getLightStatusRampShadeFloor(anchorHsl, rampStyle = "") {
  if (rampStyle === "electric-lime") return 12;
  if (rampStyle === "vivid-primary") return 23;
  return anchorHsl.saturation >= 82 ? 13 : 14;
}

function getLightStatusRampSafeGap(anchorHsl, anchorIndex, colorCount, side, rampStyle = "") {
  const requestedGap = getLightStatusRampMinimumGap(rampStyle);
  const stepCount = side === "tint"
    ? anchorIndex
    : Math.max(colorCount - 1 - anchorIndex, 0);

  if (!stepCount) {
    return 0;
  }

  const availableLightness = side === "tint"
    ? Math.max(0, 98.5 - anchorHsl.lightness)
    : Math.max(0, anchorHsl.lightness - getLightStatusRampShadeFloor(anchorHsl, rampStyle));

  return Math.min(requestedGap, availableLightness / stepCount);
}

function getSpacedLightStatusRampHexes(anchorHex, anchorIndex, colorCount, rampStyle = "") {
  const anchorHsl = hexToHsl(anchorHex);

  if (!anchorHsl || colorCount <= 0) {
    return [];
  }

  const rampHsl = Array.from({ length: colorCount }, (_, index) => {
    if (index === anchorIndex) {
      return { ...anchorHsl };
    }

    return hexToHsl(getLightStatusRampHex(anchorHex, anchorIndex, index, colorCount, rampStyle)) || { ...anchorHsl };
  });
  const tintGap = getLightStatusRampSafeGap(anchorHsl, anchorIndex, colorCount, "tint", rampStyle);
  const shadeGap = getLightStatusRampSafeGap(anchorHsl, anchorIndex, colorCount, "shade", rampStyle);
  let previousLightness = anchorHsl.lightness;

  for (let index = anchorIndex - 1; index >= 0; index -= 1) {
    previousLightness = clamp(
      Math.max(rampHsl[index].lightness, previousLightness + tintGap),
      0,
      98.5,
    );
    rampHsl[index] = {
      ...rampHsl[index],
      lightness: previousLightness,
    };
  }

  previousLightness = anchorHsl.lightness;
  for (let index = anchorIndex + 1; index < colorCount; index += 1) {
    previousLightness = clamp(
      Math.min(rampHsl[index].lightness, previousLightness - shadeGap),
      getLightStatusRampShadeFloor(anchorHsl, rampStyle),
      100,
    );
    rampHsl[index] = {
      ...rampHsl[index],
      lightness: previousLightness,
    };
  }

  return rampHsl.map((hsl, index) => (
    index === anchorIndex
      ? anchorHex
      : hslToHex(hsl.hue, hsl.saturation, hsl.lightness)
  ));
}

function getSafelySpacedLightStatusRampColors(colors, anchorHex, anchorIndex, rampStyle = "") {
  const anchorHsl = hexToHsl(anchorHex);

  if (!anchorHsl || !Array.isArray(colors) || !colors.length || anchorIndex < 0 || anchorIndex >= colors.length) {
    return colors;
  }

  const rampHsl = colors.map((color, index) => {
    if (index === anchorIndex) {
      return { ...anchorHsl };
    }

    return hexToHsl(color && (color.hex || color.css)) || { ...anchorHsl };
  });
  const tintMinGap = getLightStatusRampSafeGap(anchorHsl, anchorIndex, colors.length, "tint", rampStyle);
  const shadeMinGap = getLightStatusRampSafeGap(anchorHsl, anchorIndex, colors.length, "shade", rampStyle);
  const maxGap = getLightStatusRampMaximumGap(anchorHsl, rampStyle);
  let previousLightness = anchorHsl.lightness;

  for (let index = anchorIndex - 1; index >= 0; index -= 1) {
    previousLightness = clamp(
      rampHsl[index].lightness,
      previousLightness + tintMinGap,
      previousLightness + maxGap,
    );
    rampHsl[index] = {
      ...rampHsl[index],
      lightness: previousLightness,
    };
  }

  previousLightness = anchorHsl.lightness;
  for (let index = anchorIndex + 1; index < colors.length; index += 1) {
    previousLightness = clamp(
      rampHsl[index].lightness,
      previousLightness - maxGap,
      previousLightness - shadeMinGap,
    );
    rampHsl[index] = {
      ...rampHsl[index],
      lightness: previousLightness,
    };
  }

  return colors.map((color, index) => {
    const nextHex = index === anchorIndex
      ? anchorHex
      : hslToHex(rampHsl[index].hue, rampHsl[index].saturation, rampHsl[index].lightness);

    return {
      ...color,
      sourceHex: color.sourceHex || color.hex,
      css: nextHex,
      hex: nextHex,
      lightness: getVisibleLightnessFromHex(nextHex) * 100,
      isRoleAnchor: index === anchorIndex,
      roleAnchorHex: anchorHex,
    };
  });
}

function hasTintShadeNewExactPrimaryFamilyRamp(group) {
  if (!group || group.key !== "primary") {
    return false;
  }

  const family = getTintShadeNewFamilyByKey(group.familyKey);
  const exactHexes = family && Array.isArray(family.exactHexes) ? family.exactHexes : null;

  if (!exactHexes) {
    return false;
  }

  const anchorToneIndex = Number.isFinite(group.anchorToneIndex)
    ? group.anchorToneIndex
    : COLOR_SYSTEM_REFERENCE_TONE_INDEX;
  const anchorExactHex = normalizeHexInputValue(exactHexes[anchorToneIndex]);
  const roleAnchorHex = normalizeHexInputValue(group.roleAnchorHex);

  return Boolean(anchorExactHex && roleAnchorHex && anchorExactHex === roleAnchorHex);
}

function hasTintShadeNewOklchFamilyTemplateRamp(group) {
  return Boolean(
    group
      && group.key === "primary"
      && group.rampLogic === TINT_SHADE_NEW_OKLCH_TEMPLATE_RAMP_LOGIC,
  );
}

function getLightModeStatusPaletteGroup(group, theme = "light") {
  const colors = Array.isArray(group && group.colors) ? group.colors : [];
  const roleAnchorHex = normalizeHexInputValue(group && group.roleAnchorHex);
  let anchorIndex = getLightStatusPaletteAnchorIndex(group);
  let anchorColor = colors[anchorIndex];
  let anchorHex = normalizeHexInputValue(roleAnchorHex || (anchorColor && anchorColor.hex));
  let anchorHsl = anchorHex ? hexToHsl(anchorHex) : null;
  const isPrimaryGroup = group && group.key === "primary";
  const hasExactPrimaryFamilyRamp = hasTintShadeNewExactPrimaryFamilyRamp(group);
  const hasOklchFamilyTemplateRamp = hasTintShadeNewOklchFamilyTemplateRamp(group);
  const shouldUseElectricLimeRamp = isPrimaryGroup && shouldRefineElectricPrimaryStatusRamp(anchorHsl);

  if (hasExactPrimaryFamilyRamp || hasOklchFamilyTemplateRamp) {
    return group;
  }

  if (shouldUseElectricLimeRamp && anchorHsl && anchorHsl.lightness <= 62) {
    anchorIndex = Math.min(COLOR_SYSTEM_REFERENCE_TONE_INDEX, Math.max(colors.length - 1, 0));
    anchorColor = colors[anchorIndex];
    anchorHex = normalizeHexInputValue(roleAnchorHex || anchorHex || (anchorColor && anchorColor.hex));
    anchorHsl = anchorHex ? hexToHsl(anchorHex) : null;
  }

  const shouldRefineRamp = shouldRefineLightStatusRamp(anchorHsl, theme)
    || (isPrimaryGroup && shouldRefineVividPrimaryStatusRamp(anchorHsl))
    || shouldUseElectricLimeRamp;

  if (!colors.length || !anchorHex || !shouldRefineRamp) {
    return isPrimaryGroup && colors.length && anchorHex && !hasExactPrimaryFamilyRamp
      ? {
        ...group,
        roleAnchorHex: normalizeHexInputValue(group.roleAnchorHex) || anchorHex,
        colors: getSafelySpacedLightStatusRampColors(colors, anchorHex, anchorIndex, ""),
      }
      : group;
  }

  const rampStyle = shouldUseElectricLimeRamp
    ? "electric-lime"
    : isPrimaryGroup && shouldRefineVividPrimaryStatusRamp(anchorHsl)
    ? "vivid-primary"
    : "";
  const nextRoleAnchorHex = normalizeHexInputValue(group.roleAnchorHex) || anchorHex;
  const rampHexes = getSpacedLightStatusRampHexes(anchorHex, anchorIndex, colors.length, rampStyle);
  const rampColors = colors.map((color, index) => {
    const nextHex = rampHexes[index] || getLightStatusRampHex(anchorHex, anchorIndex, index, colors.length, rampStyle);

    return {
      ...color,
      sourceHex: color.sourceHex || color.hex,
      css: nextHex,
      hex: nextHex,
      lightness: getVisibleLightnessFromHex(nextHex) * 100,
      isRoleAnchor: index === anchorIndex,
      roleAnchorHex: nextRoleAnchorHex,
    };
  });

  return {
    ...group,
    roleAnchorHex: nextRoleAnchorHex,
    colors: isPrimaryGroup && !hasExactPrimaryFamilyRamp
      ? getSafelySpacedLightStatusRampColors(rampColors, anchorHex, anchorIndex, rampStyle)
      : rampColors,
  };
}

function getLightModeStatusPaletteGroups(groups, theme = "light") {
  return groups.map((group) => getLightModeStatusPaletteGroup(group, theme));
}

function applyStatusThemeToPaletteGroups(groups, theme) {
  if (theme === "dark") {
    return getLightModeStatusPaletteGroups(getDarkModeFriendlyStatusPaletteGroups(groups), "dark");
  }

  return getLightModeStatusPaletteGroups(groups, "light");
}

export function generateTintShadeStatusPalette(input) {
  const seedHex = normalizeStatusSeedHex(input || {});
  const seedHsl = hexToHsl(seedHex) || { hue: SETTING_CONFIGS.hue.default, saturation: 0, lightness: 50 };
  hexAnchor = {
    hex: seedHex,
    hue: seedHsl.hue,
    saturation: seedHsl.saturation,
    lightness: seedHsl.lightness,
  };
  hexInput = { value: seedHex };
  isHexLocked = getStatusHexLock(input || {});
  tintShadeNewStatusRefreshSeed = getStatusRefreshSeed(input || {});

  const statusTheme = normalizeStatusTheme(input || {});
  const groups = applyStatusThemeToPaletteGroups(
    getTintShadeNewPaletteGroups(getStatusStepCount(input || {})).map((group) => {
    const label = normalizeStatusGroupLabel(group);
    const colors = (group.points || []).map((point, index) => {
      const tone = point.tone || COLOR_SYSTEM_TONES[index] || String(index + 1);
      return {
        label: `${label} ${tone}`,
        hex: normalizeHexInputValue(point.hex),
        css: normalizeHexInputValue(point.hex),
        tone,
        toneIndex: Number.isFinite(point.toneIndex) ? point.toneIndex : index,
        role: group.key,
        group: label,
        lightness: Number.isFinite(point.lightness) ? point.lightness : getVisibleLightnessFromHex(point.hex) * 100,
        isRoleAnchor: Boolean(point.isRoleAnchor),
        roleAnchorHex: normalizeHexInputValue(point.roleAnchorHex || group.roleAnchorHex),
        roleAnchorType: point.roleAnchorType || group.roleAnchorType,
        statusHueRange: point.statusHueRange || group.statusHueRange || null,
        familyKey: point.familyKey || group.familyKey || null,
        familyLabel: point.familyLabel || group.familyLabel || null,
        anchorTone: point.anchorTone || group.anchorTone || null,
        anchorToneIndex: Number.isFinite(point.anchorToneIndex) ? point.anchorToneIndex : group.anchorToneIndex,
        visibleLightness: point.visibleLightness,
        pointLightness: point.pointLightness,
        relativeChroma: point.relativeChroma,
        targetRelativeChroma: point.targetRelativeChroma,
        rampLogic: point.rampLogic || group.rampLogic || null,
      };
    }).filter((color) => color.hex);

    return {
      key: group.key,
      label,
      roleAnchorHex: normalizeHexInputValue(group.roleAnchorHex),
      roleAnchorType: group.roleAnchorType,
      statusHueRange: group.statusHueRange || null,
      familyKey: group.familyKey || null,
      familyLabel: group.familyLabel || null,
      anchorTone: group.anchorTone || null,
      anchorToneIndex: group.anchorToneIndex,
      rampLogic: group.rampLogic || null,
      colors,
    };
    }),
    statusTheme,
  );
  const colorData = groups.flatMap((group) => group.colors);

  return {
    colors: colorData.map((color) => color.hex),
    colorData,
    groups,
  };
}
