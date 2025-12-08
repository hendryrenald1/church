import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16">
      <section className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-primary">Multi-tenant</p>
        <h1 className="text-4xl font-bold sm:text-5xl">
          Church management, built for multi-campus growth
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Centralize churches, branches, pastors, members, and families in one secure,
          role-aware platform powered by Next.js + Supabase.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/auth/register-church"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-sm hover:opacity-90"
          >
            Register Church
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg border border-input px-4 py-2 hover:bg-secondary"
          >
            Login
          </Link>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Tenant isolated",
            desc: "Every row tagged with churchId and enforced by Supabase RLS."
          },
          {
            title: "Role-based",
            desc: "Super Admin, Admin, Pastor routes and API guards out of the box."
          },
          {
            title: "Member-first families",
            desc: "Create families from member profile with clean household visibility."
          }
        ].map((item) => (
          <div key={item.title} className="rounded-xl border bg-card p-5">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

