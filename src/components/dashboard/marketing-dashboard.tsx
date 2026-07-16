import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CampaignMiniList } from "@/components/dashboard/campaign-mini-list";
import { prisma } from "@/lib/prisma";
import { getCommonWidgets } from "@/lib/dashboard-queries";

export async function MarketingDashboard({
  userId,
  isManager,
}: {
  userId: string;
  isManager: boolean;
}) {
  const [widgets, awaitingCaptureNumbers] = await Promise.all([
    // Managers oversee the whole team, so drop the per-user filter.
    getCommonWidgets("MARKETING", isManager ? undefined : userId),
    prisma.campaign.findMany({
      where: {
        deletedAt: null,
        posted: true,
        captures: { none: {} },
        ...(isManager ? {} : { assignedUserId: userId }),
      },
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
  ]);

  return (
    <div className="flex flex-col gap-4">
      {/* Both cards below only surface campaigns scheduled today or awaiting
          24h results — on a day with neither, this is the only way back to
          the rest of the assigned campaigns (and the 24h capture form, which
          lives on each campaign's own page, not here). */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link href="/campaigns">
              {isManager ? "Team Campaigns" : "My Campaigns"}
              <ArrowRight className="size-4" />
            </Link>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isManager ? "Today's Team Campaigns" : "Today's Assigned Campaigns"}</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignMiniList
              campaigns={widgets.today}
              emptyText={isManager ? "Nothing scheduled for the team today." : "Nothing assigned to you today."}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Awaiting 24-Hour Capture Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignMiniList campaigns={awaitingCaptureNumbers} emptyText="Nothing pending capture uploads." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
