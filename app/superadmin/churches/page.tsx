"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type ChurchRow = {
  id: string;
  name: string;
  slug: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  plan: "FREE" | "STANDARD" | "PREMIUM";
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
};

type EditFormState = {
  name: string;
  slug: string;
  status: ChurchRow["status"];
  plan: ChurchRow["plan"];
  primaryContactName: string;
  primaryContactEmail: string;
  adminUsers: AdminUserForm[];
};

type AdminUserForm = {
  id?: string;
  email: string;
  password: string;
  isNew?: boolean;
};

const createDefaultEditForm = (): EditFormState => ({
  name: "",
  slug: "",
  status: "PENDING",
  plan: "FREE",
  primaryContactName: "",
  primaryContactEmail: "",
  adminUsers: [{ email: "", password: "", isNew: true }]
});

const findDuplicateEmail = (emails: string[]) => {
  const seen = new Set<string>();
  for (const email of emails) {
    const normalized = email.toLowerCase();
    if (seen.has(normalized)) {
      return email;
    }
    seen.add(normalized);
  }
  return null;
};

const toChurchRow = (row: any): ChurchRow => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  status: (row.status ?? "PENDING") as ChurchRow["status"],
  plan: (row.plan ?? "FREE") as ChurchRow["plan"],
  primary_contact_name: row.primary_contact_name,
  primary_contact_email: row.primary_contact_email
});

