import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// GET - List meetings for a cell group
export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getSessionUser();
  if (!session || !session.churchId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN" && session.role !== "PASTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  // Verify the group belongs to this church
  const { data: group, error: groupError } = await supabase
    .from("cell_group")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("id", params.groupId)
    .maybeSingle();

  if (groupError || !group) {
    return NextResponse.json({ error: "Cell group not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const status = url.searchParams.get("status");

  let query = supabase
    .from("cell_meeting")
    .select("*", { count: "exact" })
    .eq("church_id", session.churchId)
    .eq("group_id", params.groupId)
    .order("meeting_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && ["SCHEDULED", "HELD", "CANCELLED"].includes(status)) {
    query = query.eq("status", status as "SCHEDULED" | "HELD" | "CANCELLED");
  }

  const { data: meetings, error, count } = await query;

  if (error) {
    console.error("Failed to fetch meetings", error);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }

  return NextResponse.json({
    meetings: meetings ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}

// POST - Create a new meeting
export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getSessionUser();
  if (!session || !session.churchId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN" && session.role !== "PASTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  // Verify the group belongs to this church
  const { data: group, error: groupError } = await supabase
    .from("cell_group")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("id", params.groupId)
    .maybeSingle();

  if (groupError || !group) {
    return NextResponse.json({ error: "Cell group not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    meetingDate,
    notes,
    status = "HELD",
  } = body;

  if (!meetingDate) {
    return NextResponse.json({ error: "Meeting date is required" }, { status: 400 });
  }

  // Check if meeting already exists for this date
  const { data: existingMeeting } = await supabase
    .from("cell_meeting")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("group_id", params.groupId)
    .eq("meeting_date", meetingDate)
    .maybeSingle();

  if (existingMeeting) {
    return NextResponse.json(
      { error: "A meeting already exists for this date" },
      { status: 409 }
    );
  }

  const { data: meeting, error } = await supabase
    .from("cell_meeting")
    .insert({
      church_id: session.churchId,
      group_id: params.groupId,
      meeting_date: meetingDate,
      notes: notes || null,
      status,
      created_by: session.user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create meeting", error);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
  }

  return NextResponse.json(meeting, { status: 201 });
}
