import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  primaryContactName: z.string().min(2),
  primaryContactEmail: z.string().email(),
  plan: z.enum(["FREE", "STANDARD", "PREMIUM"]).optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
  adminUsers: z
    .array(
      z.object({
        email: z.string().email(),
        password: z.string().min(8)
      })
    )
    .min(1)
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
    const normalizedAdminEmails = parsed.data.adminUsers.map((admin) => admin.email.toLowerCase());
    const duplicateEmail = normalizedAdminEmails.find(
      (email, index) => normalizedAdminEmails.indexOf(email) !== index
    );
    if (duplicateEmail) {
      return NextResponse.json(
        { error: `Duplicate admin email detected: ${duplicateEmail}` },
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

    const createdAdminAccountIds: string[] = [];
    const rollbackAdmins = async () => {
      for (const adminId of createdAdminAccountIds) {
        await supabase.from("app_user").delete().eq("id", adminId);
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(adminId);
        if (deleteAuthError) {
          console.error("Failed to delete auth user during rollback:", deleteAuthError);
        }
      }
      await supabase.from("church").delete().eq("id", church.id);
    };

    for (const adminUser of parsed.data.adminUsers) {
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: adminUser.email,
        password: adminUser.password,
        email_confirm: true,
        user_metadata: {
          role: "ADMIN",
          church_id: church.id,
          church_slug: parsed.data.slug
        }
      });

      if (userError || !userData?.user) {
        console.error("Create admin user error:", userError);
        await rollbackAdmins();
        return NextResponse.json(
          { error: userError?.message ?? "Failed to create admin user" },
          { status: 500 }
        );
      }

      const authUserId = userData.user.id;
      const { error: appUserError } = await supabase.from("app_user").insert({
        id: authUserId,
        email: adminUser.email,
        role: "ADMIN",
        church_id: church.id
      });

      if (appUserError) {
        console.error("Create app_user error:", appUserError);
        await supabase.auth.admin.deleteUser(authUserId);
        await rollbackAdmins();
        return NextResponse.json(
          { error: "Failed to sync admin user, church creation rolled back" },
          { status: 500 }
        );
      }

      createdAdminAccountIds.push(authUserId);
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
