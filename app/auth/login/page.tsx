"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);
    if (signInError || !data.user) {
      setError(signInError?.message ?? "Login failed");
      return;
    }
    const appMetadata = (data.user.app_metadata ?? {}) as Record<string, unknown>;
    const userMetadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const role = (userMetadata.role as string | undefined) ?? (appMetadata.role as string | undefined);
    const churchId =
      (userMetadata.church_id as string | undefined) ?? (appMetadata.church_id as string | undefined);

    // Check church status for ADMIN and PASTOR roles
    if ((role === "ADMIN" || role === "PASTOR") && churchId) {
      try {
        const res = await fetch("/api/auth/check-church-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ churchId })
        });

        if (!res.ok) {
          await supabase.auth.signOut();
          setError("Unable to verify church status. Please contact support.");
          return;
        }

        const { status: churchStatus, slug: churchSlug } = await res.json();

        if (churchStatus !== "ACTIVE") {
          await supabase.auth.signOut();
          if (churchStatus === "SUSPENDED") {
            setError("Your church account has been suspended. Please contact the administrator for assistance.");
          } else if (churchStatus === "PENDING") {
            setError("Your church account is pending approval. Please wait for activation or contact the administrator.");
          } else {
            setError("Your church account is not active. Please contact the administrator.");
          }
          return;
        }

        // Use the correct slug from the database for redirection
        if (role === "ADMIN") {
          router.push(`/${churchSlug}/admin/dashboard`);
        } else if (role === "PASTOR") {
          router.push(`/${churchSlug}/pastor/dashboard`);
        }
        return;
      } catch {
        await supabase.auth.signOut();
        setError("Unable to verify church status. Please contact support.");
        return;
      }
    }

    if (role === "SUPER_ADMIN") {
      router.push("/superadmin/dashboard");
    } else {
      // fallback if churchId is missing
      router.push("/");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold">Login</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your Supabase credentials. Redirects by role after login.
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Email</span>
          <input
            className="rounded-lg border px-3 py-2"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Password</span>
          <input
            className="rounded-lg border px-3 py-2"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
      <p className="text-sm text-muted-foreground">
        New church?{" "}
        <Link href="/auth/register-church" className="text-primary underline">
          Register your church
        </Link>
      </p>
    </main>
  );
}
