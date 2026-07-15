import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyBarChart } from "@/components/dashboard/monthly-bar-chart";
import { getMonthlyRevenue, getMonthlyCampaignCounts } from "@/lib/dashboard-queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AnalyticsPage() {
  await requireRole(["ADMIN", "FINANCE"]);

  const [revenueData, campaignCounts, campaigns, marketingUsers] = await Promise.all([
    getMonthlyRevenue(12),
    getMonthlyCampaignCounts(12),
    prisma.campaign.findMany({
      where: { deletedAt: null },
      select: {
        customerType: true,
        numberOfSnaps: true,
        assignedUserId: true,
        status: true,
        finance: { select: { finalAmount: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "MARKETING", deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  const totalCampaigns = campaigns.length;

  const revenueByType = {
    AGENCY: campaigns
      .filter((c) => c.customerType === "AGENCY")
      .reduce((s, c) => s + Number(c.finance?.finalAmount ?? 0), 0),
    DIRECT_COMPANY: campaigns
      .filter((c) => c.customerType === "DIRECT_COMPANY")
      .reduce((s, c) => s + Number(c.finance?.finalAmount ?? 0), 0),
  };

  const snapDistribution = Array.from({ length: 7 }, (_, i) => ({
    label: `${i + 1} Snap${i > 0 ? "s" : ""}`,
    value: campaigns.filter((c) => c.numberOfSnaps === i + 1).length,
  }));

  const marketingPerformance = marketingUsers.map((u) => {
    const assigned = campaigns.filter((c) => c.assignedUserId === u.id);
    const doneCampaigns = assigned.filter((c) => ["COMPLETED", "FEEDBACK_RECEIVED"].includes(c.status));
    const snapsDone = doneCampaigns.reduce((sum, c) => sum + c.numberOfSnaps, 0);
    return {
      id: u.id,
      name: u.name,
      adv: assigned.length,
      snapsDone,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Business performance across the last 12 months</p>
      </div>

      <div className="max-w-xs">
        <MiniStat label="Total Campaigns" value={String(totalCampaigns)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue per Month</CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Customer Type</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart
              data={[
                { label: "Agencies", value: revenueByType.AGENCY },
                { label: "Direct", value: revenueByType.DIRECT_COMPANY },
              ]}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Campaigns by Snap Count</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart data={snapDistribution} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketing Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Adv</TableHead>
                <TableHead className="text-right">Snaps Done</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketingPerformance.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-right">{m.adv}</TableCell>
                  <TableCell className="text-right">{m.snapsDone}</TableCell>
                </TableRow>
              ))}
              {marketingPerformance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    No marketing team members yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
