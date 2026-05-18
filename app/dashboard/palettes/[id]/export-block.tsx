"use client";

import { useState } from "react";

type ExportBlockProps = {
  filename: string;
  label: string;
  mimeType: string;
  value: string;
};

export function ExportBlock({
  filename,
  label,
  mimeType,
  value,
}: ExportBlockProps) {
  const [copyLabel, setCopyLabel] = useState("Copy");

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(value);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy"), 1400);
    } catch {
      setCopyLabel("Failed");
      window.setTimeout(() => setCopyLabel("Copy"), 1400);
    }
  }

  function downloadExport() {
    const blob = new Blob([value], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <article className="grid gap-3 rounded-lg border border-[#d5dde2] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{label}</h2>
        <div className="flex items-center gap-2">
          <button
            className="h-9 rounded-md border border-[#b9c0c7] px-3 text-sm font-semibold transition hover:border-[#15171a]"
            onClick={copyExport}
            type="button"
          >
            {copyLabel}
          </button>
          <button
            className="h-9 rounded-md bg-[#15171a] px-3 text-sm font-semibold text-white transition hover:bg-[#2d3338]"
            onClick={downloadExport}
            type="button"
          >
            Download
          </button>
        </div>
      </div>
      <pre className="max-h-80 overflow-auto rounded-md bg-[#111418] p-4 text-xs leading-5 text-[#eef4f6]">
        <code>{value}</code>
      </pre>
    </article>
  );
}
