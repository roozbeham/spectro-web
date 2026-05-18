import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f7f8] px-6 py-8 text-[#15171a] sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-[#d5dde2] pb-5">
          <Link className="text-xl font-semibold" href="/">
            Spectro
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link className="rounded-md px-3 py-2 text-[#4c555d] transition hover:text-[#15171a]" href="/sign-in">
              Sign in
            </Link>
            <Link className="rounded-md bg-[#15171a] px-4 py-2 text-white transition hover:bg-[#2d3338]" href="/sign-up">
              Sign up
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 gap-10 py-12 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="flex max-w-2xl flex-col gap-6">
            <p className="text-sm font-medium uppercase text-[#697177]">
              Spectro Cloud
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
              Palette generation, saving, and sync in one place.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[#5c6268]">
              Spectro Web is becoming the account hub for saved palettes, Figma sync,
              exports, and protected cloud generation.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="flex h-12 items-center justify-center rounded-md bg-[#15171a] px-5 text-sm font-semibold text-white transition hover:bg-[#2d3338]" href="/dashboard">
                Open dashboard
              </Link>
              <Link className="flex h-12 items-center justify-center rounded-md border border-[#b9c0c7] px-5 text-sm font-semibold transition hover:border-[#15171a]" href="/palette-test">
                API test page
              </Link>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-[#d5dde2] bg-white p-4 shadow-sm">
            {[
              ["#F7F6F9", "#E9E6EF", "#B19EDC", "#8B5CF6", "#4D16CB", "#100C17"],
              ["#F6F8F7", "#CBE1D3", "#76D197", "#22C55E", "#27864A", "#0E1611"],
              ["#F9F6F6", "#E3C9C9", "#D96D6D", "#EF4444", "#901E1E", "#170D0D"],
              ["#F6F8F9", "#C8DBE4", "#6AB9DC", "#0EA5E9", "#1B6D93", "#0C1417"],
            ].map((row, rowIndex) => (
              <div className="grid h-16 overflow-hidden rounded-md" key={rowIndex} style={{
                gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
              }}>
                {row.map((color) => (
                  <div key={color} style={{ backgroundColor: color }} />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
