"use client";

import { useEffect, useState } from "react";

type Props = { params: { churchId: string } };

type Church = {
  id: string;
  name: string;
  slug: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  plan: "FREE" | "STANDARD" | "PREMIUM";
  primary_contact_name?: string;
  primary_contact_email?: string;
};

export default function SuperAdminChurchDetailPage({ params }: Props) {
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChurch = async () => {
      setLoading(true);
      const res = await fetch(`/api/superadmin/churches/${params.churchId}`);
      if (!res.ok) {
        setError("Failed to load church");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setChurch(data);
      setLoading(false);
    };
    fetchChurch();
  }, [params.churchId]);

  const updateStatus = async (status: Church["status"]) => {
    if (!church) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/superadmin/churches/${church.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setSaving(false);
    if (!res.ok) {
      setError("Failed to update status");
      return;
    }
    setChurch({ ...church, status });
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading church...</div>;
  }

  if (!church) {
    return <div className="p-6 text-sm text-destructive">Church not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{church.name}</h1>
          <p className="text-sm text-muted-foreground">Slug: {church.slug}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-muted px-3 py-1 font-medium">{church.status}</span>
          <span className="rounded-full bg-muted px-3 py-1 font-medium">{church.plan}</span>
        </div>
      </div>

      {error && <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Contact: {church.primary_contact_name ?? "—"} · {church.primary_contact_email ?? "—"}
          </p>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-lg font-semibold">Status & Plan</h2>
          <p className="text-sm text-muted-foreground">Approve or suspend this church.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateStatus("ACTIVE")}
              disabled={saving || church.status === "ACTIVE"}
              className="rounded-lg bg-primary px-3 py-2 text-primary-foreground disabled:opacity-60"
            >
              Approve (set ACTIVE)
            </button>
            <button
              onClick={() => updateStatus("SUSPENDED")}
              disabled={saving || church.status === "SUSPENDED"}
              className="rounded-lg border border-destructive px-3 py-2 text-destructive disabled:opacity-60"
            >
              Suspend
            </button>
            <button
              onClick={() => updateStatus("PENDING")}
              disabled={saving || church.status === "PENDING"}
              className="rounded-lg border px-3 py-2 disabled:opacity-60"
            >
              Mark Pending
            </button>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Admin Users</h2>
          <p className="text-sm text-muted-foreground">View/add admins for this church.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground">Archive or delete church.</p>
        </div>
      </div>
    </div>
  );
}

