import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { FamilyHeader } from "./_components/family-header";
import { FamilyInformationCard } from "./_components/family-information-card";
import { FamilyMembersSection } from "./_components/family-members-section";
import { FamilyStatsCard } from "./_components/family-stats-card";
import { QuickActionsCard } from "./_components/quick-actions-card";
import { FamilyTimelineCard } from "./_components/family-timeline-card";
import { FamilySidebarSheet } from "./_components/family-sidebar-sheet";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type FamilyRow = Database["public"]["Tables"]["family"]["Row"] & {
  family_member: (Database["public"]["Tables"]["family_member"]["Row"] & {
    member: (Database["public"]["Tables"]["member"]["Row"] & {
      branch: { id: string; name: string } | null;
    }) | null;
  })[];
};

export interface FamilyMemberDetail {
  id: string;
  memberId: string;
  relationship: "HEAD" | "SPOUSE" | "CHILD" | "OTHER";
  isPrimaryContact: boolean;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string | null;
    email: string | null;
    phone: string | null;
    status: "ACTIVE" | "INACTIVE";
    branchId: string | null;
    branchName: string | null;
    dateOfBirth: string | null;
    baptismDate: string | null;
  };
}

export interface FamilyDetail {
  id: string;
  churchId: string;
  familyName: string;
  weddingAnniversary: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  members: FamilyMemberDetail[];
}

export interface FamilyActivity {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: "member_added" | "member_removed" | "family_updated" | "message_sent" | "note";
}

export default async function AdminFamilyDetailPage({
  params
}: {
  params: { churchSlug: string; familyId: string };
}) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (!session.churchId || !["ADMIN", "PASTOR"].includes(session.role)) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("family")
    .select(
      `
      id,
      church_id,
      family_name,
      wedding_anniversary,
      address,
      created_at,
      updated_at,
      family_member (
        id,
        member_id,
        relationship,
        is_primary_contact,
        member:member_id (
          id,
          first_name,
          last_name,
          gender,
          email,
          phone,
          status,
          branch_id,
          date_of_birth,
          baptism_date,
          branch:branch_id (id, name)
        )
      )
    `
    )
    .eq("id", params.familyId)
    .eq("church_id", session.churchId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load family detail", error);
    throw new Error("Failed to load family detail");
  }

  if (!data) {
    notFound();
  }

  const family = mapFamilyDetail(data as FamilyRow);

  const activities = await getFamilyActivities(params.familyId, session.churchId);

  return (
    <div className="space-y-6 p-6">
      <FamilyHeader family={family} churchSlug={params.churchSlug} />

      <div className="lg:hidden">
        <FamilySidebarSheet family={family} activities={activities} churchSlug={params.churchSlug} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FamilyInformationCard family={family} />
          <FamilyMembersSection family={family} churchSlug={params.churchSlug} />
        </div>

        <div className="hidden flex-col space-y-6 lg:flex">
          <FamilyStatsCard family={family} />
          <QuickActionsCard family={family} churchSlug={params.churchSlug} />
          <Suspense fallback={<div className="rounded-xl border p-6 text-sm text-muted-foreground">Loading activity…</div>}>
            <FamilyTimelineCard activities={activities} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function mapFamilyDetail(row: FamilyRow): FamilyDetail {
  const members: FamilyMemberDetail[] = (row.family_member ?? [])
    .filter((member) => Boolean(member.member))
    .map((member) => ({
      id: member.id,
      memberId: member.member_id,
      relationship: member.relationship,
      isPrimaryContact: member.is_primary_contact,
      member: {
        id: member.member!.id,
        firstName: member.member!.first_name,
        lastName: member.member!.last_name,
        gender: member.member!.gender,
        email: member.member!.email,
        phone: member.member!.phone,
        status: member.member!.status,
        branchId: member.member!.branch_id,
        branchName: member.member!.branch?.name ?? null,
        dateOfBirth: member.member!.date_of_birth,
        baptismDate: member.member!.baptism_date
      }
    }));

  return {
    id: row.id,
    churchId: row.church_id,
    familyName: row.family_name ?? "Unnamed family",
    weddingAnniversary: row.wedding_anniversary,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    members
  };
}

async function getFamilyActivities(familyId: string, churchId: string): Promise<FamilyActivity[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, activity_type, title, description, created_at")
    .eq("church_id", churchId)
    .like("description", `%${familyId}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.warn("Family activity lookup failed", error);
    return [];
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? "No description",
    createdAt: item.created_at,
    type: (item.activity_type as FamilyActivity["type"]) ?? "note"
  }));
}
