import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  nameAr: z.string().min(1, "Company name (Arabic) is required"),
  type: z.enum(["AGENCY", "DIRECT_COMPANY"]),
  city: z.string().optional().or(z.literal("")),
  industry: z.string().min(1, "Industry is required"),
  notes: z.string().optional().or(z.literal("")),
  trustedCustomer: z.boolean(),
});

export const contactSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1, "Contact name is required"),
  nameAr: z.string().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  isPrimary: z.boolean().optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;
export type ContactInput = z.infer<typeof contactSchema>;

export const campaignSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  contactId: z.string().min(1, "Contact is required"),
  productName: z.string().min(1, "Product name is required"),
  campaignTitle: z.string().min(1, "Campaign title is required"),
  campaignTitleAr: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  brief: z.string().optional().or(z.literal("")),
  numberOfSnaps: z.coerce.number().int().min(1).max(7),
  packageName: z.string().optional().or(z.literal("")),
  adDate: z.string().optional().or(z.literal("")),
  postingTime: z.string().optional().or(z.literal("")),
  priority: z.enum(["URGENT", "NORMAL", "SCHEDULED"]),
  assignedUserId: z.string().optional().or(z.literal("")),

  // Financial (Admin / Finance only — enforced server-side)
  price: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),
  vat: z.coerce.number().min(0).optional(),
  invoiceNumber: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "ONLINE"]).optional().or(z.literal("")),
  paymentStatus: z.enum(["PENDING", "PAID", "PARTIALLY_PAID"]).optional(),
  expectedDepositDate: z.string().optional().or(z.literal("")),
  amountPaid: z.coerce.number().min(0).optional(),
  financialNotes: z.string().optional().or(z.literal("")),
});

export type CampaignInput = z.infer<typeof campaignSchema>;

export const financeUpdateSchema = z.object({
  price: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  vat: z.coerce.number().min(0),
  invoiceNumber: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "ONLINE"]).optional().or(z.literal("")),
  paymentStatus: z.enum(["PENDING", "PAID", "PARTIALLY_PAID"]),
  depositDate: z.string().optional().or(z.literal("")),
  expectedDepositDate: z.string().optional().or(z.literal("")),
  amountPaid: z.coerce.number().min(0),
  transactionRef: z.string().optional().or(z.literal("")),
  invoiceAttachmentUrl: z.string().optional().or(z.literal("")),
  receiptAttachmentUrl: z.string().optional().or(z.literal("")),
  financialNotes: z.string().optional().or(z.literal("")),
});

export type FinanceUpdateInput = z.infer<typeof financeUpdateSchema>;

export const feedbackSchema = z.object({
  satisfaction: z.enum(["SATISFIED", "NEUTRAL", "NOT_SATISFIED"]),
  rating: z.coerce.number().int().min(1).max(5),
  notes: z.string().optional().or(z.literal("")),
  futureCooperation: z.boolean(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const captureSchema = z.object({
  numberOfCaptures: z.coerce.number().int().min(0).optional(),
  engagement: z.string().optional().or(z.literal("")),
  comments: z.string().optional().or(z.literal("")),
  screenshotUrl: z.string().optional().or(z.literal("")),
});

export type CaptureInput = z.infer<typeof captureSchema>;

export const commentSchema = z.object({
  body: z.string().min(1),
});

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["ADMIN", "FINANCE", "MARKETING"]),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
});

export type UserInput = z.infer<typeof userSchema>;
