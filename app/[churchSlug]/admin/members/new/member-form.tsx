"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Branch = { id: string; name: string };
type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  branch_id: string | null;
  status: "ACTIVE" | "INACTIVE";
  joined_date: string;
  date_of_birth: string | null;
  baptism_date: string | null;
};

type Props = {
  churchSlug: string;
  branches: Branch[];
  member?: Member;
};

const initialDate = new Date().toISOString().split("T")[0];

const normalizeDateInput = (value: string | null | undefined) => {
  if (!value) return "";
  return value.split("T")[0];
};

export default function MemberForm({ churchSlug, branches, member }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: member?.first_name ?? "",
    lastName: member?.last_name ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    branchId: member?.branch_id ?? "",
    status: member?.status ?? "ACTIVE",
    joinedDate: member ? normalizeDateInput(member.joined_date) : initialDate,
    dateOfBirth: normalizeDateInput(member?.date_of_birth),
    baptismDate: normalizeDateInput(member?.baptism_date)
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
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      branchId: form.branchId || null,
      status: form.status as "ACTIVE" | "INACTIVE",
      joinedDate: form.joinedDate,
      dateOfBirth: form.dateOfBirth || null,
      baptismDate: form.baptismDate || null
    };

    const endpoint = member ? `/api/admin/members/${member.id}` : "/api/admin/members";
    const method = member ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to save member");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.push(`/${churchSlug}/admin/members`);
    router.refresh();
  };

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium">First name</span>
        <input
          className="rounded-lg border px-3 py-2"
          required
          value={form.firstName}
          onChange={onChange("firstName")}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Last name</span>
        <input
          className="rounded-lg border px-3 py-2"
          required
          value={form.lastName}
          onChange={onChange("lastName")}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Email</span>
        <input
          className="rounded-lg border px-3 py-2"
          type="email"
          value={form.email}
          onChange={onChange("email")}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Phone</span>
        <input
          className="rounded-lg border px-3 py-2"
          value={form.phone}
          onChange={onChange("phone")}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Branch</span>
        <select
          className="rounded-lg border px-3 py-2"
          value={form.branchId}
          onChange={onChange("branchId")}
        >
          <option value="">Unassigned</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Status</span>
        <select
          className="rounded-lg border px-3 py-2"
          value={form.status}
          onChange={onChange("status")}
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Joined date</span>
        <input
          className="rounded-lg border px-3 py-2"
          type="date"
          required
          value={form.joinedDate}
          onChange={onChange("joinedDate")}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Birth date</span>
        <input
          className="rounded-lg border px-3 py-2"
          type="date"
          value={form.dateOfBirth}
          onChange={onChange("dateOfBirth")}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Baptism date</span>
        <input
          className="rounded-lg border px-3 py-2"
          type="date"
          value={form.baptismDate}
          onChange={onChange("baptismDate")}
        />
      </label>
      {error && <div className="md:col-span-2 text-sm text-destructive">{error}</div>}
      <div className="md:col-span-2">
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Saving..." : member ? "Save changes" : "Save"}
        </button>
      </div>
    </form>
  );
}
