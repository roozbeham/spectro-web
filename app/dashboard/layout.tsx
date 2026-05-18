import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseAuthConfig } from "@/lib/supabase/env";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const email = hasSupabaseAuthConfig()
    ? (await (await createClient()).auth.getUser()).data.user?.email || "Signed in"
    : "Supabase Auth setup pending";

  return (
    <div className="min-h-screen bg-[#f4f7f8] text-[#15171a]">
      <header className="border-b border-[#d5dde2] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-10">
          <Link className="text-xl font-semibold" href="/">
            Spectro
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link className="rounded-md px-3 py-2 text-[#4c555d] transition hover:text-[#15171a]" href="/dashboard">
              Overview
            </Link>
            <Link className="rounded-md px-3 py-2 text-[#4c555d] transition hover:text-[#15171a]" href="/dashboard/palettes">
              Palettes
            </Link>
            <Link className="rounded-md border border-[#b9c0c7] px-3 py-2 transition hover:border-[#15171a]" href="/palette-test">
              API test
            </Link>
            <form action={signOut}>
              <button className="rounded-md bg-[#15171a] px-3 py-2 text-white transition hover:bg-[#2d3338]" type="submit">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-10">
        <p className="mb-6 text-sm text-[#5c6268]">
          {email}
        </p>
        {children}
      </main>
    </div>
  );
}
