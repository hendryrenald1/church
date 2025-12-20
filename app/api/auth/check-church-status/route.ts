import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { churchId, churchSlug } = await req.json();

    // Prefer churchId over churchSlug for accuracy
    if (!churchId && !churchSlug) {
      return NextResponse.json({ error: "Church ID or slug required" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    let query = supabase.from("church").select("status, slug");

    if (churchId) {
      query = query.eq("id", churchId);
    } else {
      query = query.eq("slug", churchSlug);
    }

    const { data: church, error } = await query.single() as {
      data: { status: string; slug: string } | null;
      error: unknown
    };

    if (error || !church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    return NextResponse.json({ status: church.status, slug: church.slug });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
