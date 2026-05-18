"use client";

import { useState } from "react";

type Palette = {
  id: string;
  name: string;
  seedHex: string;
  colors: string[];
};

export default function PaletteTestPage() {
  const [seedHex, setSeedHex] = useState("#35ADE9");
  const [palette, setPalette] = useState<Palette>({
    id: "preview",
    name: "Generated Palette",
    seedHex: "#35ADE9",
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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function generatePalette(nextSeedHex = seedHex) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/palettes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seedHex: nextSeedHex,
        }),
      });

      if (!response.ok) {
        throw new Error("The API did not return a palette.");
      }

      const data = await response.json();
      setPalette(data.palette);
    } catch {
      setError("Palette generation failed. Check that the API server is running.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-6 py-8 text-[#15171a] sm:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-[#d8d0c2] pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#697177]">
            Spectro API Test
          </p>
          <h1 className="text-3xl font-semibold sm:text-5xl">
            Generate a palette
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#5c6268]">
            This page sends a POST request to the API and shows the palette it gets back.
          </p>
        </header>

        <section className="grid gap-5 rounded-lg border border-[#d8d0c2] bg-white p-5 shadow-sm sm:grid-cols-[220px_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-2 text-sm font-medium text-[#343a40]">
            Seed color
            <input
              className="h-12 rounded-md border border-[#b9c0c7] px-3 font-mono text-base outline-none transition focus:border-[#2374ab] focus:ring-4 focus:ring-[#35ade9]/20"
              value={seedHex}
              onChange={(event) => setSeedHex(event.target.value)}
            />
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

        {palette ? (
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{palette.name}</h2>
                <p className="text-sm text-[#5c6268]">Seed: {palette.seedHex}</p>
              </div>
              <p className="text-sm font-medium text-[#697177]">
                {palette.colors.length} colors returned by the API
              </p>
            </div>

            <div className="grid overflow-hidden rounded-lg border border-[#d8d0c2] sm:grid-cols-11">
              {palette.colors.map((color) => (
                <div
                  className="flex min-h-24 items-end p-3 sm:min-h-72"
                  key={color}
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
      </div>
    </main>
  );
}
