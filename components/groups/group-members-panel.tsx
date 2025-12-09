"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { BranchOption, GroupMember } from "@/app/[churchSlug]/admin/groups/types";
import { GroupMemberFilters } from "@/components/groups/group-member-filters";
import { GroupMemberList } from "@/components/groups/group-member-list";
import { GroupMemberSearch } from "@/components/groups/group-member-search";
import { Card } from "@/components/ui/card";

type Props = {
  groupId: string;
  branches: BranchOption[];
};

export function GroupMembersPanel({ groupId, branches }: Props) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, startTransition] = useTransition();
  const [filters, setFilters] = useState({ search: "", status: "", branchId: "" });
  const visibleMembers = members.filter((item) => {
    const member = item.member;
    const matchesBranch = !filters.branchId || member.branch?.id === filters.branchId;
    const matchesStatus = !filters.status || member.status === filters.status;
    const text = `${member.first_name} ${member.last_name} ${member.email ?? ""} ${member.phone ?? ""}`.toLowerCase();
    const matchesSearch = !filters.search || text.includes(filters.search.toLowerCase());
    return matchesBranch && matchesStatus && matchesSearch;
  });

  const loadMembers = useCallback(() => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/groups/${groupId}/members`);
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) setMembers(data);
    });
  }, [groupId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAdd = async (ids: string[]) => {
    await fetch(`/api/admin/groups/${groupId}/members/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberIds: ids })
    });
    loadMembers();
  };

  const handleRemove = async (memberId: string) => {
    await fetch(`/api/admin/groups/${groupId}/members/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId })
    });
    loadMembers();
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div>
          <h2 className="text-lg font-semibold">Group members</h2>
          <p className="text-sm text-muted-foreground">Search, filter, and manage membership.</p>
        </div>
        <GroupMemberFilters
          branches={branches}
          search={filters.search}
          status={filters.status}
          branchId={filters.branchId}
          onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          onStatusChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
          onBranchChange={(value) => setFilters((prev) => ({ ...prev, branchId: value }))}
        />
        <GroupMemberSearch groupId={groupId} filters={filters} onAddMembers={handleAdd} />
      </Card>
      <GroupMemberList members={visibleMembers} onRemove={handleRemove} />
      {loadingMembers && <p className="text-xs text-muted-foreground">Refreshing members...</p>}
    </div>
  );
}
