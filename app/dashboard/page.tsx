import Link from "next/link";
import { getPaletteStorageDriver, listPalettes } from "@/lib/storage/palette-repository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const palettes = await listPalettes();
  const storageDriver = getPaletteStorageDriver();
  const recentPalettes = palettes.slice(0, 3);

  return (
    <div className="grid gap-8">
      <section className="grid gap-5 rounded-lg border border-[#d5dde2] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-[#697177]">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              Your Spectro workspace
            </h1>
          </div>
          <Link className="flex h-11 items-center justify-center rounded-md bg-[#15171a] px-4 text-sm font-semibold text-white transition hover:bg-[#2d3338]" href="/dashboard/palettes">
            View palettes
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-[#d5dde2] p-4">
            <p className="text-sm text-[#5c6268]">Saved palettes</p>
            <p className="mt-3 text-3xl font-semibold">{palettes.length}</p>
          </div>
          <div className="rounded-md border border-[#d5dde2] p-4">
            <p className="text-sm text-[#5c6268]">Storage</p>
            <p className="mt-3 text-3xl font-semibold capitalize">{storageDriver}</p>
          </div>
          <div className="rounded-md border border-[#d5dde2] p-4">
            <p className="text-sm text-[#5c6268]">Cloud API</p>
            <p className="mt-3 text-3xl font-semibold">Active</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Recent palettes</h2>
            <p className="mt-1 text-sm text-[#5c6268]">
              Latest saved palette records from the active storage backend.
            </p>
          </div>
          <Link className="text-sm font-semibold text-[#15171a]" href="/dashboard/palettes">
            See all
          </Link>
        </div>

        {recentPalettes.length ? (
          <div className="grid gap-3">
            {recentPalettes.map((palette) => (
              <article className="rounded-lg border border-[#d5dde2] bg-white p-4 shadow-sm" key={palette.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{palette.name}</h3>
                    <p className="mt-1 text-sm text-[#5c6268]">
                      {palette.mode} · {palette.colors.length} colors
                    </p>
                  </div>
                  <div className="grid h-12 w-full overflow-hidden rounded-md border border-[#d5dde2] sm:w-72" style={{
                    gridTemplateColumns: `repeat(${palette.colors.length}, minmax(0, 1fr))`,
                  }}>
                    {palette.colors.map((color, index) => (
                      <div key={`${palette.id}-${color}-${index}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#b9c0c7] bg-white p-8 text-center text-sm text-[#5c6268]">
            No palettes saved yet.
          </div>
        )}
      </section>
    </div>
  );
}
