"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Eye, EyeOff, ArrowRight } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    setLoading(false);
    if (signInError || !data.user) {
      setError(signInError?.message ?? "A login error occurred. Please try again.");
      return;
    }
    const appMetadata = (data.user.app_metadata ?? {}) as Record<
      string,
      unknown
    >;
    const userMetadata = (data.user.user_metadata ?? {}) as Record<
      string,
      unknown
    >;
    const role =
      (userMetadata.role as string | undefined) ??
      (appMetadata.role as string | undefined);
    const churchId =
      (userMetadata.church_id as string | undefined) ??
      (appMetadata.church_id as string | undefined);

    // Check church status for ADMIN and PASTOR roles
    if ((role === "ADMIN" || role === "PASTOR") && churchId) {
      try {
        const res = await fetch("/api/auth/check-church-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ churchId }),
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
            setError(
              "Your church account has been suspended. Please contact the administrator for assistance."
            );
          } else if (churchStatus === "PENDING") {
            setError(
              "Your church account is pending approval. Please wait for activation or contact the administrator."
            );
          } else {
            setError(
              "Your church account is not active. Please contact the administrator."
            );
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
    <div className="w-full max-w-sm space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back
        </h1>
        <p className="text-muted-foreground">
          Sign in to manage your church securely.
        </p>
      </div>

      {/* Form */}
      <form className="space-y-6" onSubmit={onSubmit}>
        {error && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="pastor@yourchurch.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="h-11 w-full font-medium transition-all hover:shadow-md hover:shadow-primary/25"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="space-y-4 pt-4">
        <p className="text-center text-sm text-muted-foreground">
          Your data stays private and access is limited to authorized staff.
        </p>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              New to ChurchFlow?
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-11 w-full font-medium"
          asChild
        >
          <Link href="/auth/register-church">
            Register your church
            <span className="ml-2 text-xs text-muted-foreground">— takes under 2 minutes</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
