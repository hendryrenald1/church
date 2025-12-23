import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// GET - Get a specific meeting
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

  const { data: meeting, error } = await supabase
    .from("cell_meeting")
    .select("*, cell_group:group_id (id, name, status)")
    .eq("church_id", session.churchId)
    .eq("id", params.meetingId)
    .maybeSingle();

  if (error || !meeting || meeting.group_id !== params.groupId) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  return NextResponse.json(meeting);
}

// PATCH - Update a meeting
export async function PATCH(
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

  // Verify the meeting exists and belongs to the correct group/church
  const { data: existingMeeting, error: fetchError } = await supabase
    .from("cell_meeting")
    .select("id, group_id, finalized_at")
    .eq("church_id", session.churchId)
    .eq("id", params.meetingId)
    .maybeSingle();

  if (fetchError || !existingMeeting || existingMeeting.group_id !== params.groupId) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Don't allow updates to finalized meetings (except for admin override)
  if (existingMeeting.finalized_at) {
    return NextResponse.json(
      { error: "Cannot update a finalized meeting" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: session.user.id,
  };

  // Allow updating these fields
  const allowedFields = [
    "meetingDate",
    "startTime",
    "endTime",
    "topic",
    "scriptureReference",
    "notes",
    "status",
    "offeringAmount",
    "offeringNotes",
    "cancelledReason",
    "visitorCount",
  ];

  // Map camelCase to snake_case
  const fieldMapping: Record<string, string> = {
    meetingDate: "meeting_date",
    startTime: "start_time",
    endTime: "end_time",
    topic: "topic",
    scriptureReference: "scripture_reference",
    notes: "notes",
    status: "status",
    offeringAmount: "offering_amount",
    offeringNotes: "offering_notes",
    cancelledReason: "cancelled_reason",
    visitorCount: "visitor_count",
  };

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const dbField = fieldMapping[field];
      updateData[dbField] = body[field];
    }
  }

  const { data: meeting, error } = await supabase
    .from("cell_meeting")
    .update(updateData)
    .eq("id", params.meetingId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update meeting", error);
    return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 });
  }

  return NextResponse.json(meeting);
}

// DELETE - Delete a meeting
export async function DELETE(
  req: Request,
  { params }: { params: { groupId: string; meetingId: string } }
) {
  const session = await getSessionUser();
  if (!session || !session.churchId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  // Verify the meeting exists and belongs to the correct group/church
  const { data: existingMeeting, error: fetchError } = await supabase
    .from("cell_meeting")
    .select("id, group_id")
    .eq("church_id", session.churchId)
    .eq("id", params.meetingId)
    .maybeSingle();

  if (fetchError || !existingMeeting || existingMeeting.group_id !== params.groupId) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Delete the meeting (cascades to attendance records)
  const { error } = await supabase
    .from("cell_meeting")
    .delete()
    .eq("id", params.meetingId);

  if (error) {
    console.error("Failed to delete meeting", error);
    return NextResponse.json({ error: "Failed to delete meeting" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
