"use client";

import { useEffect, useState, useTransition } from "react";
import { MemberCandidate } from "@/app/[churchSlug]/admin/groups/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { calculateAge } from "@/components/groups/utils";

type Props = {
  groupId: string;
  filters: { search: string; status: string; branchId: string };
  onAddMembers: (ids: string[]) => Promise<void>;
};

export function GroupMemberSearch({ groupId, filters, onAddMembers }: Props) {
  const [candidates, setCandidates] = useState<MemberCandidate[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const query = new URLSearchParams({
        scope: "candidates",
        search: filters.search,
        status: filters.status,
        branchId: filters.branchId
      });
      const res = await fetch(`/api/admin/groups/${groupId}/members?${query.toString()}`);
      const data = await res.json().catch(() => []);
      setCandidates(Array.isArray(data) ? data : []);
    });
  }, [groupId, filters]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold">Available members</p>
        <Button
          variant="outline"
          disabled={!selected.length || loading}
          onClick={() =>
            startTransition(async () => {
              await onAddMembers(selected);
              setSelected([]);
            })
          }
        >
          Add {selected.length ? `${selected.length} member(s)` : ""}
        </Button>
      </div>
      <ScrollArea className="h-64 rounded border">
        <div className="divide-y">
          {candidates.map((candidate) => {
            const checked = selected.includes(candidate.id);
            const age = calculateAge(candidate.date_of_birth);
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => toggle(candidate.id)}
                className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-muted/60"
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {candidate.first_name} {candidate.last_name}
                  </p>
                  {checked && <Badge variant="secondary">Selected</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {candidate.branch?.name ?? "No branch"} · {candidate.status.toLowerCase()}
                  {age !== null ? ` · ${age} yrs` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {candidate.email ?? candidate.phone ?? "No contact"}
                </p>
              </button>
            );
          })}
          {candidates.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">No members match this search.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
