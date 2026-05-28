const DEFAULT_ALLOWED_ORIGINS = [
  "https://hispectro.com",
  "https://www.hispectro.com",
  "https://hispectro.vercel.com",
  "https://hispectro.vercel.app",
  "https://figma.com",
  "https://www.figma.com",
  "http://localhost:3000",
];

type CorsOptions = {
  methods: string;
  exposeHeaders?: string;
};

function getAllowedOrigins(): Set<string> {
  const configuredOrigins = (process.env.SPECTRO_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configuredOrigins.length ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS);
}

export function getCorsHeaders(request: Request, options: CorsOptions): HeadersInit {
  const origin = request.headers.get("origin") || "";
  const isAllowedOrigin = Boolean(origin && getAllowedOrigins().has(origin));
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": options.methods,
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (isAllowedOrigin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }

  if (options.exposeHeaders) {
    headers["Access-Control-Expose-Headers"] = options.exposeHeaders;
  }

  return headers;
}

export function corsOptionsResponse(request: Request, options: CorsOptions): Response {
  const origin = request.headers.get("origin") || "";
  if (origin && !getAllowedOrigins().has(origin)) {
    return new Response(null, {
      status: 403,
    });
  }

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, options),
  });
}
