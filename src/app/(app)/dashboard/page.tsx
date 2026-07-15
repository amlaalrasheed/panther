import { requireUser } from "@/lib/auth-helpers";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { FinanceDashboard } from "@/components/dashboard/finance-dashboard";
import { MarketingDashboard } from "@/components/dashboard/marketing-dashboard";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening today</p>
      </div>
      {user.role === "ADMIN" && <AdminDashboard />}
      {user.role === "FINANCE" && <FinanceDashboard />}
      {user.role === "MARKETING" && <MarketingDashboard userId={user.id} />}
    </div>
  );
}
