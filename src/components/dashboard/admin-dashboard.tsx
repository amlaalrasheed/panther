import Link from "next/link";
import { DollarSign, Wallet, TrendingUp, Target, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonthlyBarChart } from "@/components/dashboard/monthly-bar-chart";
import { CampaignMiniList } from "@/components/dashboard/campaign-mini-list";
import {
  getAdminKpis,
  getMonthlyRevenue,
  getMonthlyCampaignCounts,
  getTopCustomers,
  getCommonWidgets,
} from "@/lib/dashboard-queries";
import { formatCurrency } from "@/lib/format";

export async function AdminDashboard() {
  const [kpis, revenueData, campaignCounts, topCustomers, topAgencies, widgets] = await Promise.all([
    getAdminKpis(),
    getMonthlyRevenue(),
    getMonthlyCampaignCounts(),
    getTopCustomers("DIRECT_COMPANY"),
    getTopCustomers("AGENCY"),
    getCommonWidgets(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue This Month" value={formatCurrency(kpis.revenueThisMonth)} icon={DollarSign} />
        <StatCard label="Revenue This Year" value={formatCurrency(kpis.revenueThisYear)} icon={TrendingUp} />
        <StatCard
          label="Outstanding Payments"
          value={formatCurrency(kpis.outstanding)}
          icon={Wallet}
          tone={kpis.outstanding > 0 ? "warning" : "default"}
        />
        <StatCard label="Avg. Adv Value" value={formatCurrency(kpis.averageCampaignValue)} icon={Target} />
        <StatCard label="Paid Adv" value={String(kpis.paidCount)} icon={CheckCircle2} tone="good" />
        <StatCard label="Unpaid Adv" value={String(kpis.unpaidCount)} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart data={revenueData} format="currency" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Campaigns per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart data={campaignCounts} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {topCustomers.length === 0 && <p className="text-sm text-muted-foreground">No revenue recorded yet.</p>}
            {topCustomers.map((c, i) => (
              <Link
                key={c.id}
                href={`/companies/${c.id}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span className="truncate">
                  <span className="text-muted-foreground">{i + 1}.</span> {c.name}
                </span>
                <span className="font-medium">{formatCurrency(c.revenue)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Advertising Agencies</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {topAgencies.length === 0 && <p className="text-sm text-muted-foreground">No revenue recorded yet.</p>}
            {topAgencies.map((c, i) => (
              <Link
                key={c.id}
                href={`/companies/${c.id}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span className="truncate">
                  <span className="text-muted-foreground">{i + 1}.</span> {c.name}
                </span>
                <span className="font-medium">{formatCurrency(c.revenue)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Advertisements</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignMiniList campaigns={widgets.today} emptyText="Nothing scheduled today." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Advertisements</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignMiniList campaigns={widgets.upcoming} emptyText="No upcoming campaigns." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
