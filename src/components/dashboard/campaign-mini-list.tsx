import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type CampaignItem = {
  id: string;
  campaignTitle: string;
  campaignCode: string;
  adDate: Date | null;
  status: keyof typeof STATUS_LABELS;
  company: { name: string };
};

export function CampaignMiniList({ campaigns, emptyText }: { campaigns: CampaignItem[]; emptyText: string }) {
  if (campaigns.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {campaigns.map((c) => (
        <Link
          key={c.id}
          href={`/campaigns/${c.id}`}
          className="flex items-center justify-between rounded-lg border p-2.5 text-sm hover:bg-accent"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{c.campaignTitle}</p>
            <p className="truncate text-xs text-muted-foreground">
              {c.company.name} · {formatDate(c.adDate)}
            </p>
          </div>
          <Badge className={cn("shrink-0 border-0 text-[11px]", STATUS_COLORS[c.status])}>
            {STATUS_LABELS[c.status]}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