export default function SuperAdminChurchesPage() {
  const [rows, setRows] = useState<ChurchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(() => createDefaultEditForm());
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminLoaded, setAdminLoaded] = useState(false);
  const editingChurch = useMemo(() => rows.find((row) => row.id === editingId), [rows, editingId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/superadmin/churches");
      if (!res.ok) {
        setError("Failed to load churches");
        setLoading(false);
        return;
      }
      const data = await res.json();
      const normalized: ChurchRow[] = Array.isArray(data) ? data.map(toChurchRow) : [];
      setRows(normalized);
      setLoading(false);
    };
    load();
  }, []);

  const startEdit = async (row: ChurchRow) => {
    setEditingId(row.id);
    setEditError(null);
    setEditSuccess(null);
    setAdminLoaded(false);
    setAdminLoading(true);
    setEditForm({
      name: row.name ?? "",
      slug: row.slug ?? "",
      status: row.status,
      plan: row.plan,
      primaryContactName: row.primary_contact_name ?? "",
      primaryContactEmail: row.primary_contact_email ?? "",
      adminUsers: [{ email: "", password: "", isNew: true }]
    });
    try {
      const res = await fetch(`/api/superadmin/churches/${row.id}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(body.error ?? "Failed to load church details.");
        return;
      }
      const admins = Array.isArray(body.admins)
        ? body.admins.map((admin: any) => ({
            id: admin.id,
            email: admin.email,
            password: "",
            isNew: false
          }))
        : [];
      setEditForm({
        name: body.name ?? row.name ?? "",
        slug: body.slug ?? row.slug ?? "",
        status: body.status ?? row.status,
        plan: body.plan ?? row.plan,
        primaryContactName: body.primary_contact_name ?? row.primary_contact_name ?? "",
        primaryContactEmail: body.primary_contact_email ?? row.primary_contact_email ?? "",
        adminUsers: admins.length > 0 ? admins : [{ email: "", password: "", isNew: true }]
      });
    } catch (err) {
      console.error("Failed to load church details:", err);
      setEditError("Failed to load church details. Please try again.");
    } finally {
      setAdminLoading(false);
      setAdminLoaded(true);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
    setAdminLoaded(false);
    setAdminLoading(false);
    setEditForm(createDefaultEditForm());
  };

  const onEditChange =
    (key: keyof EditFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = e.target.value;
      if (key === "slug") {
        value = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      }
      setEditForm((prev) => ({ ...prev, [key]: value }));
    };

  const updateAdminUserField =
    (index: number, field: keyof AdminUserForm) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEditForm((prev) => {
        const adminUsers = prev.adminUsers.map((admin, i) =>
          i === index ? { ...admin, [field]: value } : admin
        );
        return { ...prev, adminUsers };
      });
    };

  const addAdminUser = () => {
    setEditForm((prev) => ({
      ...prev,
      adminUsers: [...prev.adminUsers, { email: "", password: "", isNew: true }]
    }));
  };

  const removeAdminUser = (index: number) => {
    setEditForm((prev) => {
      if (prev.adminUsers.length <= 1) {
        return prev;
      }
      const target = prev.adminUsers[index];
      if (target?.id) {
        return prev;
      }
      const nextAdmins = prev.adminUsers.filter((_, i) => i !== index);
      return { ...prev, adminUsers: nextAdmins.length ? nextAdmins : prev.adminUsers };
    });
  };

  const submitEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    setSavingEdit(true);
    setEditError(null);
    setEditSuccess(null);
    if (!adminLoaded) {
      setSavingEdit(false);
      setEditError("Please wait for admin users to finish loading.");
      return;
    }
    if (editForm.adminUsers.length === 0) {
      setSavingEdit(false);
      setEditError("At least one admin user is required.");
      return;
    }
    const normalizedAdmins = editForm.adminUsers.map((admin) => ({
      id: admin.id,
      email: admin.email.trim(),
      password: admin.password.trim()
    }));
    for (const admin of normalizedAdmins) {
      if (!admin.email) {
        setSavingEdit(false);
        setEditError("Admin email cannot be empty.");
        return;
      }
      if (!admin.id && (!admin.password || admin.password.length < 8)) {
        setSavingEdit(false);
        setEditError("Passwords for new admins must be at least 8 characters long.");
        return;
      }
      if (admin.id && admin.password && admin.password.length < 8) {
        setSavingEdit(false);
        setEditError("Passwords must be at least 8 characters long.");
        return;
      }
    }
    const duplicateEmail = findDuplicateEmail(normalizedAdmins.map((admin) => admin.email));
    if (duplicateEmail) {
      setSavingEdit(false);
      setEditError(`Duplicate admin email detected: ${duplicateEmail}`);
      return;
    }
    const adminPayload = normalizedAdmins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      password: admin.password && admin.password.length > 0 ? admin.password : undefined
    }));
    const payload = {
      name: editForm.name,
      slug: editForm.slug,
      status: editForm.status,
      plan: editForm.plan,
      primaryContactName: editForm.primaryContactName,
      primaryContactEmail: editForm.primaryContactEmail,
      adminUsers: adminPayload
    };
    const res = await fetch(`/api/superadmin/churches/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEditError(body.error ?? "Failed to update church");
      setSavingEdit(false);
      return;
    }
    const updatedRow = body?.church;
    setRows((prev) =>
      prev.map((row) =>
        row.id === editingId
          ? updatedRow
            ? toChurchRow(updatedRow)
            : {
                ...row,
                name: editForm.name,
                slug: editForm.slug,
                status: editForm.status,
                plan: editForm.plan,
                primary_contact_name: editForm.primaryContactName,
                primary_contact_email: editForm.primaryContactEmail
              }
          : row
      )
    );
    setEditingId(null);
    setSavingEdit(false);
    setAdminLoaded(false);
    setEditForm(createDefaultEditForm());
    setEditSuccess("Church updated successfully.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Churches</h1>
          <p className="text-sm text-muted-foreground">Manage all tenants</p>
        </div>
        <Link
          href="/superadmin/churches/new"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        >
          Create church
        </Link>
      </div>

      {error && <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {editSuccess && !editingId && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{editSuccess}</div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-secondary/50">
            <tr>
              {["Name", "Slug", "Status", "Plan", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/40">
                <td className="px-4 py-2">{row.name}</td>
                <td className="px-4 py-2">{row.slug}</td>
                <td className="px-4 py-2">{row.status}</td>
                <td className="px-4 py-2">{row.plan}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-3 text-primary underline">
                    <button type="button" onClick={() => startEdit(row)}>
                      Edit
                    </button>
                    <Link href={`/superadmin/churches/${row.id}`}>View</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">No churches yet.</div>
        )}
        {loading && <div className="p-6 text-sm text-muted-foreground">Loading...</div>}
      </div>

      {editingId && (
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Edit church</h2>
              <p className="text-sm text-muted-foreground">
                Updating {editingChurch?.name ?? "selected church"} ({editingChurch?.slug ?? "—"})
              </p>
            </div>
            <button type="button" className="text-sm text-muted-foreground underline" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
          {editError && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {editError}
            </div>
          )}
          <form className="grid gap-4 md:grid-cols-2" onSubmit={submitEdit}>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Name</span>
              <input className="rounded-lg border px-3 py-2" required value={editForm.name} onChange={onEditChange("name")} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Slug</span>
              <input
                className="rounded-lg border px-3 py-2"
                required
                value={editForm.slug}
                onChange={onEditChange("slug")}
                pattern="[a-z0-9-]+"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Primary contact name</span>
              <input
                className="rounded-lg border px-3 py-2"
                required
                value={editForm.primaryContactName}
                onChange={onEditChange("primaryContactName")}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Primary contact email</span>
              <input
                className="rounded-lg border px-3 py-2"
                type="email"
                required
                value={editForm.primaryContactEmail}
                onChange={onEditChange("primaryContactEmail")}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Status</span>
              <select className="rounded-lg border px-3 py-2" value={editForm.status} onChange={onEditChange("status")}>
                {(["PENDING", "ACTIVE", "SUSPENDED"] as ChurchRow["status"][]).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Plan</span>
              <select className="rounded-lg border px-3 py-2" value={editForm.plan} onChange={onEditChange("plan")}>
                {(["FREE", "STANDARD", "PREMIUM"] as ChurchRow["plan"][]).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:col-span-2 space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">Admin users</h3>
                  <p className="text-xs text-muted-foreground">
                    Update existing admin emails or add new admins. Leave password blank to keep current passwords.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
                  onClick={addAdminUser}
                  disabled={adminLoading}
                >
                  Add admin
                </button>
              </div>
              {adminLoading ? (
                <p className="text-sm text-muted-foreground">Loading admin users...</p>
              ) : (
                <div className="space-y-4">
                  {editForm.adminUsers.map((admin, index) => (
                    <div key={admin.id ?? `new-${index}`} className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium">
                          Admin email {editForm.adminUsers.length > 1 ? `#${index + 1}` : ""}
                        </span>
                        <input
                          className="rounded-lg border px-3 py-2"
                          type="email"
                          required
                          disabled={adminLoading}
                          value={admin.email}
                          onChange={updateAdminUserField(index, "email")}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium">
                          {admin.id ? "New password (optional)" : "Temporary password"}
                        </span>
                        <input
                          className="rounded-lg border px-3 py-2"
                          type="password"
                          required={!admin.id}
                          disabled={adminLoading}
                          value={admin.password}
                          onChange={updateAdminUserField(index, "password")}
                          placeholder={admin.id ? "Leave blank to keep current password" : ""}
                        />
                        {admin.id && (
                          <p className="text-xs text-muted-foreground">Leave blank to keep the existing password.</p>
                        )}
                      </label>
                      {!admin.id && editForm.adminUsers.length > 1 && (
                        <div className="md:col-span-2">
                          <button
                            type="button"
                            className="text-sm text-destructive underline"
                            onClick={() => removeAdminUser(index)}
                            disabled={adminLoading}
                          >
                            Remove admin
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
                disabled={savingEdit || adminLoading}
              >
                {savingEdit ? "Saving..." : "Save changes"}
              </button>
              <button type="button" className="rounded-lg border px-4 py-2" onClick={cancelEdit} disabled={savingEdit}>
                Discard
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
