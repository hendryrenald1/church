import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { revalidatePath } from "next/cache";
import { MeetingList } from "@/components/cell-groups/meeting-list";
import { QuickAttendanceButton } from "@/components/cell-groups/quick-attendance-button";
import type { MeetingStatus } from "@/types/cell-group";
import type { Database } from "@/types/supabase";

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  schedule_weekday: number | null;
  default_meeting_time: string | null;
  branch: { id: string; name: string } | null;
};

type MemberRow = {
  id: string;
  role: "LEADER" | "ASSISTANT" | "MEMBER";
  member: { id: string; first_name: string; last_name: string; email: string | null };
};
type MemberOption = { id: string; name: string };

type MeetingRow = {
  id: string;
  meeting_date: string;
  status: MeetingStatus;
  finalized_at: string | null;
  visitor_count: number | null;
  topic: string | null;
  scripture_reference: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
};

export default async function CellGroupDetailPage({ params }: { params: { churchSlug: string; groupId: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [{ data: groupData, error: groupError }, { data: membersData, error: membersError }, { data: meetingsData }] =
    await Promise.all([
      supabase
        .from("cell_group")
        .select("id, name, description, status, schedule_weekday, default_meeting_time, branch:branch_id (id, name)")
        .eq("church_id", session.churchId)
        .eq("id", params.groupId)
        .maybeSingle(),
      supabase
        .from("cell_group_member")
        .select("id, role, member:member_id (id, first_name, last_name, email)")
        .eq("church_id", session.churchId)
        .eq("group_id", params.groupId)
        .is("archived_at", null),
      supabase
        .from("cell_meeting")
        .select("id, meeting_date, status, finalized_at, visitor_count, topic, scripture_reference, start_time, end_time, notes")
        .eq("church_id", session.churchId)
        .eq("group_id", params.groupId)
        .order("meeting_date", { ascending: false })
        .limit(10),
    ]);

  if (groupError || membersError || !groupData) {
    console.error("Failed to load cell group", groupError ?? membersError);
    notFound();
  }

  const group = groupData as unknown as GroupRow;
  const members = (membersData ?? []) as unknown as MemberRow[];
  const meetingsRaw = (meetingsData ?? []) as MeetingRow[];
  const basePath = `/${params.churchSlug}/admin/cell-groups`;
  const churchId = session.churchId!; // Already validated above

  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Fetch attendance counts for each meeting
  const meetings = await Promise.all(
    meetingsRaw.map(async (meeting) => {
      const { data: attendanceDataRaw } = await supabase
        .from("meeting_attendance")
        .select("status")
        .eq("church_id", churchId)
        .eq("meeting_id", meeting.id);

      const attendanceData = attendanceDataRaw as { status: string }[] | null;
      const totalCount = attendanceData?.length ?? 0;
      const presentCount =
        attendanceData?.filter((a) => a.status === "PRESENT" || a.status === "LATE").length ?? 0;

      return {
        id: meeting.id,
        meetingDate: meeting.meeting_date,
        status: meeting.status,
        finalizedAt: meeting.finalized_at,
        visitorCount: meeting.visitor_count ?? 0,
        topic: meeting.topic,
        scriptureReference: meeting.scripture_reference,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
        notes: meeting.notes,
        totalCount,
        presentCount,
      };
    })
  );

  // Check if there's a meeting for today
  const today = new Date().toISOString().slice(0, 10);
  const todaysMeeting = meetings.find((m) => m.meetingDate === today);

  const { data: memberOptionsDataRaw } = await supabase
    .from("member")
    .select("id, first_name, last_name")
    .eq("church_id", churchId)
    .order("first_name")
    .limit(100);
  const memberOptionsData = memberOptionsDataRaw as { id: string; first_name: string; last_name: string }[] | null;
  const memberOptions: MemberOption[] =
    memberOptionsData?.map((m) => ({ id: m.id, name: `${m.first_name} ${m.last_name}` })) ?? [];

  async function addMember(formData: FormData) {
    "use server";
    const sessionInner = await getSessionUser();
    if (!sessionInner || !sessionInner.churchId) redirect("/auth/login");
    const memberId = formData.get("memberId") as string;
    const role = (formData.get("role") as "LEADER" | "ASSISTANT" | "MEMBER") || "MEMBER";
    if (!memberId) {
      throw new Error("Member is required");
    }
    const supa = createSupabaseAdminClient();
    const { error } = await supa.from("cell_group_member").insert({
      church_id: sessionInner.churchId,
      group_id: params.groupId,
      member_id: memberId,
      role,
      joined_at: new Date().toISOString(),
    });
    if (error) {
      console.error("Failed to add member", error);
      throw new Error("Failed to add member");
    }
    revalidatePath(`${basePath}/${params.groupId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={basePath} className="underline-offset-4 hover:underline">
              Cell Groups
            </Link>{" "}
            / {group.name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            <Badge variant={group.status === "ACTIVE" ? "default" : "secondary"}>{group.status}</Badge>
            <Badge variant="outline">{group.branch?.name ?? "Church-wide"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{group.description || "No description"}</p>
          <p className="text-sm text-muted-foreground">
            Meeting day: {group.schedule_weekday !== null ? weekdayNames[group.schedule_weekday] : "Unspecified"}
            {group.default_meeting_time ? ` at ${group.default_meeting_time}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <QuickAttendanceButton
            churchSlug={params.churchSlug}
            groupId={group.id}
            todaysMeetingId={todaysMeeting?.id}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Members Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            <div className="p-4">
              <form action={addMember} className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="memberId">Add member</Label>
                  <Select name="memberId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue="MEMBER">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEADER">Leader</SelectItem>
                      <SelectItem value="ASSISTANT">Assistant</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="sm:w-auto">
                  Add
                </Button>
              </form>
            </div>
            <Separator />
            {members.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No members yet.</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[2fr_1fr] sm:items-center">
                  <div>
                    <p className="font-medium">
                      {member.member.first_name} {member.member.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.member.email ?? "No email"}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Badge variant="secondary" className="text-xs">
                      {member.role}
                    </Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/${params.churchSlug}/admin/members/${member.member.id}`}>View member</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Meetings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Meetings</CardTitle>
            {meetings.length > 5 && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`${basePath}/${group.id}/meetings`}>View all</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <MeetingList
              cellGroup={{
                id: group.id,
                name: group.name,
                scheduleWeekday: group.schedule_weekday,
              }}
              meetings={meetings.slice(0, 5)}
              churchSlug={params.churchSlug}
              groupId={group.id}
              showCreateButton={meetings.length === 0}
              maxItems={5}
              showViewAll={meetings.length > 5}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
