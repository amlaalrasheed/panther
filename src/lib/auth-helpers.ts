import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AppRole } from "@/lib/constants";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

// Redirects to /dashboard (rather than throwing) when the role doesn't
// match, so an unauthorized deep link degrades gracefully instead of 500ing.
export async function requireRole(allowed: AppRole[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) redirect("/dashboard");
  return user;
}

export const canSeeFinance = (role: AppRole) => role === "ADMIN" || role === "FINANCE";
export const isAdmin = (role: AppRole) => role === "ADMIN";
