import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

async function countChurches(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  status?: "PENDING" | "ACTIVE" | "SUSPENDED"
) {
  const query = supabase.from("church").select("id", { head: true, count: "exact" });
  const { count, error } = status ? await query.eq("status", status) : await query;
  if (error) {
    console.error("Failed to count churches", status, error);
    throw new Error("Failed to load dashboard data");
  }
  return count ?? 0;
}

export default async function SuperAdminDashboardPage() {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "SUPER_ADMIN") redirect("/");

  const supabase = createSupabaseAdminClient();
  const [total, pending, active, suspended] = await Promise.all([
    countChurches(supabase),
    countChurches(supabase, "PENDING"),
    countChurches(supabase, "ACTIVE"),
    countChurches(supabase, "SUSPENDED")
  ]);

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
