/**
 * Generic types for cursor-based infinite scrolling
 */

// API response structure for paginated endpoints
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

// Parameters for paginated API requests
export interface PaginationParams {
  cursor?: string | null;
  limit?: number;
  search?: string;
  filters?: Record<string, string | string[] | undefined>;
}

// Member-specific types
export interface MemberListItem {
  id: string;
  first_name: string;
  last_name: string;
  status: "ACTIVE" | "INACTIVE";
  joined_date: string;
  email: string | null;
  phone: string | null;
  branch: { id: string; name: string } | null;
}

export interface MemberFilters {
  status?: "ACTIVE" | "INACTIVE" | "";
  branchId?: string;
}

// API fetch function type for infinite queries
export type InfiniteFetcher<T, F = Record<string, unknown>> = (params: {
  pageParam?: string | null;
  search?: string;
  filters?: F;
}) => Promise<PaginatedResponse<T>>;
