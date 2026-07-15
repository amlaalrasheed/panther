import { CheckCircle2 } from "lucide-react";
import { STATUS_LABELS, type CampaignStatus } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

type EventItem = {
  id: string;
  toStatus: CampaignStatus;
  note: string | null;
  createdAt: string | Date;
  user: { name: string };
};

export function Timeline({ events }: { events: EventItem[] }) {
  return (
    <ol className="flex flex-col gap-0">
      {events.map((event, i) => (
        <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i !== events.length - 1 && (
            <span className="absolute top-5 left-[9px] h-full w-px bg-border" aria-hidden />
          )}
          <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">{STATUS_LABELS[event.toStatus]}</p>
            {event.note && <p className="text-xs text-muted-foreground">{event.note}</p>}
            <p className="text-xs text-muted-foreground">
              {event.user.name} · {formatDateTime(event.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
