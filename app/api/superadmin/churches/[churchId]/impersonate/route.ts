import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST() {
  const session = await getSessionUser();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ message: "Stub: implement impersonation via Supabase auth tokens" });
}

