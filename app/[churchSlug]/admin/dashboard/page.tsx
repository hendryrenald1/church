import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type CountResult = { count: number; label: string };

export default async function AdminDashboardPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [churchRes, branches, members, families, pastors] = await Promise.all([
    supabase.from("church").select("name").eq("id", session.churchId).single(),
    supabase
      .from("branch")
      .select("id", { count: "exact", head: true })
      .eq("church_id", session.churchId),
    supabase
      .from("member")
      .select("id", { count: "exact", head: true })
      .eq("church_id", session.churchId),
    supabase
      .from("family")
      .select("id", { count: "exact", head: true })
      .eq("church_id", session.churchId),
    supabase
      .from("pastor_profile")
      .select("id", { count: "exact", head: true })
      .eq("church_id", session.churchId)
  ]);

  const errors = [churchRes.error, branches.error, members.error, families.error, pastors.error].filter(Boolean);
  if (errors.length) {
    console.error("Dashboard counts failed", errors[0]);
    throw new Error("Failed to load dashboard data");
  }
  const churchName = churchRes.data?.name ?? params.churchSlug;

  const cards: CountResult[] = [
    { label: "Branches", count: branches.count ?? 0 },
    { label: "Pastors", count: pastors.count ?? 0 },
    { label: "Members", count: members.count ?? 0 },
    { label: "Families", count: families.count ?? 0 }
  ];

  const base = `/${params.churchSlug}/admin`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin dashboard</p>
        <h1 className="text-3xl font-bold text-primary">{churchName}</h1>
        <p className="text-sm text-muted-foreground">Church KPIs and quick links.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-semibold">{card.count.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Quick links</h2>
          <ul className="mt-3 space-y-2 text-sm text-primary">
            <li>
              <Link href={`${base}/members/new`} className="underline">
                Add Member
              </Link>
            </li>
            <li>
              <Link href={`${base}/branches/new`} className="underline">
                Add Branch
              </Link>
            </li>
            <li>
              <Link href={`${base}/pastors/new`} className="underline">
                Add Pastor
              </Link>
            </li>
            <li>
              <Link href={`${base}/families`} className="underline">
                View Families
              </Link>
            </li>
          </ul>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Status</h2>
          <p className="text-sm text-muted-foreground">
            Surface pending approvals or tasks here.
          </p>
        </div>
      </div>
    </div>
  );
}
