import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  primaryContactName: z.string().min(2),
  primaryContactEmail: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.errors);
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.errors },
        { status: 400 }
      );
    }
    const { name, slug, primaryContactName, primaryContactEmail, password } = parsed.data;

    const supabase = createSupabaseAdminClient();

    const { data: slugTaken } = await supabase.from("church").select("id").eq("slug", slug).maybeSingle();
    if (slugTaken) return NextResponse.json({ error: "Slug taken" }, { status: 409 });

    const { data: church, error: churchErr } = await supabase
      .from("church")
      .insert({
        name,
        slug,
        primary_contact_name: primaryContactName,
        primary_contact_email: primaryContactEmail,
        status: "PENDING",
        plan: "FREE"
      })
      .select()
      .single();
    if (churchErr) {
      console.error("Church insert error:", churchErr);
      return NextResponse.json({ error: churchErr.message }, { status: 500 });
    }

    const { data: user, error: signupErr } = await supabase.auth.admin.createUser({
      email: primaryContactEmail,
      password,
      email_confirm: true,
      user_metadata: {
        role: "ADMIN",
        church_id: church.id,
        church_slug: slug
      }
    });
    if (signupErr || !user?.user) {
      console.error("User creation error:", signupErr);
      return NextResponse.json({ error: signupErr?.message ?? "Signup failed" }, { status: 500 });
    }

    const { error: appUserErr } = await supabase.from("app_user").insert({
      id: user.user.id,
      email: primaryContactEmail,
      role: "ADMIN",
      church_id: church.id
    });

    if (appUserErr) {
      console.error("App user insert error:", appUserErr);
      // Don't fail the whole request, but log it
    }

    return NextResponse.json({ churchId: church.id, status: "PENDING" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

