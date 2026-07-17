import { prisma } from "@/lib/prisma";
import { startOfMonth, startOfYear, startOfWeek, endOfWeek, startOfDay, endOfDay, subMonths, format } from "date-fns";

// Which assigned-user IDs a marketing view should be limited to:
//   - Admin / Finance  → null  (no limit; they see everything)
//   - Marketing member → just themselves
//   - Marketing manager → themselves + the members who report to them
export async function getMarketingScope(user: {
  id: string;
  role: "ADMIN" | "FINANCE" | "MARKETING";
  isManager?: boolean;
}): Promise<string[] | null> {
  if (user.role !== "MARKETING") return null;
  if (!user.isManager) return [user.id];
  const members = await prisma.user.findMany({
    where: { managerId: user.id, deletedAt: null },
    select: { id: true },
  });
  return [user.id, ...members.map((m) => m.id)];
}

export async function getAdminKpis() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [monthFinance, yearFinance, outstandingAgg, paidCount, unpaidCount, totalCampaigns, completedCount, avgAgg] =
    await Promise.all([
      prisma.campaignFinance.aggregate({
        _sum: { finalAmount: true },
        where: { paymentStatus: "PAID", depositDate: { gte: monthStart } },
      }),
      prisma.campaignFinance.aggregate({
        _sum: { finalAmount: true },
        where: { paymentStatus: "PAID", depositDate: { gte: yearStart } },
      }),
      prisma.campaignFinance.aggregate({ _sum: { remainingBalance: true } }),
      prisma.campaignFinance.count({ where: { paymentStatus: "PAID" } }),
      prisma.campaignFinance.count({ where: { paymentStatus: { in: ["PENDING", "PARTIALLY_PAID"] } } }),
      prisma.campaign.count({ where: { deletedAt: null } }),
      prisma.campaign.count({ where: { deletedAt: null, posted: true } }),
      prisma.campaignFinance.aggregate({ _avg: { finalAmount: true } }),
    ]);

  return {
    revenueThisMonth: Number(monthFinance._sum.finalAmount ?? 0),
    revenueThisYear: Number(yearFinance._sum.finalAmount ?? 0),
    outstanding: Number(outstandingAgg._sum.remainingBalance ?? 0),
    paidCount,
    unpaidCount,
    averageCampaignValue: Number(avgAgg._avg.finalAmount ?? 0),
    successRate: totalCampaigns ? Math.round((completedCount / totalCampaigns) * 100) : 0,
  };
}

// Both functions below used to run one Prisma query per month in a
// sequential loop (N round trips for N months). Replaced with a single
// grouped SQL query each — one round trip regardless of the window size —
// with any months that have no rows filled in as zero afterward.

export async function getMonthlyRevenue(months = 6) {
  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, months - 1));

  const rows = await prisma.$queryRaw<{ month: Date; total: number }[]>`
    SELECT date_trunc('month', "depositDate") AS month, SUM("finalAmount")::float AS total
    FROM "CampaignFinance"
    WHERE "paymentStatus" = 'PAID' AND "depositDate" >= ${windowStart}
    GROUP BY 1
  `;
  const byMonth = new Map(rows.map((r) => [format(r.month, "yyyy-MM"), Number(r.total)]));

  return Array.from({ length: months }, (_, i) => {
    const monthDate = subMonths(now, months - 1 - i);
    return { label: format(monthDate, "MMM"), value: byMonth.get(format(monthDate, "yyyy-MM")) ?? 0 };
  });
}

export async function getMonthlyCampaignCounts(months = 6) {
  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, months - 1));

  const rows = await prisma.$queryRaw<{ month: Date; count: number }[]>`
    SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
    FROM "Campaign"
    WHERE "deletedAt" IS NULL AND "createdAt" >= ${windowStart}
    GROUP BY 1
  `;
  const byMonth = new Map(rows.map((r) => [format(r.month, "yyyy-MM"), Number(r.count)]));

  return Array.from({ length: months }, (_, i) => {
    const monthDate = subMonths(now, months - 1 - i);
    return { label: format(monthDate, "MMM"), value: byMonth.get(format(monthDate, "yyyy-MM")) ?? 0 };
  });
}

export async function getMonthlyAssignedCampaignCounts(userIds: string[], months = 6) {
  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, months - 1));

  const rows = await prisma.campaign.findMany({
    where: { deletedAt: null, createdAt: { gte: windowStart }, assignedUserId: { in: userIds } },
    select: { createdAt: true },
  });
  const byMonth = new Map<string, number>();
  for (const r of rows) {
    const k = format(r.createdAt, "yyyy-MM");
    byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  }

  return Array.from({ length: months }, (_, i) => {
    const monthDate = subMonths(now, months - 1 - i);
    return { label: format(monthDate, "MMM"), value: byMonth.get(format(monthDate, "yyyy-MM")) ?? 0 };
  });
}

export async function getTopCustomers(type: "AGENCY" | "DIRECT_COMPANY" | undefined, limit = 10) {
  // select (not include) so only the one numeric field needed for the sum
  // crosses the wire per campaign, instead of every column on both models.
  const companies = await prisma.company.findMany({
    where: { deletedAt: null, ...(type ? { type } : {}) },
    select: {
      id: true,
      name: true,
      campaigns: {
        where: { deletedAt: null },
        select: { finance: { select: { finalAmount: true } } },
      },
    },
  });

  return companies
    .map((c) => ({
      id: c.id,
      name: c.name,
      revenue: c.campaigns.reduce((sum, camp) => sum + Number(camp.finance?.finalAmount ?? 0), 0),
    }))
    .filter((c) => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// `assignedUserIds` limits the widgets to campaigns assigned to those users
// (a marketing member/manager's scope). Pass null/undefined for no limit.
export async function getCommonWidgets(assignedUserIds?: string[] | null) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const assignedFilter = assignedUserIds ? { assignedUserId: { in: assignedUserIds } } : {};

  const [today, thisWeek, upcoming, completed, pending, late, recent] = await Promise.all([
    prisma.campaign.findMany({
      where: { deletedAt: null, adDate: { gte: todayStart, lte: todayEnd }, ...assignedFilter },
      select: {
        id: true,
        campaignTitle: true,
        campaignCode: true,
        adDate: true,
        posted: true,
        company: { select: { name: true } },
      },
      orderBy: { adDate: "asc" },
    }),
    prisma.campaign.count({
      where: { deletedAt: null, adDate: { gte: weekStart, lte: weekEnd }, ...assignedFilter },
    }),
    prisma.campaign.findMany({
      where: { deletedAt: null, adDate: { gt: todayEnd }, ...assignedFilter },
      select: {
        id: true,
        campaignTitle: true,
        campaignCode: true,
        adDate: true,
        posted: true,
        company: { select: { name: true } },
      },
      orderBy: { adDate: "asc" },
      take: 5,
    }),
    prisma.campaign.count({
      where: { deletedAt: null, posted: true, ...assignedFilter },
    }),
    prisma.campaign.count({
      where: { deletedAt: null, posted: false, ...assignedFilter },
    }),
    prisma.campaign.count({
      where: {
        deletedAt: null,
        posted: false,
        adDate: { lt: todayStart },
        ...assignedFilter,
      },
    }),
    prisma.campaign.findMany({
      where: { deletedAt: null, ...assignedFilter },
      select: {
        id: true,
        campaignTitle: true,
        campaignCode: true,
        adDate: true,
        posted: true,
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return { today, thisWeekCount: thisWeek, upcoming, completedCount: completed, pendingCount: pending, lateCount: late, recent };
}
