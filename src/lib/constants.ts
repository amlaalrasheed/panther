export const CAMPAIGN_STATUSES = [
  "INQUIRY_RECEIVED",
  "WAITING_FOR_PAYMENT",
  "PAYMENT_RECEIVED",
  "SCHEDULED",
  "ASSIGNED",
  "POSTED",
  "WAITING_FOR_RESULTS",
  "COMPLETED",
  "FEEDBACK_RECEIVED",
  "CANCELLED",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  INQUIRY_RECEIVED: "Inquiry Received",
  WAITING_FOR_PAYMENT: "Waiting for Payment",
  PAYMENT_RECEIVED: "Payment Received",
  SCHEDULED: "Scheduled",
  ASSIGNED: "Assigned",
  POSTED: "Posted",
  WAITING_FOR_RESULTS: "Waiting for 24-Hour Results",
  COMPLETED: "Completed",
  FEEDBACK_RECEIVED: "Feedback Received",
  CANCELLED: "Cancelled",
};

export const STATUS_COLORS: Record<CampaignStatus, string> = {
  INQUIRY_RECEIVED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  WAITING_FOR_PAYMENT: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ASSIGNED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  POSTED: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  WAITING_FOR_RESULTS: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  COMPLETED: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  FEEDBACK_RECEIVED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  CANCELLED: "bg-red-200 text-red-950 dark:bg-red-900 dark:text-red-200",
};

export const ROLES = ["ADMIN", "FINANCE", "MARKETING"] as const;
export type AppRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Admin",
  FINANCE: "Financial Manager",
  MARKETING: "Marketing Team",
};

export const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "Urgent",
  NORMAL: "Normal",
  SCHEDULED: "Scheduled",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PARTIALLY_PAID: "Partially Paid",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  ONLINE: "Online",
};

export const SATISFACTION_LABELS: Record<string, string> = {
  SATISFIED: "Satisfied",
  NEUTRAL: "Neutral",
  NOT_SATISFIED: "Not Satisfied",
};

export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  AGENCY: "Advertising Agency",
  DIRECT_COMPANY: "Direct Company",
};

// The forward workflow order — used to render progress and to validate
// "next status" transitions in the UI (any status can still be set manually).
export const STATUS_ORDER: CampaignStatus[] = [
  "INQUIRY_RECEIVED",
  "WAITING_FOR_PAYMENT",
  "PAYMENT_RECEIVED",
  "SCHEDULED",
  "ASSIGNED",
  "POSTED",
  "WAITING_FOR_RESULTS",
  "COMPLETED",
  "FEEDBACK_RECEIVED",
];

export const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "saudipanther.sa";
