"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { captureSchema, type CaptureInput } from "@/lib/validation";
import { addCapture } from "@/app/(app)/campaigns/actions";
import { FileUploadField } from "@/components/campaigns/file-upload-field";

export function CaptureDialog({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof captureSchema>, unknown, CaptureInput>({
    resolver: zodResolver(captureSchema),
    defaultValues: { numberOfCaptures: 0, engagement: "", comments: "", screenshotUrl: "" },
  });

  async function onSubmit(data: CaptureInput) {
    try {
      await addCapture(campaignId, data);
      toast.success("24-hour results added");
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Camera className="size-4" />
            Add 24-Hour Results
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add 24-Hour Results</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="numberOfCaptures">
                Number of Captures <span className="text-destructive">*</span>
              </Label>
              <Input id="numberOfCaptures" type="number" {...register("numberOfCaptures")} />
              {errors.numberOfCaptures && (
                <p className="text-xs text-destructive">{errors.numberOfCaptures.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="engagement">
                Engagement <span className="text-destructive">*</span>
              </Label>
              <Input id="engagement" placeholder="e.g. 1.2k views" {...register("engagement")} />
              {errors.engagement && <p className="text-xs text-destructive">{errors.engagement.message}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea id="comments" rows={2} {...register("comments")} />
          </div>
          <FileUploadField
            label="Screenshot"
            value={watch("screenshotUrl") ?? ""}
            onChange={(url) => setValue("screenshotUrl", url)}
            folder="captures"
          />
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
