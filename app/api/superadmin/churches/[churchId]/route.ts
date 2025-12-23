import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { z } from "zod";

type Props = { params: { churchId: string } };

type ChurchRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  created_at: string;
  updated_at: string;
};

async function resolveChurch(ref: string): Promise<ChurchRecord | null> {
  const supabase = createSupabaseAdminClient();
  // Try by id first
  const { data, error } = await supabase.from("church").select("*").eq("id", ref).maybeSingle();
  if (data) return data as ChurchRecord;
  // Fallback: try slug
  const bySlug = await supabase.from("church").select("*").eq("slug", ref).maybeSingle();
  if (bySlug.data) return bySlug.data as ChurchRecord;
  if (error) throw error;
  if (bySlug.error) throw bySlug.error;
  return null;
}

export async function GET(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const data = await resolveChurch(params.churchId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = createSupabaseAdminClient();
  const { data: admins, error: adminError } = await supabase
    .from("app_user")
    .select("id, email, role, church_id")
    .eq("church_id", data.id)
    .eq("role", "ADMIN")
    .order("created_at", { ascending: true });
  if (adminError) {
    console.error("Failed to load church admins:", adminError);
    return NextResponse.json({ error: "Failed to load admin users" }, { status: 500 });
  }
  type AdminUser = { id: string; email: string; role: string; church_id: string };
  const adminList = ((admins ?? []) as AdminUser[]).map((admin) => ({ id: admin.id, email: admin.email }));
  return NextResponse.json({ ...data, admins: adminList });
}

const updateSchema = z
  .object({
    name: z.string().min(2).optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
      .optional(),
    status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
    plan: z.enum(["FREE", "STANDARD", "PREMIUM"]).optional(),
    primaryContactName: z.string().min(2).optional(),
    primaryContactEmail: z.string().email().optional(),
    adminUsers: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          email: z.string().email(),
          password: z.string().min(8).optional()
        })
      )
      .optional()
  })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "You must provide at least one field to update"
  });

