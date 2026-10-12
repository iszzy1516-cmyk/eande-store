import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { csrfGuard } from "@/lib/csrf";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Admin image upload: stores the file in the DB, returns its public URL. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const forbidden = csrfGuard(req);
  if (forbidden) return forbidden;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG or WebP images are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (max 5MB)." },
      { status: 400 }
    );
  }

  const image = await prisma.image.create({
    data: {
      data: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    },
  });

  return NextResponse.json({ url: `/api/images/${image.id}` });
}
