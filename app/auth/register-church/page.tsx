"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterChurchPage() {
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
  const [success, setSuccess] = useState(false);

  const onChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/register-church", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to register church");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/auth/login"), 3000);
  };

  if (success) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
        <div className="rounded-lg border bg-green-50 p-6 text-center">
          <h2 className="text-xl font-semibold text-green-900">Registration Successful!</h2>
          <p className="mt-2 text-sm text-green-700">
            Your church has been registered with <span className="font-semibold">PENDING</span> status.
            A Super Admin must approve before you can access the admin dashboard.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-primary">Start free</p>
        <h1 className="text-3xl font-semibold">Register a church</h1>
        <p className="text-sm text-muted-foreground">
          Creates a pending church and first Admin user. Super Admin approval required to access dashboards.
        </p>
      </div>
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Church name</label>
          <input
            className="rounded-lg border px-3 py-2"
            required
            value={form.name}
            onChange={onChange("name")}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Desired slug</label>
          <input
            className="rounded-lg border px-3 py-2"
            required
            value={form.slug}
            onChange={onChange("slug")}
          />
          <p className="text-xs text-muted-foreground">Used in URLs: /&lt;slug&gt;/admin</p>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Primary contact name</label>
          <input
            className="rounded-lg border px-3 py-2"
            required
            value={form.primaryContactName}
            onChange={onChange("primaryContactName")}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Primary contact email</label>
          <input
            className="rounded-lg border px-3 py-2"
            type="email"
            required
            value={form.primaryContactEmail}
            onChange={onChange("primaryContactEmail")}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Admin password</label>
          <input
            className="rounded-lg border px-3 py-2"
            type="password"
            required
            value={form.password}
            onChange={onChange("password")}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register church"}
        </button>
      </form>
      <div className="rounded-lg border bg-secondary/30 p-4 text-sm text-muted-foreground">
        After submission, the church is set to <span className="font-semibold">PENDING</span>.
        A Super Admin must approve before the Admin can sign in.
      </div>
    </main>
  );
}

