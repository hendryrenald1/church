"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MemberOption = { id: string; first_name: string; last_name: string; email: string | null };
type BranchOption = { id: string; name: string };
type Pastor = {
  id: string;
  member_id: string;
  title: string;
  ordination_date: string | null;
  bio: string | null;
  member: MemberOption | null;
  pastor_branch: { branch_id: string | null }[] | null;
};

type Props = {
  churchSlug: string;
  members: MemberOption[];
  branches: BranchOption[];
  pastor?: Pastor;
};

const normalizeDateInput = (value: string | null | undefined) => (value ? value.split("T")[0] : "");

export default function PastorForm({ churchSlug, members, branches, pastor }: Props) {
  const router = useRouter();
  const initialBranchIds = useMemo(
    () => pastor?.pastor_branch?.map((pb) => pb.branch_id).filter((id): id is string => Boolean(id)) ?? [],
    [pastor]
  );
  const [form, setForm] = useState({
    memberId: pastor?.member_id ?? "",
    email: pastor?.member?.email ?? "",
    title: pastor?.title ?? "",
    ordinationDate: normalizeDateInput(pastor?.ordination_date),
    bio: pastor?.bio ?? "",
    branchIds: initialBranchIds as string[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(pastor);

  const handleTextChange = (field: "memberId" | "title" | "ordinationDate" | "bio" | "email") =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleMemberChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const selectedMember = members.find((member) => member.id === value);
    setForm((prev) => ({
      ...prev,
      memberId: value,
      email: selectedMember?.email ?? ""
    }));
  };

  const handleBranchToggle = (branchId: string) => () => {
    setForm((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
        ? prev.branchIds.filter((id) => id !== branchId)
        : [...prev.branchIds, branchId]
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const endpoint = pastor ? `/api/admin/pastors/${pastor.id}` : "/api/admin/pastors";
    const method = pastor ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: form.memberId,
        email: form.email.trim(),
        title: form.title,
        ordinationDate: form.ordinationDate || null,
        bio: form.bio || null,
        branchIds: form.branchIds
      })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to save pastor");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.push(`/${churchSlug}/admin/pastors`);
    router.refresh();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Member</h2>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Select member</span>
          <select
            className="rounded-lg border px-3 py-2"
            required
            value={form.memberId}
            onChange={handleMemberChange}
            disabled={isEdit}
          >
            <option value="">Choose member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{`${member.first_name} ${member.last_name}`}</option>
            ))}
          </select>
          {isEdit && <p className="text-xs text-muted-foreground">Members cannot be changed after creation.</p>}
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Pastor login email</span>
          <input
            className="rounded-lg border px-3 py-2"
            type="email"
            required
            placeholder="pastor@example.com"
            value={form.email}
            onChange={handleTextChange("email")}
          />
          <p className="text-xs text-muted-foreground">
            {isEdit
              ? "Updating this email changes the pastor's login as well."
              : "An invite email will be sent so they can set a password."}
          </p>
        </label>
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Pastor profile</h2>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Title</span>
          <input
            className="rounded-lg border px-3 py-2"
            required
            value={form.title}
            onChange={handleTextChange("title")}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Ordination date</span>
          <input
            className="rounded-lg border px-3 py-2"
            type="date"
            value={form.ordinationDate}
            onChange={handleTextChange("ordinationDate")}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Bio</span>
          <textarea
            className="rounded-lg border px-3 py-2"
            rows={3}
            value={form.bio}
            onChange={handleTextChange("bio")}
          />
        </label>
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Branch assignments</h2>
        {branches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No branches yet. Add branches first.</p>
        ) : (
          <div className="grid gap-2 text-sm">
            {branches.map((branch) => (
              <label key={branch.id} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.branchIds.includes(branch.id)}
                  onChange={handleBranchToggle(branch.id)}
                />
                {branch.name}
              </label>
            ))}
          </div>
        )}
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? "Saving..." : isEdit ? "Save changes" : "Save pastor"}
      </button>
    </form>
  );
}
