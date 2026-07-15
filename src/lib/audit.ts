import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "LOGIN" | "STATUS_CHANGE";

export async function writeAuditLog(params: {
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  let ipAddress: string | null = null;
  try {
    const h = await headers();
    ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  } catch {
    // headers() unavailable outside a request scope (e.g. seed scripts) — skip.
  }

  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue === undefined ? undefined : JSON.parse(JSON.stringify(params.oldValue)),
      newValue: params.newValue === undefined ? undefined : JSON.parse(JSON.stringify(params.newValue)),
      ipAddress,
    },
  });
}
