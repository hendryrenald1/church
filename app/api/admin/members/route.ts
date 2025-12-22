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
  dateOfBirth: z.string().nullable(),
  baptismDate: z.string().nullable(),
  gender: z.string().optional(),
  email: z.string().email().nullable(),
  phone: z.string().nullable()
});

/**
 * GET /api/admin/members
 *
 * Supports cursor-based pagination with search and filtering.
 *
 * Query params:
 * - cursor: UUID of the last item from previous page (optional)
 * - limit: Number of items per page (default: 20, max: 100)
 * - search: Search term for name, email, or phone (optional)
 * - status: Filter by ACTIVE or INACTIVE (optional)
 * - branchId: Filter by branch UUID (optional)
 * - exclude: Comma-separated list of member IDs to exclude (optional)
 *
 * Returns: { data: MemberListItem[], nextCursor: string | null, hasMore: boolean, totalCount: number }
 */
export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status") as "ACTIVE" | "INACTIVE" | null;
  const branchId = searchParams.get("branchId");
  const exclude = searchParams.get("exclude");

  // Parse and validate limit
  const limit = Math.min(
    Math.max(1, parseInt(limitParam || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );

  const supabase = createSupabaseAdminClient();

  // Build the base query with selected fields
  let query = supabase
    .from("member")
    .select("id, first_name, last_name, status, joined_date, email, phone, branch:branch_id (id, name)", { count: "exact" })
    .eq("church_id", session.churchId);

  // Apply search filter (search across name, email, phone)
  if (search) {
    // Use ilike for case-insensitive partial matching
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  // Apply status filter
  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    query = query.eq("status", status);
  }

  // Apply branch filter
  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  // Exclude specific member IDs (used when adding members to families)
  if (exclude) {
    const excludeIds = exclude.split(",").filter(Boolean);
    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }
  }

  // Order by last_name, first_name, then id for consistent cursor pagination
  query = query.order("last_name", { ascending: true });
  query = query.order("first_name", { ascending: true });
  query = query.order("id", { ascending: true });

  // Apply cursor-based pagination
  // For cursor pagination with composite ordering, we need the cursor item's values
  if (cursor) {
    // Fetch the cursor item to get its sort values
    const { data: cursorItem } = await supabase
      .from("member")
      .select("id, last_name, first_name")
      .eq("id", cursor)
      .single();

    if (cursorItem) {
      const cursorData = cursorItem as { id: string; last_name: string; first_name: string };
      // Filter to items that come after the cursor in sort order
      // This uses a compound comparison: (last_name, first_name, id) > (cursor_last_name, cursor_first_name, cursor_id)
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

  // Type the items properly since Supabase infers 'never' due to complex query building
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

  const items = (data ?? []) as MemberRow[];
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id : null;

  return NextResponse.json({
    data: pageItems,
    nextCursor,
    hasMore,
    totalCount: count ?? 0,
  });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN" || !session.churchId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await req.json();
  const parsed = memberSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const memberQuery = supabase.from("member");
  // @ts-expect-error Supabase type inference issue
  const { error } = await memberQuery.insert({
    church_id: session.churchId,
    branch_id: parsed.data.branchId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    gender: parsed.data.gender ?? null,
    email: parsed.data.email,
    phone: parsed.data.phone,
    status: parsed.data.status,
    joined_date: parsed.data.joinedDate,
    date_of_birth: parsed.data.dateOfBirth,
    baptism_date: parsed.data.baptismDate
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
