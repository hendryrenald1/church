import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceForm } from "@/components/cell-groups/attendance-form";

type MemberRow = {
  id: string;
  member: { id: string; first_name: string; last_name: string };
};

type MeetingRow = {
  id: string;
  meeting_date: string;
  status: string;
  finalized_at: string | null;
};

type GroupRow = {
  id: string;
  name: string;
  status: string;
};

export default async function GroupAttendancePage({ params }: { params: { churchSlug: string; groupId: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  const { data: groupDataRaw } = await supabase
    .from("cell_group")
    .select("id, name, status")
    .eq("church_id", session.churchId)
    .eq("id", params.groupId)
    .maybeSingle();
  if (!groupDataRaw) notFound();
  const groupData = groupDataRaw as GroupRow;

  const today = new Date().toISOString().slice(0, 10);

  // Ensure meeting exists for today (lazy create)
  const { data: existingMeetingData } = await supabase
    .from("cell_meeting")
    .select("id, meeting_date, status, finalized_at")
    .eq("church_id", session.churchId)
    .eq("group_id", params.groupId)
    .eq("meeting_date", today)
    .maybeSingle();

  const existingMeeting = existingMeetingData as MeetingRow | null;
  let meetingId = existingMeeting?.id;
  if (!meetingId) {
    const insertData = {
      church_id: session.churchId,
      group_id: params.groupId,
      meeting_date: today,
      status: "HELD" as const,
    };
    const { data: created, error: createError } = await (supabase as any)
      .from("cell_meeting")
      .insert(insertData)
      .select("id, meeting_date, status")
      .maybeSingle();
    if (createError || !created) {
      console.error("Failed to create meeting", createError);
      throw new Error("Failed to create meeting");
    }
    meetingId = (created as { id: string }).id;
  }

  const [{ data: membersData }, { data: attendanceData }] = await Promise.all([
    supabase
      .from("cell_group_member")
      .select("id, member:member_id (id, first_name, last_name)")
      .eq("church_id", session.churchId)
      .eq("group_id", params.groupId)
      .is("archived_at", null)
      .order("role"),
    supabase
      .from("meeting_attendance")
      .select("member_id, status")
      .eq("church_id", session.churchId)
      .eq("meeting_id", meetingId)
  ]);

  const members = (membersData ?? []) as unknown as MemberRow[];
  const attendanceMap = new Map<string, "UNKNOWN" | "PRESENT" | "ABSENT">();
  (attendanceData ?? []).forEach((row: any) => {
    attendanceMap.set(row.member_id, row.status);
  });

  const attendees = members.map((member) => ({
    memberId: member.member.id,
    name: `${member.member.first_name} ${member.member.last_name}`,
    status: attendanceMap.get(member.member.id) ?? "UNKNOWN"
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Cell Group / {groupData.name}</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Attendance</h1>
            <Badge variant="secondary">{groupData.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Meeting date: {today}</p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/${params.churchSlug}/admin/cell-groups/${params.groupId}`}>Back to group</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceForm churchSlug={params.churchSlug} groupId={params.groupId} meetingId={meetingId} attendees={attendees} />
        </CardContent>
      </Card>
    </div>
  );
}
