import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "./use-debounce";
import type { PaginatedResponse, MemberListItem, MemberFilters } from "@/types/infinite-scroll";

const DEFAULT_PAGE_SIZE = 20;

export type UserRole = "admin" | "pastor";

interface UseInfiniteMembersParams {
  churchSlug: string;
  search?: string;
  filters?: MemberFilters;
  enabled?: boolean;
  role?: UserRole;
}

interface FetchMembersParams {
  churchSlug: string;
  cursor?: string | null;
  limit?: number;
  search?: string;
  filters?: MemberFilters;
  role?: UserRole;
}

/**
 * Fetches paginated members from the API
 */
async function fetchMembers({
  churchSlug,
  cursor,
  limit = DEFAULT_PAGE_SIZE,
  search,
  filters,
  role = "admin",
}: FetchMembersParams): Promise<PaginatedResponse<MemberListItem>> {
  const params = new URLSearchParams();

  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));
  if (search?.trim()) params.set("search", search.trim());
  if (filters?.status) params.set("status", filters.status);
  if (filters?.branchId) params.set("branchId", filters.branchId);

  const endpoint = role === "pastor" ? "/api/pastor/members" : "/api/admin/members";
  const response = await fetch(`${endpoint}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch members" }));
    throw new Error(error.error || "Failed to fetch members");
  }

  return response.json();
}

/**
 * Custom hook for infinite scrolling of members with search and filter support
 *
 * Features:
 * - Cursor-based pagination for efficient data fetching
 * - Debounced search to reduce API calls
 * - Filter support (status, branch)
 * - Automatic cache management via React Query
 */
export function useInfiniteMembers({
  churchSlug,
  search = "",
  filters = {},
  enabled = true,
  role = "admin",
}: UseInfiniteMembersParams) {
  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useInfiniteQuery({
    queryKey: ["members", churchSlug, debouncedSearch, filters, role],
    queryFn: ({ pageParam }) =>
      fetchMembers({
        churchSlug,
        cursor: pageParam,
        search: debouncedSearch,
        filters,
        role,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Flatten all pages into a single array of members
  const members = query.data?.pages.flatMap((page) => page.data) ?? [];

  // Get total count from the first page (if available)
  const totalCount = query.data?.pages[0]?.totalCount;

  return {
    members,
    totalCount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    // Expose search state for UI feedback
    isSearching: search !== debouncedSearch,
  };
}

/**
 * Query key factory for members
 * Useful for cache invalidation and prefetching
 */
export const membersQueryKeys = {
  all: ["members"] as const,
  lists: (churchSlug: string) => [...membersQueryKeys.all, churchSlug] as const,
  list: (churchSlug: string, search: string, filters: MemberFilters) =>
    [...membersQueryKeys.lists(churchSlug), search, filters] as const,
  detail: (churchSlug: string, memberId: string) =>
    [...membersQueryKeys.lists(churchSlug), memberId] as const,
};
