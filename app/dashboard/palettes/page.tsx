import Link from "next/link";
import { getPaletteStorageDriver, listPalettes } from "@/lib/storage/palette-repository";
import { createClient } from "@/lib/supabase/server";
import {
  deletePaletteAction,
  duplicatePaletteAction,
  renamePaletteAction,
} from "@/app/dashboard/palettes/actions";

export const dynamic = "force-dynamic";

export default async function DashboardPalettesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const palettes = await listPalettes(data.user?.id);
  const storageDriver = getPaletteStorageDriver();

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 rounded-lg border border-[#d5dde2] bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase text-[#697177]">
            Palettes
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
            Saved palettes
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5c6268]">
            Reading from {storageDriver} storage. New palettes saved from the API test
            page appear here.
          </p>
        </div>
        <Link className="flex h-11 items-center justify-center rounded-md bg-[#15171a] px-4 text-sm font-semibold text-white transition hover:bg-[#2d3338]" href="/palette-test">
          Generate palette
        </Link>
      </section>

      {palettes.length ? (
        <section className="grid gap-4">
          {palettes.map((palette) => (
            <article className="grid gap-4 rounded-lg border border-[#d5dde2] bg-white p-4 shadow-sm" key={palette.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{palette.name}</h2>
                  <p className="mt-1 text-sm text-[#5c6268]">
                    {palette.mode} · {palette.seedHex} · {palette.colors.length} colors
                  </p>
                  <Link className="mt-3 inline-flex text-sm font-semibold text-[#15171a]" href={`/dashboard/palettes/${palette.id}`}>
                    Open palette
                  </Link>
                </div>
                <p className="text-sm text-[#697177]">
                  {new Date(palette.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="grid min-h-20 overflow-hidden rounded-md border border-[#d5dde2]" style={{
                gridTemplateColumns: `repeat(${palette.colors.length}, minmax(0, 1fr))`,
              }}>
                {palette.colors.map((color, index) => (
                  <div className="min-h-20" key={`${palette.id}-${color}-${index}`} style={{ backgroundColor: color }} />
                ))}
              </div>

              <div className="grid gap-3 border-t border-[#edf1f3] pt-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <form action={renamePaletteAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input name="paletteId" type="hidden" value={palette.id} />
                  <label className="sr-only" htmlFor={`rename-${palette.id}`}>
                    Palette name
                  </label>
                  <input
                    className="h-10 rounded-md border border-[#b9c0c7] px-3 text-sm outline-none transition focus:border-[#2374ab] focus:ring-4 focus:ring-[#35ade9]/20"
                    defaultValue={palette.name}
                    id={`rename-${palette.id}`}
                    name="name"
                  />
                  <button className="h-10 rounded-md border border-[#15171a] px-4 text-sm font-semibold transition hover:bg-[#15171a] hover:text-white" type="submit">
                    Rename
                  </button>
                </form>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <form action={duplicatePaletteAction}>
                    <input name="paletteId" type="hidden" value={palette.id} />
                    <button className="h-10 w-full rounded-md border border-[#b9c0c7] px-4 text-sm font-semibold transition hover:border-[#15171a] sm:w-auto" type="submit">
                      Duplicate
                    </button>
                  </form>
                  <form action={deletePaletteAction}>
                    <input name="paletteId" type="hidden" value={palette.id} />
                    <button className="h-10 w-full rounded-md border border-[#d64f4f] px-4 text-sm font-semibold text-[#9f2727] transition hover:bg-[#fff1f1] sm:w-auto" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-[#b9c0c7] bg-white p-10 text-center">
          <h2 className="text-xl font-semibold">No palettes yet</h2>
          <p className="mt-2 text-sm text-[#5c6268]">
            Generate and save a palette to create your first dashboard record.
          </p>
          <Link className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#15171a] px-4 text-sm font-semibold text-white transition hover:bg-[#2d3338]" href="/palette-test">
            Generate palette
          </Link>
        </section>
      )}
    </div>
  );
}
