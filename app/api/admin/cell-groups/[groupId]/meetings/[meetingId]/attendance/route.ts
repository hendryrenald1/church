import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type AttendanceStatus = "UNKNOWN" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface AttendanceEntry {
  memberId: string;
  status: AttendanceStatus;
  isFirstTime?: boolean;
  broughtVisitor?: boolean;
  visitorCount?: number;
  notes?: string;
}

// GET - Get attendance records for a meeting
export async function GET(
  req: Request,
  { params }: { params: { groupId: string; meetingId: string } }
) {
  const session = await getSessionUser();
  if (!session || !session.churchId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN" && session.role !== "PASTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  // Verify meeting exists and belongs to this group/church
  const { data: meeting, error: meetingError } = await supabase
    .from("cell_meeting")
    .select("id, group_id")
    .eq("church_id", session.churchId)
    .eq("id", params.meetingId)
    .maybeSingle();

  if (meetingError || !meeting || meeting.group_id !== params.groupId) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const { data: attendance, error } = await supabase
    .from("meeting_attendance")
    .select("*, member:member_id (id, first_name, last_name, email, phone)")
    .eq("church_id", session.churchId)
    .eq("meeting_id", params.meetingId);

  if (error) {
    console.error("Failed to fetch attendance", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }

  // Calculate stats
  const stats = {
    total: attendance?.length ?? 0,
    present: attendance?.filter((a) => a.status === "PRESENT").length ?? 0,
    absent: attendance?.filter((a) => a.status === "ABSENT").length ?? 0,
    late: attendance?.filter((a) => a.status === "LATE").length ?? 0,
    excused: attendance?.filter((a) => a.status === "EXCUSED").length ?? 0,
    unknown: attendance?.filter((a) => a.status === "UNKNOWN").length ?? 0,
  };

  return NextResponse.json({ attendance: attendance ?? [], stats });
}

// POST - Upsert attendance records
export async function POST(
  req: Request,
  { params }: { params: { groupId: string; meetingId: string } }
) {
  const session = await getSessionUser();
  if (!session || !session.churchId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN" && session.role !== "PASTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: meeting, error: meetingError } = await supabase
    .from("cell_meeting")
    .select("id, group_id, finalized_at")
    .eq("church_id", session.churchId)
    .eq("id", params.meetingId)
    .maybeSingle();

  if (meetingError || !meeting || meeting.group_id !== params.groupId) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Don't allow updates to finalized meetings
  if (meeting.finalized_at) {
    return NextResponse.json(
      { error: "Cannot update attendance for a finalized meeting" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const entries = (body?.entries as AttendanceEntry[]) ?? [];

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "No entries provided" }, { status: 400 });
  }

  // Validate status values
  const validStatuses: AttendanceStatus[] = ["UNKNOWN", "PRESENT", "ABSENT", "LATE", "EXCUSED"];
  for (const entry of entries) {
    if (!validStatuses.includes(entry.status)) {
      return NextResponse.json(
        { error: `Invalid status: ${entry.status}` },
        { status: 400 }
      );
    }
  }

  const payload = entries.map((entry) => ({
    church_id: session.churchId!,
    meeting_id: params.meetingId,
    member_id: entry.memberId,
    status: entry.status,
    is_child: false,
    is_first_time: entry.isFirstTime ?? false,
    brought_visitor: entry.broughtVisitor ?? false,
    visitor_count: entry.visitorCount ?? 0,
    notes: entry.notes ?? null,
    recorded_by: session.user.id,
    recorded_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("meeting_attendance")
    .upsert(payload, { onConflict: "meeting_id,member_id" });

  if (error) {
    console.error("Failed to upsert attendance", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
