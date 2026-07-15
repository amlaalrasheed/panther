import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { saveUploadedFile } from "@/lib/storage";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  await requireUser();

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = (formData.get("folder") as string) || "misc";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const url = await saveUploadedFile(file, folder.replace(/[^a-zA-Z0-9_-]/g, ""));
  return NextResponse.json({ url });
}
