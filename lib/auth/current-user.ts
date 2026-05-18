import { hasSupabaseAuthConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserId(): Promise<string | undefined> {
  if (!hasSupabaseAuthConfig()) {
    return undefined;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}
