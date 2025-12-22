"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export function LoginForm() {
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription>
          Sign in to manage your church securely.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          {error && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="pastor@yourchurch.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <div className="text-sm text-muted-foreground">
          Your data stays private and access is limited to authorized staff.
        </div>
        <div className="text-sm text-muted-foreground">
          New here?{" "}
          <Link
            href="/auth/register-church"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Register your church
          </Link>{" "}
          — takes under 2 minutes.
        </div>
      </CardFooter>
    </Card>
  );
}
