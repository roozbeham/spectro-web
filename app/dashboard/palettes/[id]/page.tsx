import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createCssVariablesExport,
  createJsonExport,
  createTailwindExport,
} from "@/lib/export/palette-export";
import { getPalette } from "@/lib/storage/palette-repository";
import { createClient } from "@/lib/supabase/server";
import {
  deletePaletteAction,
  duplicatePaletteAction,
  renamePaletteAction,
} from "@/app/dashboard/palettes/actions";
import { ExportBlock } from "@/app/dashboard/palettes/[id]/export-block";

export const dynamic = "force-dynamic";

type PaletteDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PaletteDetailPage({ params }: PaletteDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const palette = await getPalette(id, data.user?.id);

  if (!palette) {
    notFound();
  }

  const cssExport = createCssVariablesExport(palette);
  const jsonExport = createJsonExport(palette);
  const tailwindExport = createTailwindExport(palette);
  const filename = palette.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "palette";

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 rounded-lg border border-[#d5dde2] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link className="text-sm font-semibold text-[#5c6268] transition hover:text-[#15171a]" href="/dashboard/palettes">
              Back to palettes
            </Link>
            <p className="mt-6 text-sm font-medium uppercase text-[#697177]">
              Palette Detail
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              {palette.name}
            </h1>
            <p className="mt-3 text-sm text-[#5c6268]">
              {palette.mode} · {palette.seedHex} · {palette.colors.length} colors
            </p>
          </div>

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

        <form action={renamePaletteAction} className="grid gap-2 border-t border-[#edf1f3] pt-5 sm:grid-cols-[1fr_auto]">
          <input name="paletteId" type="hidden" value={palette.id} />
          <label className="sr-only" htmlFor="palette-name">
            Palette name
          </label>
          <input
            className="h-11 rounded-md border border-[#b9c0c7] px-3 text-sm outline-none transition focus:border-[#2374ab] focus:ring-4 focus:ring-[#35ade9]/20"
            defaultValue={palette.name}
            id="palette-name"
            name="name"
          />
          <button className="h-11 rounded-md border border-[#15171a] px-4 text-sm font-semibold transition hover:bg-[#15171a] hover:text-white" type="submit">
            Rename
          </button>
        </form>
      </section>

      <section className="grid overflow-hidden rounded-lg border border-[#d5dde2] bg-white shadow-sm">
        <div className="grid min-h-40" style={{
          gridTemplateColumns: `repeat(${palette.colors.length}, minmax(0, 1fr))`,
        }}>
          {palette.colors.map((color, index) => (
            <div className="flex min-h-36 items-end p-3" key={`${color}-${index}`} style={{ backgroundColor: color }}>
              <span className="rounded bg-white/85 px-2 py-1 font-mono text-xs font-semibold text-[#15171a] shadow-sm">
                {color}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ExportBlock
          filename={`${filename}-variables.css`}
          label="CSS variables"
          mimeType="text/css"
          value={cssExport}
        />
        <ExportBlock
          filename={`${filename}.json`}
          label="JSON"
          mimeType="application/json"
          value={jsonExport}
        />
        <ExportBlock
          filename={`${filename}-tailwind.config.ts`}
          label="Tailwind config"
          mimeType="text/typescript"
          value={tailwindExport}
        />
      </section>
    </div>
  );
}
