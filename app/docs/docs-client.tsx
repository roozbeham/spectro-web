"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const FIGMA_PLUGIN_URL = "https://www.figma.com/community/plugin/1545144879515549356/";

const navigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Overview", href: "#overview" },
      { title: "Install Spectro", href: "#install-spectro" },
      { title: "First Palette", href: "#first-palette" },
      { title: "Interface Overview", href: "#interface-overview" },
    ],
  },
  {
    title: "Palette Modes",
    items: [
      { title: "Neutral Palettes", href: "#neutral-palettes" },
      { title: "Status Palettes", href: "#status-palettes" },
      { title: "Light and Dark Modes", href: "#light-dark-modes" },
    ],
  },
  {
    title: "Color Controls",
    items: [
      { title: "HEX Input", href: "#hex-input" },
      { title: "Figma Color Picking", href: "#figma-color-picking" },
      { title: "Safe Random Colors", href: "#safe-random-colors" },
      { title: "Lock Matching", href: "#lock-matching" },
    ],
  },
  {
    title: "Figma Workflow",
    items: [
      { title: "Export Variables", href: "#export-variables" },
      { title: "Update Variables", href: "#update-variables" },
      { title: "Insert Guides", href: "#insert-guides" },
      { title: "Export JSON", href: "#export-json" },
    ],
  },
  {
    title: "Managing Work",
    items: [
      { title: "Saved Palettes", href: "#saved-palettes" },
      { title: "Troubleshooting", href: "#troubleshooting" },
      { title: "Privacy and Data", href: "#privacy-data" },
      { title: "Support", href: "#support" },
    ],
  },
];

const onThisPage = [
  { title: "Overview", href: "#overview" },
  { title: "Palette modes", href: "#palette-modes" },
  { title: "Working with colors", href: "#working-with-colors" },
  { title: "Exporting to Figma", href: "#exporting-to-figma" },
  { title: "Troubleshooting", href: "#troubleshooting" },
  { title: "Support", href: "#support" },
];

const quickStarts = [
  {
    title: "Generate a neutral palette",
    text: "Start with a brand HEX, tune the curve and stops, then export a balanced neutral scale as Figma variables.",
    href: "#neutral-palettes",
  },
  {
    title: "Create status colors",
    text: "Build Primary, Positive, Negative, Warning, and Info scales for light or dark UI surfaces.",
    href: "#status-palettes",
  },
  {
    title: "Send colors to Figma",
    text: "Export variables, update an existing collection, or insert a visual guide into the canvas.",
    href: "#exporting-to-figma",
  },
];

const neutralSteps = [
  "Enter or pick a HEX color.",
  "Adjust hue and lightness until the anchor feels right.",
  "Shape the curve to control how quickly the scale moves from light to dark.",
  "Choose the number of stops and density.",
  "Export the final scale as Figma variables or insert a guide.",
];

const statusSteps = [
  "Open Status mode.",
  "Choose a brand Primary color or generate a safe random one.",
  "Switch between light and dark friendly output.",
  "Regenerate all status colors or lock individual role groups.",
  "Preview the palette in realistic UI before exporting.",
];

