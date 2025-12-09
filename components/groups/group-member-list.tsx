"use client";

import { useTransition } from "react";
import { GroupMember } from "@/app/[churchSlug]/admin/groups/types";
import { calculateAge } from "@/components/groups/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  members: GroupMember[];
  onRemove: (memberId: string) => Promise<void>;
};

export function GroupMemberList({ members, onRemove }: Props) {
  const [pending, startTransition] = useTransition();

  if (members.length === 0) {
    return (
      <Card className="p-4 text-center text-sm text-muted-foreground">No members have been added yet.</Card>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((item) => {
        const member = item.member;
        const age = calculateAge(member.date_of_birth);
        return (
          <Card key={member.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">
                {member.first_name} {member.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {member.branch?.name ?? "No branch"} · {member.status.toLowerCase()}
                {age !== null ? ` · ${age} yrs` : ""}
              </p>
              <p className="text-xs text-muted-foreground">{member.email ?? member.phone ?? "No contact"}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await onRemove(member.id);
                })
              }
            >
              Remove
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
