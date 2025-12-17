import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

async function countChurches(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  status?: "PENDING" | "ACTIVE" | "SUSPENDED"
): Promise<number | null> {
  try {
    const query = supabase.from("church").select("id", { head: true, count: "exact" });
    const { count, error } = status ? await query.eq("status", status) : await query;
    if (error) {
      console.error("Failed to count churches", status, error);
      return null; // Return null instead of throwing to prevent page crash
    }
    return count ?? 0;
  } catch (err) {
    console.error("Network error counting churches", status, err);
    return null;
  }
}

export default async function SuperAdminDashboardPage() {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "SUPER_ADMIN") redirect("/");

  const supabase = createSupabaseAdminClient();

  // Run queries sequentially to reduce connection pressure on serverless
  const total = await countChurches(supabase);
  const pending = await countChurches(supabase, "PENDING");
  const active = await countChurches(supabase, "ACTIVE");
  const suspended = await countChurches(supabase, "SUSPENDED");

  const hasError = total === null || pending === null || active === null || suspended === null;

  const cards = [
    { label: "Total churches", value: total },
    { label: "Pending", value: pending },
    { label: "Active", value: active },
    { label: "Suspended", value: suspended }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Platform overview</h1>
        <p className="text-sm text-muted-foreground">Monitor churches and approve new tenants.</p>
      </div>

      {hasError && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-400">
          Some statistics could not be loaded. This may be due to a temporary connection issue.
          Try refreshing the page.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold">
              {card.value !== null ? card.value.toLocaleString() : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
