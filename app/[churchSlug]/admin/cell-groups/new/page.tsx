import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default async function NewCellGroupPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const { data: branches } = await supabase.from("branch").select("id, name").eq("church_id", session.churchId).order("name");

  async function createGroup(formData: FormData) {
    "use server";
    const sessionInner = await getSessionUser();
    if (!sessionInner || !sessionInner.churchId) redirect("/auth/login");
    const supa = createSupabaseAdminClient();
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const branchRaw = (formData.get("branch") as string) || "none";
    const branchId = branchRaw === "none" ? null : branchRaw;
    const weekdayRaw = (formData.get("weekday") as string) || "none";
    const weekday = weekdayRaw === "none" ? null : weekdayRaw;
    const status = (formData.get("status") as "ACTIVE" | "INACTIVE") ?? "ACTIVE";

    if (!name) {
      throw new Error("Name is required");
    }

    const { error } = await supa.from("cell_group").insert({
      name,
      description,
      branch_id: branchId,
      schedule_weekday: weekday ? Number(weekday) : null,
      status,
      church_id: sessionInner.churchId
    });

    if (error) {
      console.error("Failed to create group", error);
      throw new Error("Failed to create group");
    }
    redirect(`/${params.churchSlug}/admin/cell-groups`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Cell Group</h1>
          <p className="text-sm text-muted-foreground">Define the basics for a new cell group.</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${params.churchSlug}/admin/cell-groups`}>Back</Link>
        </Button>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Group details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGroup} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select name="branch" defaultValue="none">
                  <SelectTrigger>
                    <SelectValue placeholder="Church-wide" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Church-wide</SelectItem>
                    {(branches ?? []).map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekday">Meeting day (optional)</Label>
                <Select name="weekday" defaultValue="none">
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unspecified</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="ACTIVE">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} placeholder="Short description (optional)" />
            </div>

            <Button type="submit">Create group</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
