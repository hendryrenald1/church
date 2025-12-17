"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import Link from "next/link";
import { useInfiniteMembers } from "@/lib/hooks/use-infinite-members";
import { SimpleInfiniteList } from "@/components/ui/infinite-list";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { MemberListItem, MemberFilters } from "@/types/infinite-scroll";
import { cn } from "@/lib/utils";

interface Branch {
  id: string;
  name: string;
}

interface MembersListProps {
  churchSlug: string;
  basePath: string;
}

/**
 * Memoized member row component for performance
 * Uses table-like grid layout to match header columns
 */
const MemberRow = memo(function MemberRow({
  member,
  basePath,
}: {
  member: MemberListItem;
  basePath: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-2 border-b px-4 py-3 hover:bg-muted/40 transition-colors text-sm">
      {/* Name */}
      <div className="font-medium">
        {member.first_name} {member.last_name}
      </div>

      {/* Branch - hidden on mobile, shown in sm+ */}
      <div className="hidden sm:block text-muted-foreground">
        {member.branch?.name ?? "Unassigned"}
      </div>

      {/* Status */}
      <div className="hidden sm:block">
        <Badge
          variant={member.status === "ACTIVE" ? "default" : "secondary"}
          className="text-xs"
        >
          {member.status}
        </Badge>
      </div>

      {/* Joined Date - hidden on mobile */}
      <div className="hidden sm:block text-muted-foreground">
        {member.joined_date}
      </div>

      {/* Actions */}
      <div className="flex gap-3 text-primary">
        <Link
          href={`${basePath}/${member.id}`}
          className="underline hover:no-underline"
        >
          View
        </Link>
        <Link
          href={`${basePath}/${member.id}/edit`}
          className="underline hover:no-underline"
        >
          Edit
        </Link>
      </div>

      {/* Mobile: Branch and Status shown below name */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground sm:hidden">
        <span>{member.branch?.name ?? "Unassigned"}</span>
        <Badge
          variant={member.status === "ACTIVE" ? "default" : "secondary"}
          className="text-xs"
        >
          {member.status}
        </Badge>
      </div>
    </div>
  );
});

/**
 * Skeleton loader for member rows - matches grid layout
 */
function MemberRowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-2 border-b px-4 py-3">
      {/* Name */}
      <Skeleton className="h-5 w-32" />
      {/* Branch */}
      <Skeleton className="hidden sm:block h-4 w-24" />
      {/* Status */}
      <Skeleton className="hidden sm:block h-5 w-16 rounded-full" />
      {/* Joined */}
      <Skeleton className="hidden sm:block h-4 w-20" />
      {/* Actions */}
      <div className="flex gap-3">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
      </div>
      {/* Mobile: Branch/Status */}
      <div className="flex items-center gap-2 sm:hidden">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Members list with infinite scrolling, search, and filters
 */
export function MembersList({ churchSlug, basePath }: MembersListProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MemberFilters>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch branches for filter dropdown
  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await fetch("/api/admin/branches");
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
        }
      } catch (error) {
        console.error("Failed to load branches:", error);
      } finally {
        setBranchesLoading(false);
      }
    }
    fetchBranches();
  }, []);

  const {
    members,
    totalCount,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isSearching,
  } = useInfiniteMembers({
    churchSlug,
    search,
    filters,
  });

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  // Handle status filter change
  const handleStatusChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : (value as "ACTIVE" | "INACTIVE"),
    }));
  }, []);

  // Handle branch filter change
  const handleBranchChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      branchId: value === "all" ? undefined : value,
    }));
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearch("");
    setFilters({});
    searchInputRef.current?.focus();
  }, []);

  // Render member row
  const renderMember = useCallback(
    (member: MemberListItem) => (
      <MemberRow member={member} basePath={basePath} />
    ),
    [basePath]
  );

  // Key extractor for list items
  const keyExtractor = useCallback((member: MemberListItem) => member.id, []);

  // Check if any filters are active
  const hasActiveFilters = search || filters.status || filters.branchId;

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">
          Failed to load members: {error?.message || "Unknown error"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={handleSearchChange}
            className="w-full"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.branchId || "all"}
            onValueChange={handleBranchChange}
            disabled={branchesLoading}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {!isLoading && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {totalCount !== undefined
              ? `Showing ${members.length} of ${totalCount} members`
              : `${members.length} members`}
          </span>
          {hasActiveFilters && (
            <span className="text-primary">Filters applied</span>
          )}
        </div>
      )}

      {/* Members Table */}
      <div className="overflow-hidden rounded-lg border">
        {/* Table Header - matches grid layout */}
        <div className="hidden bg-secondary/50 sm:grid sm:grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground">
          <span>Name</span>
          <span>Branch</span>
          <span>Status</span>
          <span>Joined</span>
          <span>Actions</span>
        </div>

        {/* Infinite List */}
        <SimpleInfiniteList
          items={members}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          renderItem={renderMember}
          renderSkeleton={() => <MemberRowSkeleton />}
          keyExtractor={keyExtractor}
          emptyMessage={
            hasActiveFilters
              ? "No members match your search criteria."
              : "No members yet. Add your first member!"
          }
        />
      </div>
    </div>
  );
}
