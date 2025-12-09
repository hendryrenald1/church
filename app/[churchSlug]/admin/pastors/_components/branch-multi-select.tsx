"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { BranchSummary } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  branches: BranchSummary[];
  selectedBranchIds: string[];
  onChange: (branchIds: string[]) => void;
  allowEmpty?: boolean;
};

export function BranchMultiSelect({ branches, selectedBranchIds, onChange, allowEmpty = true }: Props) {
  const [search, setSearch] = useState("");

  const filteredBranches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return branches;
    return branches.filter((branch) => {
      const haystack = `${branch.name} ${branch.city ?? ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [search, branches]);

  const toggleBranch = (branchId: string) => {
    if (selectedBranchIds.includes(branchId)) {
      onChange(selectedBranchIds.filter((id) => id !== branchId));
    } else {
      onChange([...selectedBranchIds, branchId]);
    }
  };

  const removeBranch = (branchId: string) => onChange(selectedBranchIds.filter((id) => id !== branchId));

  return (
    <Card>
      <CardHeader className="space-y-1.5">
        <CardTitle>Assign branches</CardTitle>
        <CardDescription>Search and select one or more branches to link to this pastor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No branches yet. Create branches before assigning pastors.</p>
        ) : (
          <>
            <Input
              placeholder="Search branches by name or city"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-md"
            />
            <ScrollArea className="max-h-72 rounded-md border">
              <div className="divide-y">
                {filteredBranches.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No branches match your search.</p>
                ) : (
                  filteredBranches.map((branch) => (
                    <label key={branch.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/40">
                      <Checkbox checked={selectedBranchIds.includes(branch.id)} onCheckedChange={() => toggleBranch(branch.id)} />
                      <div className="flex flex-col">
                        <span className="font-medium">{branch.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {branch.city ?? "City unknown"} {branch.isActive ? "" : "· Inactive"}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Assigned branches</p>
              {selectedBranchIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {allowEmpty ? "No branches selected." : "Please select at least one branch before continuing."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedBranchIds.map((branchId) => {
                    const branch = branches.find((b) => b.id === branchId);
                    if (!branch) return null;
                    return (
                      <Badge key={branch.id} variant="secondary" className="flex items-center gap-1">
                        {branch.name}
                        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => removeBranch(branch.id)}>
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            {selectedBranchIds.length > 0 && (
              <Button variant="ghost" className="text-sm text-muted-foreground" type="button" onClick={() => onChange([])}>
                Clear branches
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
