export function getAdminEmails(): string[] {
  return (process.env.SPECTRO_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  return getAdminEmails().includes(normalizedEmail);
}

export function getSafeRedirectPath(value: FormDataEntryValue | string | null | undefined, fallback = "/plugin/connect"): string {
  const path = String(value || "").trim();

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}
