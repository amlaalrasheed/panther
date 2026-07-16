"use client";

import { useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { campaignSchema, campaignCreateSchema, type CampaignInput } from "@/lib/validation";
import { createCampaign, updateCampaignDetails } from "@/app/(app)/campaigns/actions";
import { PRIORITY_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";

type CompanyOption = { id: string; name: string; nameAr: string | null; type: "AGENCY" | "DIRECT_COMPANY" };
type ContactOption = { id: string; companyId: string; name: string };
type UserOption = { id: string; name: string };

const SNAP_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function CampaignForm({
  mode,
  companies,
  contacts,
  marketingUsers,
  defaultValues,
  campaignId,
}: {
  mode: "create" | "edit";
  companies: CompanyOption[];
  contacts: ContactOption[];
  marketingUsers: UserOption[];
  defaultValues?: Partial<CampaignInput>;
  campaignId?: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof campaignSchema>, unknown, CampaignInput>({
    resolver: zodResolver(mode === "create" ? campaignCreateSchema : campaignSchema),
    defaultValues: {
      companyId: "",
      contactId: "",
      productName: "",
      campaignTitle: "",
      campaignTitleAr: "",
      description: "",
      brief: "",
      numberOfSnaps: 1,
      packageName: "",
      adDate: "",
      postingTime: "",
      priority: "NORMAL",
      assignedUserId: "",
      price: 0,
      discount: 0,
      vat: 0,
      paymentStatus: "PENDING",
      depositDate: "",
      amountPaid: 0,
      financialNotes: "",
      ...defaultValues,
    },
  });

  const companyId = watch("companyId");
  const filteredContacts = useMemo(
    () => contacts.filter((c) => c.companyId === companyId),
    [contacts, companyId]
  );

  const companyOptions = companies.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: c.nameAr ?? undefined,
  }));

  async function onSubmit(data: CampaignInput) {
    try {
      if (mode === "create") {
        await createCampaign(data);
        toast.success("Booking created");
      } else if (campaignId) {
        await updateCampaignDetails(campaignId, data);
        toast.success("Campaign updated");
        router.push(`/campaigns/${campaignId}`);
      }
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>
              Company <span className="text-destructive">*</span>
            </Label>
            <Combobox
              options={companyOptions}
              value={companyId}
              onChange={(v) => {
                setValue("companyId", v);
                setValue("contactId", "");
              }}
              placeholder="Select company..."
            />
            {errors.companyId && <p className="text-xs text-destructive">{errors.companyId.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label>
              Contact Person <span className="text-destructive">*</span>
            </Label>
            <Select value={watch("contactId") || undefined} onValueChange={(v) => setValue("contactId", v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select contact..." />
              </SelectTrigger>
              <SelectContent>
                {filteredContacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
                {filteredContacts.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No contacts on file</div>
                )}
              </SelectContent>
            </Select>
            {errors.contactId && <p className="text-xs text-destructive">{errors.contactId.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input id="productName" {...register("productName")} />
            {errors.productName && <p className="text-xs text-destructive">{errors.productName.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="packageName">Package Name</Label>
            <Input id="packageName" {...register("packageName")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="campaignTitle">Campaign Title</Label>
            <Input id="campaignTitle" {...register("campaignTitle")} />
            {errors.campaignTitle && (
              <p className="text-xs text-destructive">{errors.campaignTitle.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="campaignTitleAr">Campaign Title (Arabic)</Label>
            <Input id="campaignTitleAr" dir="rtl" {...register("campaignTitleAr")} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="description">Campaign Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="brief">Campaign Brief</Label>
            <Textarea id="brief" rows={3} {...register("brief")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Number of Snaps</Label>
            <Select
              value={String(watch("numberOfSnaps"))}
              onValueChange={(v) => setValue("numberOfSnaps", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SNAP_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} Snap{n > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Priority</Label>
            <Select
              value={watch("priority")}
              onValueChange={(v) => setValue("priority", v as CampaignInput["priority"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="adDate">
              Advertisement Date <span className="text-destructive">*</span>
            </Label>
            <Input id="adDate" type="date" {...register("adDate")} />
            {errors.adDate && <p className="text-xs text-destructive">{errors.adDate.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="postingTime">
              Posting Time <span className="text-destructive">*</span>
            </Label>
            <Input id="postingTime" type="time" {...register("postingTime")} />
            {errors.postingTime && <p className="text-xs text-destructive">{errors.postingTime.message}</p>}
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Assigned Marketing Member</Label>
            <Select
              value={watch("assignedUserId") || undefined}
              onValueChange={(v) => setValue("assignedUserId", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {marketingUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {mode === "create" && (
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">
              Campaign Price (SAR) <span className="text-destructive">*</span>
            </Label>
            <Input id="price" type="number" step="0.01" {...register("price")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="discount">
              Discount (SAR) <span className="text-destructive">*</span>
            </Label>
            <Input id="discount" type="number" step="0.01" {...register("discount")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="vat">
              VAT (SAR) <span className="text-destructive">*</span>
            </Label>
            <Input id="vat" type="number" step="0.01" {...register("vat")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>
              Payment Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("paymentStatus")}
              onValueChange={(v) => setValue("paymentStatus", v as CampaignInput["paymentStatus"])}
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
            <Label htmlFor="amountPaid">
              Amount Paid (SAR) <span className="text-destructive">*</span>
            </Label>
            <Input id="amountPaid" type="number" step="0.01" {...register("amountPaid")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="depositDate">
              Deposit Date <span className="text-destructive">*</span>
            </Label>
            <Input id="depositDate" type="date" {...register("depositDate")} />
            {errors.depositDate && <p className="text-xs text-destructive">{errors.depositDate.message}</p>}
          </div>
          <div className="flex flex-col gap-2 sm:col-span-3">
            <Label htmlFor="financialNotes">Financial Notes</Label>
            <Textarea id="financialNotes" rows={2} {...register("financialNotes")} />
          </div>
        </CardContent>
      </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Create Booking" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
