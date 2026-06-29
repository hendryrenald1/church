"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteMembers, type UserRole } from "@/lib/hooks/use-infinite-members";
import { SimpleInfiniteList } from "@/components/ui/infinite-list";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Search,
  SlidersHorizontal,
  X,
  Eye,
  Pencil,
  MoreHorizontal,
  Trash2,
  ArrowRightLeft,
  Mail,
  Users,
  UserCheck,
  UserX
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
}

interface MembersListProps {
  churchSlug: string;
  basePath: string;
  role?: UserRole;
  totalActive?: number;
  totalInactive?: number;
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  if (first && last) return (first + last).toUpperCase();
  return (firstName || lastName || "??").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-pink-600",
  "bg-sky-600",
  "bg-orange-600",
];

function getAvatarColor(firstName: string, lastName: string): string {
  const name = `${firstName} ${lastName}`;
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] + " text-white";
}

// ─── Member Row ──────────────────────────────────────────────────────────────

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
  const viewHref = `${basePath}/${member.id}`;
  const editHref = `${basePath}/${member.id}/edit`;

  // Clicking anywhere on the row navigates to the member's profile (industry standard).
  // The checkbox and action button container each call e.stopPropagation() so they
  // remain independently functional without triggering row navigation.
  const handleRowClick = () => router.push(viewHref);
  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(viewHref);
    }
  };

  return (
    <>
      {/* Desktop row */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
        className={`group hidden sm:grid sm:grid-cols-[2rem_1fr_160px_100px_120px_108px] items-center gap-3 px-4 py-3 border-b last:border-b-0 text-sm transition-colors cursor-pointer outline-none
          ${isSelected ? "bg-primary/5" : "hover:bg-muted/40 focus-visible:bg-muted/40"}`}
      >
        {/* Checkbox — isolated from row click */}
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${member.first_name} ${member.last_name}`}
          />
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(member.first_name, member.last_name)}`}>
              {getInitials(member.first_name, member.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate leading-tight group-hover:text-primary transition-colors">
              {member.first_name} {member.last_name}
            </p>
            {member.email && (
              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            )}
          </div>
        </div>

        <div>
          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
            {member.branch?.name ?? "Unassigned"}
          </span>
        </div>

        <div>
          {member.status === "ACTIVE" ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              Inactive
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground">{member.joined_date}</div>

        {/* Actions — isolated from row click */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => router.push(viewHref)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">View profile</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => router.push(editHref)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => router.push(viewHref)}>
                  <Eye className="mr-2 h-3.5 w-3.5" /> View profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(editHref)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <ArrowRightLeft className="mr-2 h-3.5 w-3.5" /> Move to branch
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="mr-2 h-3.5 w-3.5" /> Send message
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
      </div>

      {/* Mobile row */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
        className={`group flex sm:hidden items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer outline-none
          ${isSelected ? "bg-primary/5" : "hover:bg-muted/40 focus-visible:bg-muted/40"}`}
      >
        {/* Checkbox — isolated from row click */}
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${member.first_name} ${member.last_name}`}
          />
        </div>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(member.first_name, member.last_name)}`}>
            {getInitials(member.first_name, member.last_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {member.first_name} {member.last_name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-xs text-muted-foreground">
              {member.branch?.name ?? "Unassigned"}
            </span>
            {member.status === "ACTIVE" ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" /> Inactive
              </span>
            )}
          </div>
        </div>
        {/* Actions — isolated from row click */}
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => router.push(viewHref)}>
                <Eye className="mr-2 h-3.5 w-3.5" /> View profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(editHref)}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
});

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function MemberRowSkeleton() {
  return (
    <div className="hidden sm:grid sm:grid-cols-[2rem_1fr_160px_100px_120px_108px] items-center gap-3 px-4 py-3 border-b">
      <Skeleton className="h-4 w-4 rounded" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-5 w-20 rounded-md" />
      <Skeleton className="h-4 w-14" />
      <Skeleton className="h-4 w-20" />
      <div className="flex justify-end gap-1">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}

// ─── Bulk Actions Bar ─────────────────────────────────────────────────────────

function BulkActionsBar({
  selectedCount,
  onClearSelection
}: {
  selectedCount: number;
  onClearSelection: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-primary/5 border-primary/20 px-4 py-2.5 text-sm">
      <span className="font-medium text-primary">{selectedCount} selected</span>
      <div className="flex items-center gap-2 ml-1">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <ArrowRightLeft className="h-3.5 w-3.5" /> Move branch
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Mail className="h-3.5 w-3.5" /> Message
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
      <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs text-muted-foreground" onClick={onClearSelection}>
        Clear selection
      </Button>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Users className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {hasFilters ? "No members match your search" : "No members yet"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {hasFilters ? "Try adjusting your filters or search term." : "Add your first member to get started."}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MembersList({ churchSlug, basePath, role = "admin" }: MembersListProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MemberFilters>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const endpoint = role === "pastor" ? "/api/pastor/branches" : "/api/admin/branches";
        const res = await fetch(endpoint);
        if (res.ok) setBranches(await res.json());
      } catch (error) {
        console.error("Failed to load branches:", error);
      } finally {
        setBranchesLoading(false);
      }
    }
    fetchBranches();
  }, [role]);

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
  } = useInfiniteMembers({ churchSlug, search, filters, role });

  const isAllSelected = members.length > 0 && selectedIds.size === members.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < members.length;

  const toggleAll = useCallback(() => {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(members.map((m) => m.id)));
  }, [isAllSelected, members]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : (value as "ACTIVE" | "INACTIVE")
    }));
  }, []);

  const handleBranchChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      branchId: value === "all" ? undefined : value
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setFilters({});
    searchInputRef.current?.focus();
  }, []);

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

  const keyExtractor = useCallback((member: MemberListItem) => member.id, []);

  const hasActiveFilters = !!(search || filters.status || filters.branchId);
  const activeFilterCount = [filters.status, filters.branchId].filter(Boolean).length;
  const activeBranchName =
    branches.find((b) => b.id === filters.branchId)?.name ?? (filters.branchId ? "Unknown" : null);

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm text-destructive font-medium">Failed to load members</p>
        <p className="text-xs text-muted-foreground mt-1">{error?.message || "An unknown error occurred."}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search name, email or phone…"
              value={search}
              onChange={handleSearchChange}
              className="pl-9 bg-background"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>

          {/* Desktop filters */}
          <div className="hidden md:flex gap-2">
            <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[130px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.branchId || "all"} onValueChange={handleBranchChange} disabled={branchesLoading}>
              <SelectTrigger className="w-[150px] bg-background">
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

          {/* Mobile filter sheet */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters"}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="space-y-4">
                <SheetHeader>
                  <SheetTitle>Filter Members</SheetTitle>
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
                      Clear all filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Clear button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="hidden md:flex gap-1.5 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-muted/10 text-xs">
            <span className="text-muted-foreground">Filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 animate-in fade-in">
                &ldquo;{search}&rdquo;
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-full hover:bg-primary/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 animate-in fade-in">
                {filters.status === "ACTIVE" ? "Active" : "Inactive"}
                <button
                  type="button"
                  onClick={() => handleStatusChange("all")}
                  className="rounded-full hover:bg-primary/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.branchId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 animate-in fade-in">
                {activeBranchName}
                <button
                  type="button"
                  onClick={() => handleBranchChange("all")}
                  className="rounded-full hover:bg-primary/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {!isLoading && (
              <span className="ml-auto text-muted-foreground">
                {members.length} result{members.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-primary/5">
            <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2 ml-1">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5" /> Move branch
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs text-muted-foreground"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Table header */}
        <div className="hidden sm:grid sm:grid-cols-[2rem_1fr_160px_100px_120px_108px] items-center gap-3 px-4 py-2.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b">
          <Checkbox
            checked={isAllSelected}
            indeterminate={isSomeSelected}
            onCheckedChange={toggleAll}
            aria-label="Select all"
          />
          <span>Member</span>
          <span>Branch</span>
          <span>Status</span>
          <span>Joined</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        <SimpleInfiniteList
          items={members}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          renderItem={renderMember}
          renderSkeleton={() => <MemberRowSkeleton />}
          keyExtractor={keyExtractor}
          emptyMessage=""
        />

        {/* Empty state */}
        {!isLoading && members.length === 0 && <EmptyState hasFilters={hasActiveFilters} />}

        {/* Footer count */}
        {!isLoading && members.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
            <span>
              Showing {members.length}
              {totalCount !== undefined ? ` of ${totalCount}` : ""} members
            </span>
            {hasActiveFilters && (
              <span className="text-primary font-medium">Filters applied</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
