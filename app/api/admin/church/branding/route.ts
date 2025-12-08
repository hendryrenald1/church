import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// Placeholder: branding could live in a separate table or JSON column.
export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ logoUrl: null, primaryColor: null, accentColor: null, tagline: null });
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  return NextResponse.json({ ok: true, saved: payload });
}

