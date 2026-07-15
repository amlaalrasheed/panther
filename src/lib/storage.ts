import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Local-disk storage for dev/demo purposes only. Next.js on Vercel (and most
// serverless hosts) has a read-only, ephemeral filesystem — files written
// here will NOT persist across deploys or scale past one instance. Before
// going to production, swap the body of this function for an upload to
// Supabase Storage or S3 and return the resulting public URL. Every caller
// only depends on this one function, so that's the single place to change.
export async function saveUploadedFile(file: File, folder: string): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), bytes);
  return `/uploads/${folder}/${fileName}`;
}
