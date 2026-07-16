import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SATISFACTION_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type FeedbackData = {
  satisfaction: keyof typeof SATISFACTION_LABELS;
  rating: number;
  notes: string | null;
  futureCooperation: boolean;
  createdAt: Date | string;
  recordedBy: { name: string };
};

export function FeedbackDisplay({ feedback }: { feedback: FeedbackData | null }) {
  if (!feedback) {
    return <p className="text-sm text-muted-foreground">No feedback recorded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{SATISFACTION_LABELS[feedback.satisfaction]}</Badge>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn(
                "size-4",
                n <= feedback.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {feedback.futureCooperation ? "Open to future cooperation" : "Not open to future cooperation"}
        </span>
      </div>
      {feedback.notes && <p className="text-muted-foreground">{feedback.notes}</p>}
      <p className="text-xs text-muted-foreground">
        Recorded by {feedback.recordedBy.name} · {formatDateTime(feedback.createdAt)}
      </p>
    </div>
  );
}
