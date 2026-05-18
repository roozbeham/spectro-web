"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseAuthConfig } from "@/lib/supabase/env";

function getFormValue(formData: FormData, key: string): string {
  return String(formData.get(key) || "").trim();
}

function redirectWithMessage(pathname: string, type: "error" | "message", message: string): never {
  const searchParams = new URLSearchParams({
    [type]: message,
  });

  redirect(`${pathname}?${searchParams.toString()}`);
}

export async function signIn(formData: FormData) {
  if (!hasSupabaseAuthConfig()) {
    redirectWithMessage("/sign-in", "error", "Supabase Auth is missing the public key.");
  }

  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirectWithMessage("/sign-in", "error", "Enter your email and password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithMessage("/sign-in", "error", error.message);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  if (!hasSupabaseAuthConfig()) {
    redirectWithMessage("/sign-up", "error", "Supabase Auth is missing the public key.");
  }

  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirectWithMessage("/sign-up", "error", "Enter your email and password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirectWithMessage("/sign-up", "error", error.message);
  }

  revalidatePath("/", "layout");
  redirectWithMessage("/sign-in", "message", "Account created. Check your email if confirmation is enabled, then sign in.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
