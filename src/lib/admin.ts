// Client-side admin email allowlist gate.
// Note: this only restricts the UI — Firestore security rules remain the
// authoritative boundary for admin data. Leave NEXT_PUBLIC_ADMIN_EMAILS empty
// to allow any authenticated user (legacy behaviour).
const getAllowlist = (): string[] =>
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = getAllowlist();
  if (allowlist.length === 0) return true;
  return allowlist.includes(email.toLowerCase());
}