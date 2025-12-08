"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type MemberOption = { id: string; first_name: string; last_name: string };

type Props = {
  churchSlug: string;
  members: MemberOption[];
};

export default function FamilyForm({ churchSlug, members }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    familyName: "",
    weddingAnniversary: "",
    address: "",
    headMemberId: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (field: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      familyName: form.familyName.trim(),
      weddingAnniversary: form.weddingAnniversary || null,
      address: form.address.trim() || null,
      headMemberId: form.headMemberId || null
    };

    const res = await fetch("/api/admin/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to create family");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.push(`/${churchSlug}/admin/families`);
    router.refresh();
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Family name</span>
        <input
          className="rounded-lg border px-3 py-2"
          placeholder="e.g. Doe Family"
          required
          value={form.familyName}
          onChange={onChange("familyName")}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Wedding anniversary</span>
        <input
          className="rounded-lg border px-3 py-2"
          type="date"
          value={form.weddingAnniversary}
          onChange={onChange("weddingAnniversary")}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Address</span>
        <input
          className="rounded-lg border px-3 py-2"
          value={form.address}
          onChange={onChange("address")}
          placeholder="Optional"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Head member</span>
        <select
          className="rounded-lg border px-3 py-2"
          value={form.headMemberId}
          onChange={onChange("headMemberId")}
        >
          <option value="">Select member</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{`${member.first_name} ${member.last_name}`}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Optional. You can link members later from their profiles.
        </p>
      </label>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
