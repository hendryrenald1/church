"use client";

import Link from "next/link";
import { Layers3, Plus } from "lucide-react";
import { GroupSummary } from "@/app/[churchSlug]/admin/groups/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  churchSlug: string;
  groups: GroupSummary[];
};

export function GroupList({ churchSlug, groups }: Props) {
  const base = `/${churchSlug}/admin/groups`;
  if (groups.length === 0) {
    return (
      <Card className="space-y-4 p-6 text-center">
        <Layers3 className="mx-auto h-10 w-10 text-muted-foreground" />
        <div>
          <p className="text-xl font-semibold">No groups yet</p>
          <p className="text-sm text-muted-foreground">Organize ministries, volunteers, or interest groups.</p>
        </div>
        <Button asChild>
          <Link href={`${base}/new`}>Create group</Link>
        </Button>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Groups</h1>
          <p className="text-sm text-muted-foreground">Track ministry, volunteer, or interest circles.</p>
        </div>
        <Button asChild>
          <Link href={`${base}/new`} className="gap-2">
            <Plus className="h-4 w-4" />
            New group
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id} className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`${base}/${group.id}`} className="text-lg font-semibold hover:underline">
                  {group.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {group.branch?.name ? `${group.branch.name} branch` : "All branches"}
                </p>
              </div>
              {group.type && <Badge variant="secondary">{group.type}</Badge>}
            </div>
            {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.memberCount} members
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
