"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BranchOption, GroupDetail } from "@/app/[churchSlug]/admin/groups/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  churchSlug: string;
  branches: BranchOption[];
  group?: GroupDetail;
};

export function GroupForm({ churchSlug, branches, group }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: group?.name ?? "",
    type: group?.type ?? "",
    branchId: group?.branch?.id ?? "all",
    description: group?.description ?? ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const body = {
      name: form.name.trim(),
      type: form.type.trim(),
      branchId: form.branchId === "all" ? null : form.branchId,
      description: form.description.trim()
    };

    const endpoint = group ? `/api/admin/groups/${group.id}` : "/api/admin/groups";
    const res = await fetch(endpoint, {
      method: group ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Failed to save group");
      setSubmitting(false);
      return;
    }
    const data = await res.json();
    router.push(`/${churchSlug}/admin/groups/${data.id ?? group?.id ?? ""}`);
    router.refresh();
  };

  return (
    <Card className="max-w-2xl p-6">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="group-name">Group name</Label>
          <Input
            id="group-name"
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Youth Worship Team"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="group-type">Group type</Label>
            <Input
              id="group-type"
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              placeholder="Ministry / Volunteer / Interest"
            />
          </div>
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={form.branchId} onValueChange={(value) => setForm((prev) => ({ ...prev, branchId: value }))}>
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="group-description">Description</Label>
          <Textarea
            id="group-description"
            rows={4}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Describe the purpose of this group."
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full md:w-auto">
          {submitting ? "Saving..." : group ? "Save changes" : "Create group"}
        </Button>
      </form>
    </Card>
  );
}
