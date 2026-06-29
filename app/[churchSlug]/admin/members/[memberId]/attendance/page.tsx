import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AttendanceHistoryClient } from "@/components/members/attendance-history-client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { params: { churchSlug: string; memberId: string } };

export type AttendanceHistoryRecord = {
  id: string;
  date: string;
  groupName: string;
  branch: string | null;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "UNKNOWN";
};

export default async function MemberAttendanceHistoryPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  const [{ data: memberData, error: memberError }, { data: attendanceData }] = await Promise.all([
    supabase
      .from("member")
      .select("id, first_name, last_name")
      .eq("church_id", session.churchId)
      .eq("id", params.memberId)
      .single(),
    supabase
      .from("meeting_attendance")
      .select(
        `id, status,
         cell_meeting:meeting_id (
           id, meeting_date, status,
           cell_group:group_id (id, name, branch:branch_id (id, name))
         )`
      )
      .eq("member_id", params.memberId)
      .eq("church_id", session.churchId)
      .neq("status", "UNKNOWN"),
  ]);

  if (memberError || !memberData) notFound();

  type RawRow = {
    id: string;
    status: string;
    cell_meeting: {
      id: string;
      meeting_date: string;
      status: string;
      cell_group: { id: string; name: string; branch: { id: string; name: string } | null } | null;
    } | null;
  };

  const fullName = `${memberData.first_name} ${memberData.last_name}`;
  const basePath = `/${params.churchSlug}/admin/members`;

  const records: AttendanceHistoryRecord[] = ((attendanceData ?? []) as unknown as RawRow[])
    .filter((r) => r.cell_meeting?.status === "HELD")
    .map((r) => ({
      id: r.id,
      date: r.cell_meeting!.meeting_date,
      groupName: r.cell_meeting?.cell_group?.name ?? "Cell Group",
      branch: r.cell_meeting?.cell_group?.branch?.name ?? null,
      status: r.status as AttendanceHistoryRecord["status"],
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href={basePath} className="hover:text-foreground transition-colors">Members</Link>
          <span>/</span>
          <Link href={`${basePath}/${params.memberId}`} className="hover:text-foreground transition-colors">
            {fullName}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Attendance History</span>
        </nav>

        {/* Header card */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h1 className="text-lg font-bold">Attendance History</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{fullName} · All cell group meetings</p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`${basePath}/${params.memberId}`}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Link>
            </Button>
          </div>
        </div>

        {/* Client component handles all interactivity */}
        <AttendanceHistoryClient records={records} memberName={fullName} />

      </div>
    </div>
  );
}
