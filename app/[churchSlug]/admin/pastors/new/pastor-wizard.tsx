"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { MemberSearchSelector } from "../_components/member-search-selector";
import { BranchMultiSelect } from "../_components/branch-multi-select";
import { PastorStepper } from "../_components/pastor-stepper";
import { BranchSummary, MemberSearchResult } from "../types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  churchSlug: string;
  branches: BranchSummary[];
};

export function PastorWizard({ churchSlug, branches }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<{
    title: string;
    loginEmail: string;
    bio: string;
    ordinationDate: Date | undefined;
    emailDirty: boolean;
  }>({
    title: "",
    loginEmail: "",
    bio: "",
    ordinationDate: undefined,
    emailDirty: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinueFromStep1 = Boolean(selectedMember);
  const canContinueFromStep2 = Boolean(profile.title.trim() && profile.loginEmail.trim());

  const handleNext = () => {
    if (step === 1 && canContinueFromStep1) {
      setStep(2);
    } else if (step === 2 && canContinueFromStep2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 1) return;
    setStep((prev) => prev - 1);
  };

  const handleMemberSelect = (member: MemberSearchResult) => {
    setSelectedMember(member);
    if (!profile.emailDirty) {
      setProfile((prev) => ({
        ...prev,
        loginEmail: member.email ?? "",
        emailDirty: false
      }));
    }
    if (step === 1 && !canContinueFromStep1) {
      // ensures button state updates
    }
  };

  const handleSave = async () => {
    if (!selectedMember || !canContinueFromStep2 || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pastors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          email: profile.loginEmail.trim(),
          title: profile.title.trim(),
          ordinationDate: profile.ordinationDate ? format(profile.ordinationDate, "yyyy-MM-dd") : null,
          bio: profile.bio.trim() || null,
          branchIds
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create pastor");
      }
      const { id } = (await res.json()) as { id: string };
      toast({ title: "Pastor created", description: "The new pastor profile has been saved." });
      router.push(`/${churchSlug}/admin/pastors/${id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const branchSubtitle = useMemo(() => {
    if (branchIds.length === 0) return "Assign optional branch coverage now or later.";
    if (branchIds.length === 1) return "1 branch selected";
    return `${branchIds.length} branches selected`;
  }, [branchIds]);

  return (
    <div className="space-y-6">
      <PastorStepper currentStep={step} />
      {step === 1 && (
        <MemberSearchSelector
          selectedMember={selectedMember}
          onSelect={handleMemberSelect}
          onClear={() => setSelectedMember(null)}
          branches={branches}
        />
      )}
      {step === 2 && (
        <Card>
          <CardHeader className="space-y-1.5">
            <CardTitle>Pastor profile</CardTitle>
            <CardDescription>Provide the pastor&apos;s title, ordination date, and login email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pastor-title">Title</Label>
              <Input
                id="pastor-title"
                placeholder="Lead Pastor"
                value={profile.title}
                onChange={(event) => setProfile((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ordination date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !profile.ordinationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {profile.ordinationDate ? format(profile.ordinationDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={profile.ordinationDate}
                    onSelect={(date) => setProfile((prev) => ({ ...prev, ordinationDate: date ?? undefined }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pastor-email">Pastor login email</Label>
              <Input
                id="pastor-email"
                type="email"
                placeholder="pastor@example.com"
                value={profile.loginEmail}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, loginEmail: event.target.value, emailDirty: true }))
                }
              />
              <p className="text-xs text-muted-foreground">
                An invite email will be sent so they can set a password for their account.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pastor-bio">Bio</Label>
              <Textarea
                id="pastor-bio"
                rows={4}
                placeholder="Enter an optional short bio or ministry notes."
                value={profile.bio}
                onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <BranchMultiSelect branches={branches} selectedBranchIds={branchIds} onChange={setBranchIds} />
          <p className="text-sm text-muted-foreground">{branchSubtitle}</p>
        </div>
      )}
      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 1}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          {step < 3 ? (
            <Button onClick={handleNext} disabled={(step === 1 && !canContinueFromStep1) || (step === 2 && !canContinueFromStep2)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!selectedMember || !canContinueFromStep2 || saving}>
              {saving ? "Saving..." : "Save pastor"}
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
