import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import BranchForm from "./branch-form";

export default async function AdminCreateBranchPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add branch</h1>
        <p className="text-sm text-muted-foreground">Create a campus for this church.</p>
      </div>
      <BranchForm churchSlug={params.churchSlug} />
    </div>
  );
}