const troubleshooting = [
  {
    title: "Export button does nothing",
    text: "Generate a palette first, then retry. Spectro only exports when a valid current scale exists.",
  },
  {
    title: "Variables already exist",
    text: "Use Update existing variables when you want to preserve the same collection and replace values.",
  },
  {
    title: "A color feels off in dark mode",
    text: "Use the dark mode friendly status option and accept Spectro's compatibility adjustment when it appears.",
  },
  {
    title: "Cloud generation failed",
    text: "Retry the sync action. If the issue persists, keep working with the current local palette and contact support.",
  },
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path
        d="M9.167 15.833a6.667 6.667 0 1 0 0-13.333 6.667 6.667 0 0 0 0 13.333ZM17.5 17.5l-3.625-3.625"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path
        d="M16.25 12.3A6.95 6.95 0 0 1 7.7 3.75 7.08 7.08 0 1 0 16.25 12.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 13.333a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666ZM10 1.667v2M10 16.333v2M4.108 4.108l1.417 1.417M14.475 14.475l1.417 1.417M1.667 10h2M16.333 10h2M4.108 15.892l1.417-1.417M14.475 5.525l1.417-1.417"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path
        d="M7.5 4.167 13.333 10 7.5 15.833"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DocsClient() {
  const [query, setQuery] = useState("");
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedTheme = window.localStorage.getItem("spectro-docs-theme");
      if (storedTheme === "dark" || storedTheme === "light") {
        setIsDark(storedTheme === "dark");
        return;
      }

      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (isDark === null) {
      return;
    }

    window.localStorage.setItem("spectro-docs-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const useDarkTheme = isDark === true;

  const filteredNavigation = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return navigation;
    }

    return navigation
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.title.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <main
      className={[
        "min-h-screen scroll-smooth",
        useDarkTheme ? "bg-[#08090b] text-[#f4f7f8]" : "bg-[#f5f7f8] text-[#111318]",
      ].join(" ")}
    >
      <header
        className={[
          "sticky top-0 z-40 border-b backdrop-blur-xl",
          useDarkTheme ? "border-white/10 bg-[#08090b]/88" : "border-[#dfe5e8] bg-[#f5f7f8]/88",
        ].join(" ")}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="flex shrink-0 items-center gap-2" href="/" aria-label="Spectro home">
            <img alt="" className="h-8 w-8 rounded-[8px]" src="/landing/spectro-icon.png" />
            <span className="text-[17px] font-bold tracking-[-0.02em]">Spectro Docs</span>
          </Link>

          <label
            className={[
              "ml-auto hidden h-10 w-full max-w-[360px] items-center gap-2 rounded-lg border px-3 text-sm md:flex",
              useDarkTheme
                ? "border-white/10 bg-white/[0.04] text-white/55"
                : "border-[#d9e0e4] bg-white text-[#6b747c]",
            ].join(" ")}
          >
            <SearchIcon />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-inherit"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search docs..."
              type="search"
              value={query}
            />
            <span className="rounded border border-current px-1.5 py-0.5 text-[11px] opacity-60">/</span>
          </label>

          <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
            <Link
              className={[
                "rounded-md px-3 py-2 transition",
                useDarkTheme ? "text-white/62 hover:text-white" : "text-[#626b73] hover:text-[#111318]",
              ].join(" ")}
              href="/"
            >
              Home
            </Link>
            <a
              className={[
                "rounded-md px-3 py-2 transition",
                useDarkTheme ? "text-white/62 hover:text-white" : "text-[#626b73] hover:text-[#111318]",
              ].join(" ")}
              href={FIGMA_PLUGIN_URL}
              rel="noreferrer"
              target="_blank"
            >
              Figma Plugin
            </a>
          </nav>

          <button
            aria-label={useDarkTheme ? "Use light theme" : "Use dark theme"}
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition",
              useDarkTheme
                ? "border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]"
                : "border-[#d9e0e4] bg-white text-[#343a40] hover:bg-[#eef3f5]",
            ].join(" ")}
            onClick={() => setIsDark((current) => !current)}
            type="button"
          >
            {useDarkTheme ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-0 px-4 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)_230px] lg:px-8">
        <aside
          className={[
            "lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-r lg:py-8 lg:pr-6",
            useDarkTheme ? "lg:border-white/10" : "lg:border-[#dfe5e8]",
          ].join(" ")}
        >
          <label
            className={[
              "mt-5 flex h-10 items-center gap-2 rounded-lg border px-3 text-sm md:hidden",
              useDarkTheme
                ? "border-white/10 bg-white/[0.04] text-white/55"
                : "border-[#d9e0e4] bg-white text-[#6b747c]",
            ].join(" ")}
          >
            <SearchIcon />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-inherit"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search docs..."
              type="search"
              value={query}
            />
          </label>

          <nav className="grid gap-7 py-6 lg:py-0" aria-label="Docs navigation">
            {filteredNavigation.map((group) => (
              <section key={group.title}>
                <h2
                  className={[
                    "mb-2 text-xs font-semibold uppercase tracking-[0.08em]",
                    useDarkTheme ? "text-white/88" : "text-[#1d2329]",
                  ].join(" ")}
                >
                  {group.title}
                </h2>
                <div className="grid gap-1">
                  {group.items.map((item) => (
                    <a
                      className={[
                        "rounded-md px-3 py-2 text-sm font-medium transition",
                        useDarkTheme
                          ? "text-white/52 hover:bg-white/[0.05] hover:text-white"
                          : "text-[#626b73] hover:bg-white hover:text-[#111318]",
                      ].join(" ")}
                      href={item.href}
                      key={item.href}
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 px-0 py-8 sm:py-12 lg:px-12 xl:px-16">
          <section id="overview" className="scroll-mt-24">
            <p
              className={[
                "mb-4 text-sm font-semibold uppercase tracking-[0.12em]",
                useDarkTheme ? "text-[#35ade9]" : "text-[#0b88c4]",
              ].join(" ")}
            >
              Getting started
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Design-ready color systems from one brand color.
            </h1>
            <p
              className={[
                "mt-5 max-w-3xl text-lg leading-8",
                useDarkTheme ? "text-white/62" : "text-[#5d6770]",
              ].join(" ")}
            >
              Spectro is a Figma plugin for generating balanced neutral palettes, semantic status
              colors, Figma variables, and visual palette guides for modern product interfaces.
            </p>

            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {quickStarts.map((item) => (
                <a
                  className={[
                    "group rounded-lg border p-5 transition",
                    useDarkTheme
                      ? "border-white/10 bg-white/[0.035] hover:border-[#35ade9]/50"
                      : "border-[#dde4e8] bg-white hover:border-[#35ade9]/60",
                  ].join(" ")}
                  href={item.href}
                  key={item.title}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-base font-semibold">{item.title}</h2>
                    <span className="mt-0.5 text-[#35ade9] transition group-hover:translate-x-0.5">
                      <ArrowIcon />
                    </span>
                  </div>
                  <p className={["mt-3 text-sm leading-6", useDarkTheme ? "text-white/55" : "text-[#69737b]"].join(" ")}>
                    {item.text}
                  </p>
                </a>
              ))}
            </div>
          </section>

          <section
            id="install-spectro"
            className={[
              "mt-12 scroll-mt-24 rounded-lg border p-5 sm:p-6",
              useDarkTheme ? "border-white/10 bg-white/[0.035]" : "border-[#dde4e8] bg-white",
            ].join(" ")}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.02em]">Install Spectro</h2>
                <p className={["mt-2 max-w-2xl text-sm leading-6", useDarkTheme ? "text-white/58" : "text-[#626b73]"].join(" ")}>
                  Install the plugin from Figma Community, then run it from Figma&apos;s plugins menu.
                  No Spectro account is required for the current plugin workflow.
                </p>
              </div>
              <a
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#111318] px-5 text-sm font-semibold text-white transition hover:bg-[#252a30]"
                href={FIGMA_PLUGIN_URL}
                rel="noreferrer"
                target="_blank"
              >
                <img alt="" className="h-5 w-5" src="/landing/figma-logo.svg" />
                Open in Figma
              </a>
            </div>
          </section>

          <section id="first-palette" className="mt-14 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">First Palette</h2>
            <p className={["mt-3 max-w-3xl leading-7", useDarkTheme ? "text-white/60" : "text-[#5d6770]"].join(" ")}>
              Pick a mode, enter a HEX color, review the generated swatches, then export variables
              or insert a guide into your file.
            </p>
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <img
                alt="Spectro neutral palette plugin interface"
                className={[
                  "w-full rounded-lg border object-cover",
                  useDarkTheme ? "border-white/10" : "border-[#dbe3e7]",
                ].join(" ")}
                src="/landing/neutral-panel.png"
              />
              <img
                alt="Spectro status palette plugin interface"
                className={[
                  "w-full rounded-lg border object-cover",
                  useDarkTheme ? "border-white/10" : "border-[#dbe3e7]",
                ].join(" ")}
                src="/landing/status-panel.png"
              />
            </div>
          </section>

          <section id="interface-overview" className="mt-14 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Interface Overview</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Mode tabs", "Switch between Neutral and Status workflows."],
                ["Color controls", "Enter HEX, pick from canvas, randomize, lock, or adjust colors."],
                ["Scale preview", "Review generated swatches and curve behavior before export."],
                ["Footer actions", "Export variables, update existing variables, insert guides, or open support."],
              ].map(([title, text]) => (
                <div
                  className={[
                    "rounded-lg border p-5",
                    useDarkTheme ? "border-white/10 bg-white/[0.035]" : "border-[#dde4e8] bg-white",
                  ].join(" ")}
                  key={title}
                >
                  <h3 className="font-semibold">{title}</h3>
                  <p className={["mt-2 text-sm leading-6", useDarkTheme ? "text-white/55" : "text-[#69737b]"].join(" ")}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="palette-modes" className="mt-16 scroll-mt-24">
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">Palette Modes</h2>
            <div className="mt-7 grid gap-8">
              <section id="neutral-palettes" className="scroll-mt-24">
                <h3 className="text-xl font-semibold">Neutral Palettes</h3>
                <p className={["mt-3 max-w-3xl leading-7", useDarkTheme ? "text-white/60" : "text-[#5d6770]"].join(" ")}>
                  Neutral mode creates grayscale or near-neutral ramps for surfaces, borders, text,
                  icons, and UI states. It is the best starting point for product interface foundations.
                </p>
                <ol className="mt-5 grid gap-2">
                  {neutralSteps.map((step, index) => (
                    <li className={["flex gap-3 text-sm", useDarkTheme ? "text-white/62" : "text-[#5d6770]"].join(" ")} key={step}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#35ade9] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section id="status-palettes" className="scroll-mt-24">
                <h3 className="text-xl font-semibold">Status Palettes</h3>
                <p className={["mt-3 max-w-3xl leading-7", useDarkTheme ? "text-white/60" : "text-[#5d6770]"].join(" ")}>
                  Status mode generates semantic role scales for Primary, Positive, Negative,
                  Warning, and Info. Use it when you need color tokens for alerts, badges, progress,
                  validation, notifications, and product states.
                </p>
                <ol className="mt-5 grid gap-2">
                  {statusSteps.map((step, index) => (
                    <li className={["flex gap-3 text-sm", useDarkTheme ? "text-white/62" : "text-[#5d6770]"].join(" ")} key={step}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#35ade9] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section id="light-dark-modes" className="scroll-mt-24">
                <h3 className="text-xl font-semibold">Light and Dark Modes</h3>
                <p className={["mt-3 max-w-3xl leading-7", useDarkTheme ? "text-white/60" : "text-[#5d6770]"].join(" ")}>
                  Spectro can generate status palettes tuned for light or dark UI. If a selected
                  color may feel unstable in dark mode, the plugin offers an adjustment so the final
                  palette stays usable.
                </p>
              </section>
            </div>
          </section>

          <section id="working-with-colors" className="mt-16 scroll-mt-24">
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">Working With Colors</h2>
            <div className="mt-6 grid gap-4">
              {[
                ["hex-input", "HEX Input", "Paste a HEX color to use it as the source for the active palette mode."],
                ["figma-color-picking", "Figma Color Picking", "Pick a fill or stroke color from the current canvas selection when you want Spectro to match existing design work."],
                ["safe-random-colors", "Safe Random Colors", "Generate a fresh primary color that avoids repeated hue families and stays usable for status palettes."],
                ["lock-matching", "Lock Matching", "Lock the source color when exact brand matching matters, or unlock it when Spectro should optimize the ramp."],
              ].map(([id, title, text]) => (
                <section
                  className={[
                    "scroll-mt-24 rounded-lg border p-5",
                    useDarkTheme ? "border-white/10 bg-white/[0.035]" : "border-[#dde4e8] bg-white",
                  ].join(" ")}
                  id={id}
                  key={id}
                >
                  <h3 className="font-semibold">{title}</h3>
                  <p className={["mt-2 text-sm leading-6", useDarkTheme ? "text-white/55" : "text-[#69737b]"].join(" ")}>
                    {text}
                  </p>
                </section>
              ))}
            </div>
          </section>

          <section id="exporting-to-figma" className="mt-16 scroll-mt-24">
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">Exporting to Figma</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["export-variables", "Export Variables", "Create a Figma variable collection from the current palette."],
                ["update-variables", "Update Variables", "Replace values in an existing Spectro variable collection while keeping the collection structure."],
                ["insert-guides", "Insert Guides", "Add a visual palette guide or UI preview frame to the canvas for review and handoff."],
                ["export-json", "Export JSON", "Copy palette data for implementation, documentation, or downstream tooling."],
              ].map(([id, title, text]) => (
                <section
                  className={[
                    "scroll-mt-24 rounded-lg border p-5",
                    useDarkTheme ? "border-white/10 bg-white/[0.035]" : "border-[#dde4e8] bg-white",
                  ].join(" ")}
                  id={id}
                  key={id}
                >
                  <h3 className="font-semibold">{title}</h3>
                  <p className={["mt-2 text-sm leading-6", useDarkTheme ? "text-white/55" : "text-[#69737b]"].join(" ")}>
                    {text}
                  </p>
                </section>
              ))}
            </div>
          </section>

          <section id="saved-palettes" className="mt-16 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Saved Palettes</h2>
            <p className={["mt-3 max-w-3xl leading-7", useDarkTheme ? "text-white/60" : "text-[#5d6770]"].join(" ")}>
              Spectro stores saved palettes locally in the plugin, so you can switch between recent
              palettes, rename them, and reuse them in later sessions without setting up an account.
            </p>
          </section>

          <section id="troubleshooting" className="mt-16 scroll-mt-24">
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">Troubleshooting</h2>
            <div className="mt-6 grid gap-4">
              {troubleshooting.map((item) => (
                <div
                  className={[
                    "rounded-lg border p-5",
                    useDarkTheme ? "border-white/10 bg-white/[0.035]" : "border-[#dde4e8] bg-white",
                  ].join(" ")}
                  key={item.title}
                >
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className={["mt-2 text-sm leading-6", useDarkTheme ? "text-white/55" : "text-[#69737b]"].join(" ")}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="privacy-data" className="mt-16 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Privacy and Data</h2>
            <p className={["mt-3 max-w-3xl leading-7", useDarkTheme ? "text-white/60" : "text-[#5d6770]"].join(" ")}>
              The current Spectro plugin does not require a login. Saved palettes and onboarding
              state are stored through Figma client storage. Palette generation may call Spectro
              Cloud APIs, and lightweight analytics/performance events help diagnose reliability.
            </p>
          </section>

          <section
            id="support"
            className={[
              "mt-16 scroll-mt-24 rounded-lg border p-6",
              useDarkTheme ? "border-[#35ade9]/25 bg-[#35ade9]/10" : "border-[#b9e4f8] bg-[#e9f8ff]",
            ].join(" ")}
          >
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Support</h2>
            <p className={["mt-3 max-w-3xl leading-7", useDarkTheme ? "text-white/68" : "text-[#35505e]"].join(" ")}>
              Use the plugin&apos;s support menu to report issues, request features, or support
              Spectro. Include your palette mode, source HEX, and what you expected to happen.
            </p>
          </section>
        </article>

        <aside className="hidden lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:py-8">
          <div className="pl-6">
            <h2 className={["text-sm font-semibold", useDarkTheme ? "text-white/82" : "text-[#20262c]"].join(" ")}>
              On this page
            </h2>
            <nav className="mt-3 grid gap-1" aria-label="On this page">
              {onThisPage.map((item) => (
                <a
                  className={[
                    "rounded-md py-1.5 text-sm transition",
                    useDarkTheme ? "text-white/45 hover:text-white" : "text-[#69737b] hover:text-[#111318]",
                  ].join(" ")}
                  href={item.href}
                  key={item.href}
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </main>
  );
}
