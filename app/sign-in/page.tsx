import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f8] px-6 py-10 text-[#15171a]">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-[#d5dde2] bg-white shadow-sm lg:grid-cols-[1fr_420px]">
        <div className="flex min-h-[560px] flex-col justify-between bg-[#15171a] p-8 text-white">
          <Link className="text-xl font-semibold" href="/">
            Spectro
          </Link>
          <div className="flex flex-col gap-5">
            <h1 className="text-4xl font-semibold leading-tight">
              Continue your palette work.
            </h1>
            <p className="max-w-sm text-base leading-7 text-white/70">
              Access saved palettes, cloud generation, exports, and Figma sync from
              your Spectro account.
            </p>
          </div>
          <div className="grid grid-cols-6 overflow-hidden rounded-md">
            {["#F6F8F9", "#C8DBE4", "#6AB9DC", "#0EA5E9", "#1B6D93", "#0C1417"].map((color) => (
              <div className="h-12" key={color} style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-[#5c6268]">
              Use the email connected to your Spectro workspace.
            </p>
          </div>

          <form className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-[#343a40]">
              Email
              <input
                className="h-12 rounded-md border border-[#b9c0c7] px-3 text-base outline-none transition focus:border-[#2374ab] focus:ring-4 focus:ring-[#35ade9]/20"
                name="email"
                placeholder="you@example.com"
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#343a40]">
              Password
              <input
                className="h-12 rounded-md border border-[#b9c0c7] px-3 text-base outline-none transition focus:border-[#2374ab] focus:ring-4 focus:ring-[#35ade9]/20"
                name="password"
                type="password"
              />
            </label>
            <button
              className="mt-2 h-12 rounded-md bg-[#15171a] px-5 text-sm font-semibold text-white transition hover:bg-[#2d3338]"
              type="button"
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-sm text-[#5c6268]">
            New to Spectro?{" "}
            <Link className="font-semibold text-[#15171a]" href="/sign-up">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
