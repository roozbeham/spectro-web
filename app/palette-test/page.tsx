"use client";

import { useEffect, useState } from "react";
import type {
  GeneratePaletteResponse,
  GeneratedPalette,
  PaletteListResponse,
  SavedPalette,
  SavePaletteResponse,
} from "@/lib/contracts/palette";

type PaletteMode = "neutral" | "status";

export default function PaletteTestPage() {
  const [seedHex, setSeedHex] = useState("#35ADE9");
  const [mode, setMode] = useState<PaletteMode>("neutral");
  const [palette, setPalette] = useState<GeneratedPalette>({
    id: "preview",
    name: "Generated Palette",
    seedHex: "#35ADE9",
    mode: "neutral",
    colors: [
      "#FFFFFF",
      "#F5F7FA",
      "#EDEFF4",
      "#E1E4EA",
      "#CACFD8",
      "#99A0AE",
      "#717784",
      "#525866",
      "#343A46",
      "#1F2530",
      "#0E121B",
    ],
    colorData: [],
    settings: {},
    source: "web",
  });
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadSavedPalettes() {
    const response = await fetch("/api/v1/palettes");
    const data = await response.json() as PaletteListResponse;
    setSavedPalettes(data.palettes);
  }

  useEffect(() => {
    let isMounted = true;

    fetch("/api/v1/palettes")
      .then((response) => response.json() as Promise<PaletteListResponse>)
      .then((data) => {
        if (isMounted) {
          setSavedPalettes(data.palettes);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSavedPalettes([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function generatePalette(nextSeedHex = seedHex) {
    setIsLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/v1/palettes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seedHex: nextSeedHex,
          mode,
          source: "web",
        }),
      });

      if (!response.ok) {
        throw new Error("The API did not return a palette.");
      }

      const data = await response.json() as GeneratePaletteResponse;
      setPalette(data.palette);
    } catch {
      setError("Palette generation failed. Check that the API server is running.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveCurrentPalette() {
    if (!palette) {
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/v1/palettes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          palette,
          name: palette.name,
        }),
      });

      if (!response.ok) {
        throw new Error("The API did not save the palette.");
      }

      const data = await response.json() as SavePaletteResponse;
      setSavedPalettes((current) => [data.palette, ...current]);
      setNotice("Palette saved locally.");
    } catch {
      setError("Palette save failed. Check the palettes API route.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f8] px-6 py-8 text-[#15171a] sm:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-[#d5dde2] pb-6">
          <p className="text-sm font-medium uppercase text-[#697177]">
            Spectro API Test
          </p>
          <h1 className="text-3xl font-semibold sm:text-5xl">
            Generate and save a palette
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#5c6268]">
            This page sends POST requests to the palette API, then saves the response
            to the local development palette store.
          </p>
        </header>

        <section className="grid gap-5 rounded-lg border border-[#d5dde2] bg-white p-5 shadow-sm sm:grid-cols-[220px_150px_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-2 text-sm font-medium text-[#343a40]">
            Seed color
            <input
              className="h-12 rounded-md border border-[#b9c0c7] px-3 font-mono text-base outline-none transition focus:border-[#2374ab] focus:ring-4 focus:ring-[#35ade9]/20"
              value={seedHex}
              onChange={(event) => setSeedHex(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-[#343a40]">
            Mode
            <select
              className="h-12 rounded-md border border-[#b9c0c7] bg-white px-3 text-base outline-none transition focus:border-[#2374ab] focus:ring-4 focus:ring-[#35ade9]/20"
              value={mode}
              onChange={(event) => setMode(event.target.value as PaletteMode)}
            >
              <option value="neutral">Neutral</option>
              <option value="status">Status</option>
            </select>
          </label>

          <div className="flex h-12 items-center gap-3">
            <div
              className="h-12 w-12 rounded-md border border-[#b9c0c7]"
              style={{ backgroundColor: seedHex }}
              aria-label="Seed color preview"
            />
            <p className="text-sm leading-6 text-[#5c6268]">
              Try a hex color like <span className="font-mono">#FF5733</span>.
            </p>
          </div>

          <button
            className="h-12 rounded-md bg-[#15171a] px-5 text-sm font-semibold text-white transition hover:bg-[#2d3338] disabled:cursor-not-allowed disabled:bg-[#8b9298]"
            onClick={() => generatePalette()}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate"}
          </button>
        </section>

        {error ? (
          <p className="rounded-md border border-[#d64f4f] bg-[#fff1f1] px-4 py-3 text-sm font-medium text-[#9f2727]">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="rounded-md border border-[#78b98b] bg-[#effaf2] px-4 py-3 text-sm font-medium text-[#24703d]">
            {notice}
          </p>
        ) : null}

        {palette ? (
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{palette.name}</h2>
                <p className="text-sm text-[#5c6268]">
                  Seed: {palette.seedHex} · Mode: {palette.mode}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <p className="text-sm font-medium text-[#697177]">
                  {palette.colors.length} colors returned by the API
                </p>
                <button
                  className="h-10 rounded-md border border-[#15171a] px-4 text-sm font-semibold transition hover:bg-[#15171a] hover:text-white disabled:cursor-not-allowed disabled:border-[#8b9298] disabled:text-[#8b9298]"
                  onClick={saveCurrentPalette}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save palette"}
                </button>
              </div>
            </div>

            <div className="grid overflow-hidden rounded-lg border border-[#d5dde2] sm:grid-cols-11">
              {palette.colors.map((color, index) => (
                <div
                  className="flex min-h-24 items-end p-3 sm:min-h-72"
                  key={`${color}-${index}`}
                  style={{ backgroundColor: color }}
                >
                  <span className="rounded bg-white/85 px-2 py-1 font-mono text-xs font-semibold text-[#15171a] shadow-sm">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Saved palettes</h2>
              <p className="text-sm text-[#5c6268]">
                Local development storage for the first save/list API contract.
              </p>
            </div>
            <button
              className="h-10 rounded-md border border-[#b9c0c7] px-4 text-sm font-semibold transition hover:border-[#15171a]"
              onClick={() => loadSavedPalettes()}
            >
              Refresh
            </button>
          </div>

          {savedPalettes.length ? (
            <div className="grid gap-3">
              {savedPalettes.map((savedPalette) => (
                <article
                  className="grid gap-3 rounded-lg border border-[#d5dde2] bg-white p-4 shadow-sm sm:grid-cols-[220px_1fr]"
                  key={savedPalette.id}
                >
                  <div>
                    <h3 className="font-semibold">{savedPalette.name}</h3>
                    <p className="mt-1 text-sm text-[#5c6268]">
                      {savedPalette.mode} · {savedPalette.colors.length} colors
                    </p>
                  </div>
                  <div className="grid min-h-14 overflow-hidden rounded-md border border-[#d5dde2]" style={{
                    gridTemplateColumns: `repeat(${savedPalette.colors.length}, minmax(0, 1fr))`,
                  }}>
                    {savedPalette.colors.map((color, index) => (
                      <div
                        key={`${savedPalette.id}-${color}-${index}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-[#b9c0c7] bg-white px-4 py-8 text-center text-sm text-[#5c6268]">
              No saved palettes yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
