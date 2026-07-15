"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { financeUpdateSchema, type FinanceUpdateInput } from "@/lib/validation";
import { updateCampaignFinance } from "@/app/(app)/campaigns/actions";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { FileUploadField } from "@/components/campaigns/file-upload-field";

export function FinanceForm({
  campaignId,
  defaultValues,
}: {
  campaignId: string;
  defaultValues: FinanceUpdateInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<z.input<typeof financeUpdateSchema>, unknown, FinanceUpdateInput>({
    resolver: zodResolver(financeUpdateSchema),
    defaultValues,
  });

  async function onSubmit(data: FinanceUpdateInput) {
    try {
      await updateCampaignFinance(campaignId, data);
      toast.success("Financial information updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-price">Price</Label>
          <Input id="f-price" type="number" step="0.01" {...register("price")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-discount">Discount</Label>
          <Input id="f-discount" type="number" step="0.01" {...register("discount")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-vat">VAT</Label>
          <Input id="f-vat" type="number" step="0.01" {...register("vat")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-invoiceNumber">Invoice Number</Label>
          <Input id="f-invoiceNumber" {...register("invoiceNumber")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Payment Method</Label>
          <Select
            value={watch("paymentMethod") || undefined}
            onValueChange={(v) => setValue("paymentMethod", v as FinanceUpdateInput["paymentMethod"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Payment Status</Label>
          <Select
            value={watch("paymentStatus")}
            onValueChange={(v) => setValue("paymentStatus", v as FinanceUpdateInput["paymentStatus"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-amountPaid">Amount Paid</Label>
          <Input id="f-amountPaid" type="number" step="0.01" {...register("amountPaid")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-depositDate">Deposit Date</Label>
          <Input id="f-depositDate" type="date" {...register("depositDate")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-expectedDepositDate">Expected Deposit Date</Label>
          <Input id="f-expectedDepositDate" type="date" {...register("expectedDepositDate")} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-3">
          <Label htmlFor="f-transactionRef">Transaction Reference</Label>
          <Input id="f-transactionRef" {...register("transactionRef")} />
        </div>
        <div className="flex flex-col gap-2">
          <FileUploadField
            label="Invoice Attachment"
            value={watch("invoiceAttachmentUrl") ?? ""}
            onChange={(url) => setValue("invoiceAttachmentUrl", url)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <FileUploadField
            label="Receipt Attachment"
            value={watch("receiptAttachmentUrl") ?? ""}
            onChange={(url) => setValue("receiptAttachmentUrl", url)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-3">
          <Label htmlFor="f-financialNotes">Financial Notes</Label>
          <Textarea id="f-financialNotes" rows={2} {...register("financialNotes")} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} size="sm">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Save Financial Info
        </Button>
      </div>
    </form>
  );
}
