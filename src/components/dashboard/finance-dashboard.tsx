import { Wallet, Clock, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CampaignMiniList } from "@/components/dashboard/campaign-mini-list";
import { prisma } from "@/lib/prisma";
import { getCommonWidgets } from "@/lib/dashboard-queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { SATISFACTION_LABELS } from "@/lib/constants";
import Link from "next/link";

export async function FinanceDashboard() {
  const [pendingAgg, awaitingDepositCount, todaysBookings, widgets, recentFeedback] = await Promise.all([
    prisma.campaignFinance.aggregate({
      _sum: { remainingBalance: true },
      where: { paymentStatus: { in: ["PENDING", "PARTIALLY_PAID"] } },
    }),
    prisma.campaignFinance.count({ where: { paymentStatus: "PENDING" } }),
    prisma.campaign.count({
      where: { deletedAt: null, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    getCommonWidgets("FINANCE"),
    prisma.feedback.findMany({
      include: { campaign: { include: { company: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Pending Payments"
          value={formatCurrency(Number(pendingAgg._sum.remainingBalance ?? 0))}
          icon={Wallet}
          tone="warning"
        />
        <StatCard label="Awaiting Deposit" value={String(awaitingDepositCount)} icon={Clock} />
        <StatCard label="Today's Bookings" value={String(todaysBookings)} icon={CalendarDays} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
        <Card>
          <CardHeader>
            <CardTitle>Recent Customer Feedback</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recentFeedback.length === 0 && <p className="text-sm text-muted-foreground">No feedback yet.</p>}
            {recentFeedback.map((f) => (
              <Link
                key={f.id}
                href={`/campaigns/${f.campaignId}`}
                className="rounded-lg border p-2.5 text-sm hover:bg-accent"
              >
                <p className="font-medium">{f.campaign.company.name}</p>
                <p className="text-xs text-muted-foreground">
                  {SATISFACTION_LABELS[f.satisfaction]} · {f.rating}/5 · {formatDate(f.createdAt)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
