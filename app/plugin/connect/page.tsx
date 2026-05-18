import Link from "next/link";
import { createPluginConnectionAction } from "@/app/plugin/connect/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PluginConnectPageProps = {
  searchParams: Promise<{
    expires?: string;
    token?: string;
  }>;
};

export default async function PluginConnectPage({ searchParams }: PluginConnectPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const expiresAt = params.expires ? new Date(params.expires) : null;

  return (
    <main className="min-h-screen bg-[#f4f7f8] px-6 py-8 text-[#15171a] sm:px-10">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-3xl content-center gap-6">
        <div className="rounded-lg border border-[#d5dde2] bg-white p-6 shadow-sm">
          <Link className="text-xl font-semibold" href="/">
            Spectro
          </Link>

          <div className="mt-10">
            <p className="text-sm font-medium uppercase text-[#697177]">
              Figma Plugin
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
              Connect Spectro Plugin
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#5c6268]">
              This creates a short-lived connection token for the Figma plugin.
              In the next plugin step, Figma will open this page and capture the token automatically.
            </p>
          </div>

          <div className="mt-8 rounded-md border border-[#d5dde2] bg-[#f8fafb] p-4">
            <p className="text-sm text-[#5c6268]">Signed in as</p>
            <p className="mt-1 font-semibold">{data.user?.email || "Unknown user"}</p>
          </div>

          {params.token ? (
            <div className="mt-5 grid gap-3 rounded-md border border-[#78b98b] bg-[#effaf2] p-4">
              <p className="font-semibold text-[#24703d]">Connection token created</p>
              <p className="text-sm leading-6 text-[#315f3f]">
                This token expires {expiresAt ? expiresAt.toLocaleString() : "soon"}.
                For now, keep this page open; the Figma plugin exchange step comes next.
              </p>
              <code className="overflow-auto rounded-md bg-white p-3 text-xs text-[#15171a]">
                {params.token}
              </code>
            </div>
          ) : (
            <form action={createPluginConnectionAction} className="mt-5">
              <button className="h-11 rounded-md bg-[#15171a] px-4 text-sm font-semibold text-white transition hover:bg-[#2d3338]" type="submit">
                Create connection token
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
