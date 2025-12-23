import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const memberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  branchId: z.string().uuid().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  joinedDate: z.string(),
  dateOfBirth: z.string().nullable().optional(),
  baptismDate: z.string().nullable().optional(),
  gender: z.string().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional()
});

/**
 * Helper to get pastor's assigned branch IDs
 */
async function getPastorBranchIds(supabase: ReturnType<typeof createSupabaseAdminClient>, churchId: string, memberId: string) {
  const { data: profileData } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", churchId)
    .eq("member_id", memberId)
    .single();

  if (!profileData) return [];

  const profile = profileData as { id: string };
  const { data: assignments } = await supabase
    .from("pastor_branch")
    .select("branch_id")
    .eq("pastor_profile_id", profile.id);

  const assignmentList = (assignments ?? []) as { branch_id: string }[];
  return assignmentList.map((a) => a.branch_id).filter(Boolean);
}

/**
 * GET /api/pastor/members
 *
 * Supports cursor-based pagination with search and filtering.
 * Only returns members from branches assigned to the pastor.
 *
 * Query params:
 * - cursor: UUID of the last item from previous page (optional)
 * - limit: Number of items per page (default: 20, max: 100)
 * - search: Search term for name, email, or phone (optional)
 * - status: Filter by ACTIVE or INACTIVE (optional)
 * - branchId: Filter by branch UUID (optional, must be an assigned branch)
 *
 * Returns: { data: MemberListItem[], nextCursor: string | null, hasMore: boolean, totalCount: number }
 */
export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.role !== "PASTOR" || !session.memberId || !session.churchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  // Get pastor's assigned branches
  const branchIds = await getPastorBranchIds(supabase, session.churchId, session.memberId);

  if (branchIds.length === 0) {
    return NextResponse.json({
      data: [],
      nextCursor: null,
      hasMore: false,
      totalCount: 0
    });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status") as "ACTIVE" | "INACTIVE" | null;
  const branchId = searchParams.get("branchId");

  // Parse and validate limit
  const limit = Math.min(
    Math.max(1, parseInt(limitParam || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );

  // Build the base query with selected fields
  let query = supabase
    .from("member")
    .select("id, first_name, last_name, status, joined_date, email, phone, branch:branch_id (id, name)", { count: "exact" })
    .eq("church_id", session.churchId)
    .in("branch_id", branchIds);

  // Apply search filter (search across name, email, phone)
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  // Apply status filter
  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    query = query.eq("status", status);
  }

  // Apply branch filter (only if it's one of the assigned branches)
  if (branchId && branchIds.includes(branchId)) {
    query = query.eq("branch_id", branchId);
  }

  // Order by last_name, first_name, then id for consistent cursor pagination
  query = query.order("last_name", { ascending: true });
  query = query.order("first_name", { ascending: true });
  query = query.order("id", { ascending: true });

  // Apply cursor-based pagination
  if (cursor) {
    const { data: cursorItem } = await supabase
      .from("member")
      .select("id, last_name, first_name")
      .eq("id", cursor)
      .single();

    if (cursorItem) {
      const cursorData = cursorItem as { id: string; last_name: string; first_name: string };
      query = query.or(
        `last_name.gt.${cursorData.last_name},` +
        `and(last_name.eq.${cursorData.last_name},first_name.gt.${cursorData.first_name}),` +
        `and(last_name.eq.${cursorData.last_name},first_name.eq.${cursorData.first_name},id.gt.${cursorData.id})`
      );
    }
  }

  // Fetch one extra item to determine if there are more pages
  query = query.limit(limit + 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type MemberRow = {
    id: string;
    first_name: string;
    last_name: string;
    status: "ACTIVE" | "INACTIVE";
    joined_date: string;
    email: string | null;
    phone: string | null;
    branch: { id: string; name: string } | null;
  };

  const items = (data ?? []) as unknown as MemberRow[];
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id : null;

  return NextResponse.json({
    data: pageItems,
    nextCursor,
    hasMore,
    totalCount: count ?? 0
  });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "PASTOR" || !session.memberId || !session.churchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json();
  const parsed = memberSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Verify the branch is assigned to this pastor
  const branchIds = await getPastorBranchIds(supabase, session.churchId, session.memberId);
  if (parsed.data.branchId && !branchIds.includes(parsed.data.branchId)) {
    return NextResponse.json({ error: "Cannot add member to unassigned branch" }, { status: 403 });
  }

  const { error } = await supabase.from("member").insert({
    church_id: session.churchId,
    branch_id: parsed.data.branchId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    gender: parsed.data.gender ?? null,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    status: parsed.data.status,
    joined_date: parsed.data.joinedDate,
    date_of_birth: parsed.data.dateOfBirth ?? null,
    baptism_date: parsed.data.baptismDate ?? null
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
