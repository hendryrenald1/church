"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInfiniteMembers } from "@/lib/hooks/use-infinite-members";
import { SimpleInfiniteList } from "@/components/ui/infinite-list";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { MemberListItem, MemberFilters } from "@/types/infinite-scroll";
import { SlidersHorizontal, X, Eye, Pencil, MoreHorizontal, Trash2, ArrowRightLeft, Mail } from "lucide-react";

interface Branch {
  id: string;
  name: string;
}

interface MembersListProps {
  churchSlug: string;
  basePath: string;
}

// Generate initials from full name
function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  if (first && last) {
    return (first + last).toUpperCase();
  }
  return (firstName || lastName || "??").slice(0, 2).toUpperCase();
}

// Deterministic colour based on name
function getAvatarColor(firstName: string, lastName: string): string {
  const colors = [
    "bg-slate-500",
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-600",
    "bg-lime-600",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-pink-500"
  ];
  const name = `${firstName} ${lastName}`;
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] + " text-white";
}

/**
 * Memoized member row component for performance
 * Uses table-like grid layout to match header columns
 */
const MemberRow = memo(function MemberRow({
  member,
  basePath,
  isSelected,
  onToggleSelect
}: {
  member: MemberListItem;
  basePath: string;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-2 border-b px-4 py-2 hover:bg-muted/50 transition-colors text-sm">
      {/* Checkbox */}
      <div className="flex items-center justify-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select ${member.first_name} ${member.last_name}`}
        />
      </div>

      {/* Name with Avatar */}
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={getAvatarColor(member.first_name, member.last_name)}>
            {getInitials(member.first_name, member.last_name)}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">
          {member.first_name} {member.last_name}
        </span>
      </div>

      {/* Branch - hidden on mobile, shown in sm+ */}
      <div className="hidden sm:block">
        <Badge variant="outline" className="font-normal text-muted-foreground">
          {member.branch?.name ?? "Unassigned"}
        </Badge>
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
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push(`${basePath}/${member.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push(`${basePath}/${member.id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`${basePath}/${member.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`${basePath}/${member.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Move to branch
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send message
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>

      {/* Mobile: Branch and Status shown below name */}
      <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground sm:hidden ml-6">
        <Badge variant="outline" className="font-normal text-muted-foreground">
          {member.branch?.name ?? "Unassigned"}
        </Badge>
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
    <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-2 border-b px-4 py-2">
      {/* Checkbox */}
      <Skeleton className="h-4 w-4" />
      {/* Name with Avatar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      {/* Branch */}
      <Skeleton className="hidden sm:block h-5 w-24 rounded-full" />
      {/* Status */}
      <Skeleton className="hidden sm:block h-5 w-16 rounded-full" />
      {/* Joined */}
      <Skeleton className="hidden sm:block h-4 w-20" />
      {/* Actions */}
      <div className="flex gap-1">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      {/* Mobile: Branch/Status */}
      <div className="col-span-2 flex items-center gap-2 sm:hidden ml-6">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Bulk actions bar shown when members are selected
 */
function BulkActionsBar({
  selectedCount,
  onClearSelection
}: {
  selectedCount: number;
  onClearSelection: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Move to branch
        </Button>
        <Button variant="outline" size="sm">
          Export
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Clear selection
      </Button>
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
    isSearching
  } = useInfiniteMembers({
    churchSlug,
    search,
    filters
  });

  // Bulk selection logic
  const isAllSelected = members.length > 0 && selectedIds.size === members.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < members.length;

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.id)));
    }
  }, [isAllSelected, members]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  // Handle status filter change
  const handleStatusChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : (value as "ACTIVE" | "INACTIVE")
    }));
  }, []);

  // Handle branch filter change
  const handleBranchChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      branchId: value === "all" ? undefined : value
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
      <MemberRow
        member={member}
        basePath={basePath}
        isSelected={selectedIds.has(member.id)}
        onToggleSelect={() => toggleOne(member.id)}
      />
    ),
    [basePath, selectedIds, toggleOne]
  );

  // Key extractor for list items
  const keyExtractor = useCallback((member: MemberListItem) => member.id, []);

  // Check if any filters are active
  const hasActiveFilters = search || filters.status || filters.branchId;
  const activeFilterCount = [filters.status, filters.branchId].filter(Boolean).length;
  const activeBranchName =
    branches.find((branch) => branch.id === filters.branchId)?.name ?? (filters.branchId ? "Unknown" : null);

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load members: {error?.message || "Unknown error"}</p>
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
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="relative w-full md:w-[320px]">
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

          <div className="hidden md:flex gap-2">
            <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.branchId || "all"} onValueChange={handleBranchChange} disabled={branchesLoading}>
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
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters"}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="space-y-4">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-3">
                  <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.branchId || "all"} onValueChange={handleBranchChange} disabled={branchesLoading}>
                    <SelectTrigger className="w-full">
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
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      Clear all
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {search && (
              <Badge variant="secondary" className="animate-in fade-in">
                <span className="mr-1">Search: {search}</span>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-sm p-0.5 text-muted-foreground transition hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="animate-in fade-in">
                <span className="mr-1">Status: {filters.status}</span>
                <button
                  type="button"
                  onClick={() => handleStatusChange("all")}
                  className="rounded-sm p-0.5 text-muted-foreground transition hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.branchId && (
              <Badge variant="secondary" className="animate-in fade-in">
                <span className="mr-1">Branch: {activeBranchName}</span>
                <button
                  type="button"
                  onClick={() => handleBranchChange("all")}
                  className="rounded-sm p-0.5 text-muted-foreground transition hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar selectedCount={selectedIds.size} onClearSelection={clearSelection} />

      {/* Results Summary */}
      {!isLoading && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {totalCount !== undefined
              ? `Showing ${members.length} of ${totalCount} members`
              : `${members.length} members`}
          </span>
          {hasActiveFilters && <span className="text-primary">Filters applied</span>}
        </div>
      )}

      {/* Members Table */}
      <div className="overflow-hidden rounded-lg border">
        {/* Table Header - matches grid layout */}
        <div className="hidden bg-secondary/50 sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground">
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isAllSelected}
              indeterminate={isSomeSelected}
              onCheckedChange={toggleAll}
              aria-label="Select all"
            />
          </div>
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
            hasActiveFilters ? "No members match your search criteria." : "No members yet. Add your first member!"
          }
        />
      </div>
    </div>
  );
}
