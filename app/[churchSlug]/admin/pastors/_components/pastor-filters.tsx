"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BranchSummary } from "../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  initialQuery: string;
  initialBranchId: string;
  branches: BranchSummary[];
  basePath: string;
};

export function PastorFilters({ initialQuery, initialBranchId, branches, basePath }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [branchId, setBranchId] = useState(initialBranchId || "all");
  const normalizedBranchId = branchId === "all" ? "" : branchId;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    if (normalizedBranchId) params.set("branchId", normalizedBranchId);
    const search = params.toString();
    router.push(search ? `${basePath}?${search}` : basePath);
  };

  const handleReset = () => {
    setQuery("");
    setBranchId("all");
    router.push(basePath);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-[2fr_1fr_auto]">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="pastor-search">
          Search pastors
        </label>
        <Input
          id="pastor-search"
          placeholder="Search by name or email"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Branch</label>
        <Select value={branchId} onValueChange={setBranchId}>
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
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" className="w-full">
          Apply
        </Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}
