import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  primaryContactName: z.string().min(2),
  primaryContactEmail: z.string().email(),
  password: z.string().min(8).optional(),
  plan: z.enum(["FREE", "STANDARD", "PREMIUM"]).optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional()
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("church").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("GET churches error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    let payload;
    try {
      payload = await req.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.errors);
      console.error("Received payload:", JSON.stringify(payload, null, 2));
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.errors },
        { status: 400 }
      );
    }
    const supabase = createSupabaseAdminClient();
    const { data: church, error } = await supabase.from("church").insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      primary_contact_name: parsed.data.primaryContactName,
      primary_contact_email: parsed.data.primaryContactEmail,
      status: parsed.data.status ?? "PENDING",
      plan: parsed.data.plan ?? "FREE"
    }).select().single();
    
    if (error) {
      console.error("POST church error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optionally create an admin user if password is provided
    if (parsed.data.password && church) {
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: parsed.data.primaryContactEmail,
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: { role: "ADMIN", church_id: church.id, church_slug: parsed.data.slug }
      });
      
      if (userError) {
        console.error("Create user error:", userError);
        return NextResponse.json({ error: `Church created but user creation failed: ${userError.message}` }, { status: 500 });
      }
      
      if (userData.user) {
        const { error: appUserError } = await supabase.from("app_user").insert({
          id: userData.user.id,
          email: parsed.data.primaryContactEmail,
          role: "ADMIN",
          church_id: church.id
        });
        
        if (appUserError) {
          console.error("Create app_user error:", appUserError);
          // Don't fail the whole request, just log it
        }
      }
    }

    return NextResponse.json({ ok: true, church });
  } catch (error) {
    console.error("Unexpected error in POST /api/superadmin/churches:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

