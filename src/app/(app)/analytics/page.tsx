import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyBarChart } from "@/components/dashboard/monthly-bar-chart";
import {
  getMonthlyRevenue,
  getMonthlyCampaignCounts,
  getMonthlyAssignedCampaignCounts,
} from "@/lib/dashboard-queries";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { subDays, subMonths, startOfMonth } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PERIODS = {
  "12m": { label: "Last 12 Months", chartMonths: 12 },
  month: { label: "This Month", chartMonths: 1 },
  "90d": { label: "Last 90 Days", chartMonths: 3 },
} as const;

type Period = keyof typeof PERIODS;

function windowStartFor(period: Period) {
  const now = new Date();
  if (period === "month") return startOfMonth(now);
  if (period === "90d") return subDays(now, 90);
  return startOfMonth(subMonths(now, 11));
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await requireUser();
  const { period: periodParam } = await searchParams;
  const period: Period = periodParam && periodParam in PERIODS ? (periodParam as Period) : "12m";
  const isManager = user.role === "MARKETING" && !!user.isManager;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {user.role !== "MARKETING"
              ? "Business performance"
              : isManager
                ? "Team performance"
                : "Your performance"}{" "}
            — {PERIODS[period].label.toLowerCase()}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {(Object.keys(PERIODS) as Period[]).map((key) => (
            <Link
              key={key}
              href={`/analytics?period=${key}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                key === period
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {PERIODS[key].label}
            </Link>
          ))}
        </div>
      </div>

      {user.role === "MARKETING" ? (
        <MarketingAnalytics userId={user.id} period={period} isManager={isManager} />
      ) : (
        <AdminFinanceAnalytics period={period} />
      )}
    </div>
  );
}

async function AdminFinanceAnalytics({ period }: { period: Period }) {
  const windowStart = windowStartFor(period);

  const [revenueData, campaignCounts, campaigns, marketingUsers] = await Promise.all([
    getMonthlyRevenue(PERIODS[period].chartMonths),
    getMonthlyCampaignCounts(PERIODS[period].chartMonths),
    prisma.campaign.findMany({
      where: { deletedAt: null, createdAt: { gte: windowStart } },
      select: {
        numberOfSnaps: true,
        assignedUserId: true,
        posted: true,
        company: { select: { type: true } },
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
      .filter((c) => c.company.type === "AGENCY")
      .reduce((s, c) => s + Number(c.finance?.finalAmount ?? 0), 0),
    DIRECT_COMPANY: campaigns
      .filter((c) => c.company.type === "DIRECT_COMPANY")
      .reduce((s, c) => s + Number(c.finance?.finalAmount ?? 0), 0),
  };

  const snapDistribution = Array.from({ length: 7 }, (_, i) => ({
    label: `${i + 1} Snap${i > 0 ? "s" : ""}`,
    value: campaigns.filter((c) => c.numberOfSnaps === i + 1).length,
  }));

  const marketingPerformance = marketingUsers.map((u) => {
    const assigned = campaigns.filter((c) => c.assignedUserId === u.id);
    const doneCampaigns = assigned.filter((c) => c.posted);
    const snapsDone = doneCampaigns.reduce((sum, c) => sum + c.numberOfSnaps, 0);
    return {
      id: u.id,
      name: u.name,
      adv: assigned.length,
      snapsDone,
    };
  });

  return (
    <>
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

      <MarketingLeaderboard performance={marketingPerformance} />
    </>
  );
}

async function MarketingAnalytics({
  userId,
  period,
  isManager,
}: {
  userId: string;
  period: Period;
  isManager: boolean;
}) {
  const windowStart = windowStartFor(period);

  const [campaignCounts, myCampaigns, allCampaigns, marketingUsers] = await Promise.all([
    isManager
      ? getMonthlyCampaignCounts(PERIODS[period].chartMonths)
      : getMonthlyAssignedCampaignCounts(userId, PERIODS[period].chartMonths),
    prisma.campaign.findMany({
      // Managers see the whole team's campaigns; members see only their own.
      where: {
        deletedAt: null,
        createdAt: { gte: windowStart },
        ...(isManager ? {} : { assignedUserId: userId }),
      },
      select: {
        id: true,
        campaignCode: true,
        campaignTitle: true,
        numberOfSnaps: true,
        posted: true,
        adDate: true,
        captures: { select: { numberOfCaptures: true } },
      },
      orderBy: { adDate: "asc" },
    }),
    // Non-financial fields only — used for the team leaderboard, which
    // Marketing is allowed to see (adv counts / snaps / captures, no money).
    prisma.campaign.findMany({
      where: { deletedAt: null, createdAt: { gte: windowStart } },
      select: {
        assignedUserId: true,
        numberOfSnaps: true,
        posted: true,
        captures: { select: { numberOfCaptures: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "MARKETING", deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  const totalAssigned = myCampaigns.length;
  const snapsDone = myCampaigns.filter((c) => c.posted).reduce((sum, c) => sum + c.numberOfSnaps, 0);
  const totalCaptures = myCampaigns.reduce(
    (sum, c) => sum + c.captures.reduce((s, cap) => s + (cap.numberOfCaptures ?? 0), 0),
    0
  );

  const snapDistribution = Array.from({ length: 7 }, (_, i) => ({
    label: `${i + 1} Snap${i > 0 ? "s" : ""}`,
    value: myCampaigns.filter((c) => c.numberOfSnaps === i + 1).length,
  }));

  const marketingPerformance = marketingUsers.map((u) => {
    const assigned = allCampaigns.filter((c) => c.assignedUserId === u.id);
    const done = assigned.filter((c) => c.posted);
    return {
      id: u.id,
      name: u.name,
      adv: assigned.length,
      snapsDone: done.reduce((sum, c) => sum + c.numberOfSnaps, 0),
      captures: assigned.reduce(
        (sum, c) => sum + c.captures.reduce((s, cap) => s + (cap.numberOfCaptures ?? 0), 0),
        0
      ),
    };
  });

  const now = new Date();
  const upcoming = myCampaigns.filter((c) => c.adDate && c.adDate >= now && !c.posted);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <MiniStat label={isManager ? "Team Adv" : "My Adv"} value={String(totalAssigned)} />
        <MiniStat label="Snaps Done" value={String(snapsDone)} />
        <MiniStat label="Captures Logged" value={String(totalCaptures)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isManager ? "Team" : "My"} Campaigns per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart data={campaignCounts} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{isManager ? "Team" : "My"} Campaigns by Snap Count</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart data={snapDistribution} />
          </CardContent>
        </Card>
      </div>

      <WorkloadCard title="Upcoming Ad Dates" campaigns={upcoming} emptyText="Nothing upcoming." />

      <MarketingLeaderboard performance={marketingPerformance} />
    </>
  );
}

function WorkloadCard({
  title,
  campaigns,
  emptyText,
}: {
  title: string;
  campaigns: { id: string; campaignCode: string; campaignTitle: string; adDate: Date | null }[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {campaigns.length === 0 && <p className="text-sm text-muted-foreground">{emptyText}</p>}
        {campaigns.map((c) => (
          <Link
            key={c.id}
            href={`/campaigns/${c.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm hover:bg-muted"
          >
            <div>
              <p className="font-medium">{c.campaignTitle}</p>
              <p className="text-xs text-muted-foreground">
                {c.campaignCode} · {formatDate(c.adDate)}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function MarketingLeaderboard({
  performance,
}: {
  performance: { id: string; name: string; adv: number; snapsDone: number; captures?: number }[];
}) {
  const showCaptures = performance.some((m) => m.captures !== undefined);
  return (
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
              {showCaptures && <TableHead className="text-right">Captures</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {performance.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-right">{m.adv}</TableCell>
                <TableCell className="text-right">{m.snapsDone}</TableCell>
                {showCaptures && <TableCell className="text-right">{m.captures ?? 0}</TableCell>}
              </TableRow>
            ))}
            {performance.length === 0 && (
              <TableRow>
                <TableCell colSpan={showCaptures ? 4 : 3} className="py-8 text-center text-muted-foreground">
                  No marketing team members yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
