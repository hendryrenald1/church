"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminCreateChurchPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    primaryContactName: "",
    primaryContactEmail: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Normalize slug: lowercase, replace spaces with hyphens
    if (key === "slug") {
      value = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/churches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        let errorMsg = body.error ?? "Failed to create church";
        if (body.details && Array.isArray(body.details)) {
          const details = body.details.map((d: any) => `${d.path.join(".")}: ${d.message}`).join(", ");
          errorMsg = `${errorMsg} - ${details}`;
        }
        setError(errorMsg);
        console.error("API error:", body);
        return;
      }
      // Refresh list and go back
      router.push("/superadmin/churches");
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Request error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create church</h1>
        <p className="text-sm text-muted-foreground">
          Provision a church and first Admin user.
        </p>
      </div>
      {error && (
        <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form className="grid gap-4 max-w-xl" onSubmit={onSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Name</span>
          <input className="rounded-lg border px-3 py-2" required value={form.name} onChange={onChange("name")} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Slug</span>
          <input
            className="rounded-lg border px-3 py-2"
            required
            value={form.slug}
            onChange={onChange("slug")}
            placeholder="example-church"
            pattern="[a-z0-9-]+"
          />
          <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Primary contact name</span>
          <input
            className="rounded-lg border px-3 py-2"
            required
            value={form.primaryContactName}
            onChange={onChange("primaryContactName")}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Primary contact email</span>
          <input
            className="rounded-lg border px-3 py-2"
            type="email"
            required
            value={form.primaryContactEmail}
            onChange={onChange("primaryContactEmail")}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Admin password</span>
          <input
            className="rounded-lg border px-3 py-2"
            type="password"
            required
            value={form.password}
            onChange={onChange("password")}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}

