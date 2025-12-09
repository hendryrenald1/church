"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { BranchSummary } from "../types";
import { BranchMultiSelect } from "./branch-multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  pastorId: string;
  memberId: string;
  defaultTitle: string;
  defaultBio: string | null;
  defaultEmail: string;
  defaultOrdinationDate: string | null;
  defaultBranchIds: string[];
  branches: BranchSummary[];
};

export function PastorDetailForm({
  pastorId,
  memberId,
  defaultTitle,
  defaultBio,
  defaultEmail,
  defaultOrdinationDate,
  defaultBranchIds,
  branches
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState(defaultTitle);
  const [bio, setBio] = useState(defaultBio ?? "");
  const [loginEmail, setLoginEmail] = useState(defaultEmail);
  const [ordinationDate, setOrdinationDate] = useState<Date | undefined>(
    defaultOrdinationDate ? new Date(defaultOrdinationDate) : undefined
  );
  const [branchIds, setBranchIds] = useState<string[]>(defaultBranchIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pastors/${pastorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          title: title.trim(),
          email: loginEmail.trim(),
          bio: bio.trim() || null,
          ordinationDate: ordinationDate ? format(ordinationDate, "yyyy-MM-dd") : null,
          branchIds
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update pastor");
      }
      toast({ title: "Pastor updated", description: "Changes saved successfully." });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="pastor-title">Title</Label>
          <Input id="pastor-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Ordination date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !ordinationDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {ordinationDate ? format(ordinationDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={ordinationDate} onSelect={setOrdinationDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pastor-email">Login email</Label>
          <Input
            id="pastor-email"
            type="email"
            value={loginEmail}
            onChange={(event) => setLoginEmail(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Updating this email also updates their Supabase Auth login.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pastor-bio">Bio</Label>
          <Textarea
            id="pastor-bio"
            rows={4}
            placeholder="Optional short bio or ministry notes."
            value={bio}
            onChange={(event) => setBio(event.target.value)}
          />
        </div>
      </div>
      <BranchMultiSelect branches={branches} selectedBranchIds={branchIds} onChange={setBranchIds} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !title.trim() || !loginEmail.trim()}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
