export async function GET() {
  return Response.json({
    ok: true,
    service: "spectro-api",
    version: "0.1.0",
  });
}