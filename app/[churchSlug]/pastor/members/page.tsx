import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { MembersList } from "@/components/members/members-list";

export default async function PastorMembersPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "PASTOR" || !session.churchId || !session.memberId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const basePath = `/${params.churchSlug}/pastor/members`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Members</h1>
          <p className="text-sm text-muted-foreground">
            Find, connect with, and support members of your assigned branches.
          </p>
        </div>
        <Link
          href={`${basePath}/new`}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Add member
        </Link>
      </div>

      <MembersList churchSlug={params.churchSlug} basePath={basePath} role="pastor" />
    </div>
  );
}
