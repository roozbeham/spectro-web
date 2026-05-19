import Link from "next/link";

export default function NoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8] px-6 py-10 text-[#15171a]">
      <section className="w-full max-w-xl rounded-lg border border-[#d5dde2] bg-white p-6 shadow-sm">
        <Link className="text-xl font-semibold" href="/">
          Spectro
        </Link>
        <p className="mt-10 text-sm font-medium uppercase text-[#697177]">
          Access limited
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          This page is not available yet.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#5c6268]">
          Spectro Web dashboard pages are currently limited while we build the Figma plugin account flow.
          You can still connect the plugin and use your Spectro account for sync.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link className="flex h-11 items-center justify-center rounded-md bg-[#15171a] px-4 text-sm font-semibold text-white transition hover:bg-[#2d3338]" href="/plugin/connect">
            Connect Figma plugin
          </Link>
          <Link className="flex h-11 items-center justify-center rounded-md border border-[#b9c0c7] px-4 text-sm font-semibold transition hover:border-[#15171a]" href="/">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
