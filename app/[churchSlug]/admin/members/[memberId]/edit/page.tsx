import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { ArrowLeft } from "lucide-react";
import MemberForm from "../../new/member-form";

export default async function AdminEditMemberPage({
  params
}: {
  params: { churchSlug: string; memberId: string };
}) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [
    { data: branchesData, error: branchesError },
    { data: memberData, error: memberError }
  ] = await Promise.all([
    supabase
      .from("branch")
      .select("id, name")
      .eq("church_id", session.churchId)
      .order("name", { ascending: true }),
    supabase
      .from("member")
      .select(
        "id, first_name, last_name, email, phone, branch_id, status, joined_date, date_of_birth, baptism_date, address_line1, address_line2, city, state_county, postcode, country"
      )
      .eq("church_id", session.churchId)
      .eq("id", params.memberId)
      .single()
  ]);

  if (branchesError || memberError || !memberData) {
    console.error("Failed to load edit member data", branchesError ?? memberError);
    notFound();
  }

  type BranchRow = Pick<Database["public"]["Tables"]["branch"]["Row"], "id" | "name">;
  type MemberRow = Pick<
    Database["public"]["Tables"]["member"]["Row"],
    | "id"
    | "first_name"
    | "last_name"
    | "email"
    | "phone"
    | "branch_id"
    | "status"
    | "joined_date"
    | "date_of_birth"
    | "baptism_date"
    | "address_line1"
    | "address_line2"
    | "city"
    | "state_county"
    | "postcode"
    | "country"
  >;

  const branches = (branchesData ?? []) as unknown as BranchRow[];
  const member = memberData as MemberRow;
  const membersPath = `/${params.churchSlug}/admin/members`;
  const memberPath = `${membersPath}/${params.memberId}`;

  const initials = (
    (member.first_name?.trim()?.[0] ?? "") + (member.last_name?.trim()?.[0] ?? "")
  ).toUpperCase() || "??";

  const branchName = branches.find((b) => b.id === member.branch_id)?.name;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Breadcrumb */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <Link href={membersPath} className="hover:text-foreground transition-colors">
            Members
          </Link>
          <span>/</span>
          <Link href={memberPath} className="hover:text-foreground transition-colors">
            {member.first_name} {member.last_name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Edit</span>
        </nav>

        {/* Page heading with avatar */}
        <div className="flex items-center gap-4">
          <Link
            href={memberPath}
            className="inline-flex items-center justify-center rounded-lg border bg-card h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Back to member profile"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-tight">
                {member.first_name} {member.last_name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    member.status === "ACTIVE" ? "text-emerald-700" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      member.status === "ACTIVE" ? "bg-emerald-500" : "bg-muted-foreground/40"
                    }`}
                  />
                  {member.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
                {branchName && (
                  <>
                    <span>·</span>
                    <span>{branchName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MemberForm churchSlug={params.churchSlug} branches={branches} member={member} />
    </div>
  );
}
