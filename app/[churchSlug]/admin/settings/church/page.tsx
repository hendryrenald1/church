"use client";

import { useEffect, useState } from "react";

interface ChurchData {
  id: string;
  name: string;
  slug: string;
  primary_contact_name: string;
  primary_contact_email: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  plan: "FREE" | "STANDARD" | "PREMIUM";
  created_at: string;
  updated_at: string;
}

export default function AdminChurchSettingsPage() {
  const [church, setChurch] = useState<ChurchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [primaryContactName, setPrimaryContactName] = useState("");
  const [primaryContactEmail, setPrimaryContactEmail] = useState("");

  useEffect(() => {
    async function fetchChurch() {
      try {
        const res = await fetch("/api/admin/church");
        if (!res.ok) {
          setError("Failed to load church details");
          return;
        }
        const data = await res.json();
        setChurch(data);
        setName(data.name || "");
        setPrimaryContactName(data.primary_contact_name || "");
        setPrimaryContactEmail(data.primary_contact_email || "");
      } catch {
        setError("Failed to load church details");
      } finally {
        setLoading(false);
      }
    }
    fetchChurch();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/church", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          primaryContactName,
          primaryContactEmail
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save changes");
        return;
      }

      setSuccess("Church details updated successfully");
      // Refresh church data
      const refreshRes = await fetch("/api/admin/church");
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setChurch(data);
      }
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Church profile</h1>
          <p className="text-sm text-muted-foreground">Update contact info and address.</p>
        </div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error && !church) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Church profile</h1>
          <p className="text-sm text-muted-foreground">Update contact info and address.</p>
        </div>
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Church profile</h1>
        <p className="text-sm text-muted-foreground">Update contact info and address.</p>
      </div>

      {/* Church Info Display */}
      {church && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                church.status === "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : church.status === "SUSPENDED"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {church.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Plan:</span>
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-1 text-xs font-medium">
              {church.plan}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Slug:</span>
            <span className="text-sm text-muted-foreground">{church.slug}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Created:</span>
            <span className="text-sm text-muted-foreground">
              {new Date(church.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {error && <div className="text-sm text-destructive">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Church name</span>
          <input
            className="rounded-lg border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Primary contact name</span>
          <input
            className="rounded-lg border px-3 py-2"
            value={primaryContactName}
            onChange={(e) => setPrimaryContactName(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Primary contact email</span>
          <input
            className="rounded-lg border px-3 py-2"
            type="email"
            value={primaryContactEmail}
            onChange={(e) => setPrimaryContactEmail(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
