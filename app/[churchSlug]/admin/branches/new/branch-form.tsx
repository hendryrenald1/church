"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  churchSlug: string;
};

export default function BranchForm({ churchSlug }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (field: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = field === "isActive" ? event.target.checked : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/admin/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim() || null,
        isActive: form.isActive
      })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to save branch");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.push(`/${churchSlug}/admin/branches`);
    router.refresh();
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Name</span>
        <input
          className="rounded-lg border px-3 py-2"
          required
          value={form.name}
          onChange={onChange("name")}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">City</span>
        <input
          className="rounded-lg border px-3 py-2"
          required
          value={form.city}
          onChange={onChange("city")}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Address</span>
        <input
          className="rounded-lg border px-3 py-2"
          value={form.address}
          onChange={onChange("address")}
        />
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={form.isActive}
          onChange={onChange("isActive")}
        />
        Active
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
