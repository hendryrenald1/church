"use client";

import { BranchOption } from "@/app/[churchSlug]/admin/groups/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  branches: BranchOption[];
  search: string;
  status: string;
  branchId: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onBranchChange: (value: string) => void;
};

export function GroupMemberFilters({
  branches,
  search,
  status,
  branchId,
  onSearchChange,
  onStatusChange,
  onBranchChange
}: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Input
        placeholder="Search name, email, or phone"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <Select value={branchId || "all"} onValueChange={(value) => onBranchChange(value === "all" ? "" : value)}>
        <SelectTrigger>
          <SelectValue placeholder="All branches" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All branches</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status || "all"} onValueChange={(value) => onStatusChange(value === "all" ? "" : value)}>
        <SelectTrigger>
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
