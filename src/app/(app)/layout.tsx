import { requireUser } from "@/lib/auth-helpers";
import { AppShell } from "@/components/layout/app-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell user={{ name: user.name ?? user.email ?? "User", email: user.email ?? "", role: user.role }}>
      {children}
    </AppShell>
  );
}
