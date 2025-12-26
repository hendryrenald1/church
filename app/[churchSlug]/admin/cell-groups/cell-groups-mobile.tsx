"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  MapPin,
  RefreshCw,
  Users,
  Search,
  Filter,
  MoreVertical,
  Eye,
  ClipboardList,
  MessageSquare,
  Phone,
  Settings,
  AlertTriangle,
  Calendar,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CellGroupRow } from "./page";

type FilterType = "all" | "active" | "paused" | "attention";

const statusConfig = {
  ACTIVE: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    label: "Active",
  },
  INACTIVE: {
    border: "border-l-gray-400",
    badge: "bg-gray-100 text-gray-600 hover:bg-gray-100",
    label: "Paused",
  },
};

function getAttentionStatus(group: CellGroupRow): { reason: string; message: string } | null {
  const memberCount = group.cell_group_member?.[0]?.count ?? 0;

  // No leader assigned
  if (!group.leader) {
    return { reason: "no_leader", message: "No leader assigned to this group" };
  }

  // No members
  if (memberCount === 0) {
    return { reason: "no_members", message: "No members in this group yet" };
  }

  return null;
}

function MobileCellGroupCard({ group, basePath }: { group: CellGroupRow; basePath: string }) {
  const router = useRouter();
  const status = statusConfig[group.status];
  const memberCount = group.cell_group_member?.[0]?.count ?? 0;
  const attention = getAttentionStatus(group);

  const leaderName = group.leader
    ? `${group.leader.first_name} ${group.leader.last_name}`
    : "No leader";

  const leaderInitials = group.leader
    ? `${group.leader.first_name[0]}${group.leader.last_name[0]}`
    : "?";

  return (
    <Card
      className={cn(
        "p-4 border-l-4 transition-all active:scale-[0.98]",
        status.border,
        attention ? "bg-amber-50/50" : ""
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`${basePath}/${group.id}`} className="hover:underline">
              <h3 className="font-semibold text-base truncate">{group.name}</h3>
            </Link>
            <Badge variant="secondary" className={cn(status.badge, "text-xs px-2 py-0")}>
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{group.branch?.name ?? "Church-wide"}</span>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push(`${basePath}/${group.id}`)}>
              <Eye className="h-4 w-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`${basePath}/${group.id}/attendance`)}>
              <ClipboardList className="h-4 w-4 mr-2" /> Record Attendance
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquare className="h-4 w-4 mr-2" /> Message Group
            </DropdownMenuItem>
            {group.leader?.phone && (
              <DropdownMenuItem asChild>
                <a href={`tel:${group.leader.phone}`}>
                  <Phone className="h-4 w-4 mr-2" /> Call Leader
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`${basePath}/${group.id}/settings`)}>
              <Settings className="h-4 w-4 mr-2" /> Manage Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Leader & Members Row */}
      <div className="flex items-center gap-4 mt-3 text-sm">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={group.leader?.avatar_url} />
            <AvatarFallback className="text-xs">{leaderInitials}</AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground">{leaderName}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{memberCount} members</span>
        </div>
      </div>

      {/* Attention Banner */}
      {attention && (
        <div className="flex items-center gap-2 mt-3 p-2 rounded-md bg-amber-100 text-amber-800 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{attention.message}</span>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex gap-2 mt-3 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-xs"
          onClick={() => {
            // Open WhatsApp or messaging - placeholder action
          }}
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
          Message
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-xs"
          onClick={() => router.push(`${basePath}/${group.id}/attendance`)}
        >
          <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
          Attendance
        </Button>
      </div>
    </Card>
  );
}

function MobileLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4 border-l-4 border-l-gray-200">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-2 pt-3 border-t">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MobileEmptyState({ basePath }: { basePath: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg">No Cell Groups Yet</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Cell groups in your assigned branches will appear here.
      </p>
      <Button asChild>
        <Link href={`${basePath}/new`}>
          <Plus className="h-4 w-4 mr-2" />
          Create First Group
        </Link>
      </Button>
    </div>
  );
}

interface CellGroupsMobileViewProps {
  initialGroups: CellGroupRow[];
  basePath: string;
  churchId: string;
}

export function CellGroupsMobileView({ initialGroups, basePath, churchId }: CellGroupsMobileViewProps) {
  const [groups, setGroups] = useState<CellGroupRow[]>(initialGroups);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("cell_group")
      .select(`
        id,
        name,
        status,
        branch:branch_id (id, name),
        cell_group_member(count),
        leader:leader_id (
          id,
          first_name,
          last_name,
          phone,
          avatar_url
        )
      `)
      .eq("church_id", churchId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load cell groups", error);
      return;
    }

    setGroups((data ?? []) as unknown as CellGroupRow[]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  const filteredGroups = useMemo(() => {
    let result = groups;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.branch?.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (activeFilter === "active") {
      result = result.filter((g) => g.status === "ACTIVE");
    } else if (activeFilter === "paused") {
      result = result.filter((g) => g.status === "INACTIVE");
    } else if (activeFilter === "attention") {
      result = result.filter((g) => getAttentionStatus(g) !== null);
    }

    return result;
  }, [groups, searchQuery, activeFilter]);

  const filterCounts = useMemo(() => {
    const active = groups.filter((g) => g.status === "ACTIVE").length;
    const paused = groups.filter((g) => g.status === "INACTIVE").length;
    const attention = groups.filter((g) => getAttentionStatus(g) !== null).length;
    return { all: groups.length, active, paused, attention };
  }, [groups]);

  return (
    <div className="md:hidden">
      <div className="mx-auto max-w-2xl space-y-4 px-4 pb-8 pt-4">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Cell Groups</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {groups.length} groups in your branches
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sticky Search & Filter Bar */}
        <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pb-3 space-y-3 -mx-4 px-4 pt-1">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              className="pl-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Badge
              variant={activeFilter === "all" ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setActiveFilter("all")}
            >
              All ({filterCounts.all})
            </Badge>
            <Badge
              variant={activeFilter === "active" ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setActiveFilter("active")}
            >
              Active ({filterCounts.active})
            </Badge>
            <Badge
              variant={activeFilter === "paused" ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setActiveFilter("paused")}
            >
              Paused ({filterCounts.paused})
            </Badge>
            {filterCounts.attention > 0 && (
              <Badge
                variant={activeFilter === "attention" ? "default" : "outline"}
                className={cn(
                  "cursor-pointer whitespace-nowrap",
                  activeFilter !== "attention" && "text-amber-600 border-amber-300"
                )}
                onClick={() => setActiveFilter("attention")}
              >
                Needs Attention ({filterCounts.attention})
              </Badge>
            )}
          </div>
        </div>

        {/* Groups List */}
        {filteredGroups.length === 0 && groups.length === 0 ? (
          <MobileEmptyState basePath={basePath} />
        ) : filteredGroups.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
            No groups match your search or filters.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <MobileCellGroupCard key={group.id} group={group} basePath={basePath} />
            ))}
          </div>
        )}

        {filteredGroups.length > 0 && (
          <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            End of list
          </p>
        )}
      </div>
    </div>
  );
}