export async function PATCH(req: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.errors }, { status: 400 });
  }
  const church = await resolveChurch(params.churchId);
  if (!church) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  const supabase = createSupabaseAdminClient();
  const updates: Record<string, string | null | undefined> = {};
  const { name, slug, status, plan, primaryContactName, primaryContactEmail, adminUsers } = parsed.data;
  if (Array.isArray(adminUsers) && adminUsers.length === 0) {
    return NextResponse.json({ error: "At least one admin user is required" }, { status: 400 });
  }
  const previousEmail = church.primary_contact_email;
  const emailChanged = primaryContactEmail !== undefined && primaryContactEmail !== previousEmail;
  let linkedAppUser: { id: string; email: string } | null = null;
  const createdAdminIds: string[] = [];
  const adminEmailChanges: { id: string; previousEmail: string }[] = [];
  const rollbackAdminChanges = async () => {
    for (const adminId of createdAdminIds) {
      const { error: deleteAppUserError } = await supabase.from("app_user").delete().eq("id", adminId);
      if (deleteAppUserError) {
        console.error("Failed to remove app_user during rollback:", deleteAppUserError);
      }
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(adminId);
      if (deleteAuthError) {
        console.error("Failed to remove auth user during rollback:", deleteAuthError);
      }
    }
    for (const change of adminEmailChanges) {
      const appUserUpdateQuery = supabase.from("app_user");
      const { error: revertAppUserError } = await appUserUpdateQuery.update({ email: change.previousEmail }).eq("id", change.id);
      if (revertAppUserError) {
        console.error("Failed to revert app_user email:", revertAppUserError);
      }
      const { error: revertAuthError } = await supabase.auth.admin.updateUserById(change.id, {
        email: change.previousEmail,
        email_confirm: true
      });
      if (revertAuthError) {
        console.error("Failed to revert auth user email change:", revertAuthError);
      }
    }
  };
  if (name !== undefined) updates.name = name;
  if (slug !== undefined) updates.slug = slug;
  if (status !== undefined) updates.status = status;
  if (plan !== undefined) updates.plan = plan;
  if (primaryContactName !== undefined) updates.primary_contact_name = primaryContactName;

  if (primaryContactEmail !== undefined) {
    if (emailChanged) {
      // Try direct match by email if previous email exists
      if (previousEmail) {
        const { data: directMatch, error: directMatchError } = await supabase
          .from("app_user")
          .select("id, email")
          .eq("church_id", church.id)
          .eq("email", previousEmail)
          .maybeSingle();
        if (directMatchError) {
          console.error("Failed to load linked admin user:", directMatchError);
          return NextResponse.json({ error: "Unable to load linked admin user" }, { status: 500 });
        }
        if (directMatch) {
          linkedAppUser = directMatch;
        }
      }
      if (!linkedAppUser) {
        const { data: fallbackUsers, error: fallbackError } = await supabase
          .from("app_user")
          .select("id, email")
          .eq("church_id", church.id)
          .eq("role", "ADMIN")
          .order("created_at", { ascending: true })
          .limit(1);
        if (fallbackError) {
          console.error("Failed to load fallback admin user:", fallbackError);
          return NextResponse.json({ error: "Unable to load linked admin user" }, { status: 500 });
        }
        linkedAppUser = fallbackUsers?.[0] ?? null;
      }

      if (!linkedAppUser) {
        return NextResponse.json({ error: "Linked admin user not found" }, { status: 404 });
      }
      const appUserQuery = supabase.from("app_user");
      const { error: appUserUpdateError } = await appUserQuery.update({ email: primaryContactEmail! }).eq("id", linkedAppUser.id);
      if (appUserUpdateError) {
        console.error("Failed to sync app_user email:", appUserUpdateError);
        return NextResponse.json({ error: "Unable to update linked admin user" }, { status: 500 });
      }
      updates.primary_contact_email = primaryContactEmail;
    } else {
      updates.primary_contact_email = primaryContactEmail;
    }
  }

  const hasAdminChanges = Array.isArray(adminUsers) && adminUsers.length > 0;
  if (!hasAdminChanges && Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (hasAdminChanges) {
    const normalizedAdmins = adminUsers!.map((admin) => ({
      id: admin.id,
      email: admin.email.trim(),
      password: admin.password?.trim()
    }));
    const adminsRequirePassword = normalizedAdmins.filter((admin) => !admin.id && !admin.password);
    if (adminsRequirePassword.length > 0) {
      return NextResponse.json(
        { error: "Password is required for new admin users" },
        { status: 400 }
      );
    }
    const { data: existingAdmins, error: adminsError } = await supabase
      .from("app_user")
      .select("id, email")
      .eq("church_id", church.id)
      .eq("role", "ADMIN");
    if (adminsError) {
      console.error("Failed to load existing admins:", adminsError);
      return NextResponse.json({ error: "Unable to load current admin users" }, { status: 500 });
    }
    type ExistingAdmin = { id: string; email: string };
    const adminsList = (existingAdmins ?? []) as ExistingAdmin[];
    const existingAdminMap = new Map(adminsList.map((admin) => [admin.id, admin]));
    const emailSet = new Set(adminsList.map((admin) => admin.email.toLowerCase()));
    for (const admin of normalizedAdmins) {
      const emailLower = admin.email.toLowerCase();
      if (admin.id) {
        const existing = existingAdminMap.get(admin.id);
        if (!existing) {
          await rollbackAdminChanges();
          return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
        }
        const existingEmailLower = existing.email.toLowerCase();
        const emailNeedsUpdate = emailLower !== existingEmailLower;
        if (emailNeedsUpdate) {
          emailSet.delete(existingEmailLower);
          if (emailSet.has(emailLower)) {
            emailSet.add(existingEmailLower);
            await rollbackAdminChanges();
            return NextResponse.json(
              { error: `Duplicate admin email detected: ${admin.email}` },
              { status: 400 }
            );
          }
          emailSet.add(emailLower);
          const { error: authUpdateError } = await supabase.auth.admin.updateUserById(admin.id, {
            email: admin.email,
            email_confirm: true
          });
          if (authUpdateError) {
            console.error("Failed to update admin auth user email:", authUpdateError);
            await rollbackAdminChanges();
            return NextResponse.json({ error: authUpdateError.message }, { status: 400 });
          }
          const appUserUpdateQuery = supabase.from("app_user");
          const { error: appUserUpdateError } = await appUserUpdateQuery.update({ email: admin.email }).eq("id", admin.id);
          if (appUserUpdateError) {
            console.error("Failed to update app_user email:", appUserUpdateError);
            await supabase.auth.admin.updateUserById(admin.id, {
              email: existing.email,
              email_confirm: true
            });
            await rollbackAdminChanges();
            return NextResponse.json({ error: "Failed to update admin email" }, { status: 500 });
          }
          adminEmailChanges.push({ id: admin.id, previousEmail: existing.email });
        }
        if (admin.password) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(admin.id, {
            password: admin.password
          });
          if (passwordError) {
            console.error("Failed to update admin password:", passwordError);
            await rollbackAdminChanges();
            return NextResponse.json({ error: passwordError.message }, { status: 400 });
          }
        }
      } else {
        if (emailSet.has(emailLower)) {
          await rollbackAdminChanges();
          return NextResponse.json(
            { error: `Duplicate admin email detected: ${admin.email}` },
            { status: 400 }
          );
        }
        emailSet.add(emailLower);
        const { data: createdUser, error: userError } = await supabase.auth.admin.createUser({
          email: admin.email,
          password: admin.password!,
          email_confirm: true,
          user_metadata: {
            role: "ADMIN",
            church_id: church.id,
            church_slug: church.slug
          }
        });
        if (userError || !createdUser?.user) {
          console.error("Failed to create admin user:", userError);
          await rollbackAdminChanges();
          return NextResponse.json(
            { error: userError?.message ?? "Failed to create admin user" },
            { status: 500 }
          );
        }
        const authUserId = createdUser.user.id;
        const appUserQuery = supabase.from("app_user");
        const { error: appUserInsertError } = await appUserQuery.insert({
          id: authUserId,
          email: admin.email,
          role: "ADMIN",
          church_id: church.id
        });
        if (appUserInsertError) {
          console.error("Failed to insert admin into app_user:", appUserInsertError);
          await supabase.auth.admin.deleteUser(authUserId);
          await rollbackAdminChanges();
          return NextResponse.json(
            { error: "Failed to sync admin user, no changes applied" },
            { status: 500 }
          );
        }
        createdAdminIds.push(authUserId);
      }
    }
  }

  let updatedChurch: ChurchRecord = church;
  if (Object.keys(updates).length > 0) {
    const churchQuery = supabase.from("church");
    const { data: churchData, error } = await churchQuery.update(updates).eq("id", church.id).select().single();
    if (error) {
      console.error("Update error:", error);
      if (emailChanged && linkedAppUser) {
        const revertQuery = supabase.from("app_user");
        const { error: revertAppUserError } = await revertQuery.update({ email: linkedAppUser.email }).eq("id", linkedAppUser.id);
        if (revertAppUserError) console.error("Failed to revert app_user email:", revertAppUserError);
      }
      if (hasAdminChanges) {
        await rollbackAdminChanges();
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (churchData) {
      updatedChurch = churchData;
    }
  }
  return NextResponse.json({ church: updatedChurch });
}

export async function DELETE(_: Request, { params }: Props) {
  const session = await getSessionUser();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const church = await resolveChurch(params.churchId);
  if (!church) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("church").delete().eq("id", church.id);
  if (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
