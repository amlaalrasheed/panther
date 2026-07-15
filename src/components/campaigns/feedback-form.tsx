"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { feedbackSchema, type FeedbackInput } from "@/lib/validation";
import { submitFeedback } from "@/app/(app)/campaigns/actions";
import { SATISFACTION_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FeedbackForm({
  campaignId,
  defaultValues,
}: {
  campaignId: string;
  defaultValues?: Partial<FeedbackInput>;
}) {
  const router = useRouter();
  const {
    handleSubmit,
    watch,
    setValue,
    register,
    formState: { isSubmitting },
  } = useForm<z.input<typeof feedbackSchema>, unknown, FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      satisfaction: "NEUTRAL",
      rating: 3,
      notes: "",
      futureCooperation: true,
      ...defaultValues,
    },
  });

  async function onSubmit(data: FeedbackInput) {
    try {
      await submitFeedback(campaignId, data);
      toast.success("Feedback recorded");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const rating = Number(watch("rating"));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Satisfaction</Label>
          <Select
            value={watch("satisfaction")}
            onValueChange={(v) => setValue("satisfaction", v as FeedbackInput["satisfaction"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SATISFACTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Rating</Label>
          <div className="flex items-center gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setValue("rating", n)}>
                <Star
                  className={cn(
                    "size-5",
                    n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fb-notes">Feedback Notes</Label>
        <Textarea id="fb-notes" rows={2} {...register("notes")} />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={watch("futureCooperation")}
          onCheckedChange={(v) => setValue("futureCooperation", v)}
          id="futureCooperation"
        />
        <Label htmlFor="futureCooperation" className="font-normal">
          Open to future cooperation
        </Label>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Save Feedback
        </Button>
      </div>
    </form>
  );
}
