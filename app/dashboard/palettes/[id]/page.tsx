import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createCssVariablesExport,
  createJsonExport,
  createSpectroThemeExport,
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
  const spectroThemeExport = createSpectroThemeExport(palette);
  const filename = palette.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "palette";
  const previewColors = getPreviewColors(palette.colors);

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

      <section className="grid gap-4 rounded-lg border border-[#d5dde2] bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold">UI preview</h2>
          <p className="mt-1 text-sm text-[#5c6268]">
            A quick product surface using this palette for background, content, and action states.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="rounded-lg border border-[#d5dde2] p-4" style={{
            backgroundColor: previewColors.background,
          }}>
            <div className="grid gap-4 rounded-lg border p-4 shadow-sm" style={{
              backgroundColor: previewColors.surface,
              borderColor: previewColors.border,
            }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: previewColors.muted }}>
                    Workspace
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold" style={{ color: previewColors.text }}>
                    Palette performance
                  </h3>
                </div>
                <button className="h-10 rounded-md px-4 text-sm font-semibold text-white" style={{
                  backgroundColor: previewColors.accent,
                }}>
                  Export
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Contrast checks", "24"],
                  ["Saved tokens", String(palette.colors.length)],
                  ["Exports", "3"],
                ].map(([label, value]) => (
                  <div className="rounded-md border p-4" key={label} style={{
                    backgroundColor: previewColors.card,
                    borderColor: previewColors.border,
                  }}>
                    <p className="text-sm" style={{ color: previewColors.muted }}>{label}</p>
                    <p className="mt-2 text-3xl font-semibold" style={{ color: previewColors.text }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                {[
                  ["Primary action", previewColors.accent],
                  ["Surface state", previewColors.mid],
                  ["Deep state", previewColors.dark],
                ].map(([label, color]) => (
                  <div className="flex items-center justify-between rounded-md border p-3" key={label} style={{
                    borderColor: previewColors.border,
                  }}>
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium" style={{ color: previewColors.text }}>{label}</span>
                    </div>
                    <span className="font-mono text-xs" style={{ color: previewColors.muted }}>{color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="grid gap-3 rounded-lg p-4 text-white" style={{
            backgroundColor: previewColors.dark,
          }}>
            <p className="text-sm font-semibold text-white/70">Callout</p>
            <h3 className="text-2xl font-semibold">Ready for Figma sync</h3>
            <p className="text-sm leading-6 text-white/75">
              This palette can become a saved cloud asset, an export preset, and later a synced plugin library.
            </p>
            <div className="mt-2 grid grid-cols-5 overflow-hidden rounded-md">
              {previewColors.strip.map((color) => (
                <div className="h-12" key={color} style={{ backgroundColor: color }} />
              ))}
            </div>
          </aside>
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
          filename={`${filename}-spectro-theme.config.ts`}
          label="Spectro theme config"
          mimeType="text/typescript"
          value={spectroThemeExport}
        />
      </section>
    </div>
  );
}

function getPreviewColors(colors: string[]) {
  const safeColors = colors.length ? colors : ["#FFFFFF", "#35ADE9", "#0E121B"];
  const lastIndex = safeColors.length - 1;
  const pick = (ratio: number) => safeColors[Math.min(lastIndex, Math.max(0, Math.round(lastIndex * ratio)))];

  return {
    background: pick(0),
    surface: pick(0.1),
    card: pick(0.18),
    border: pick(0.28),
    muted: pick(0.62),
    mid: pick(0.5),
    accent: pick(0.58),
    dark: pick(1),
    text: pick(0.9),
    strip: [pick(0), pick(0.25), pick(0.5), pick(0.75), pick(1)],
  };
}
