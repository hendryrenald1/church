type Props = { params: { familyId: string } };

export default function AdminFamilyDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Family {params.familyId}</h1>
        <p className="text-sm text-muted-foreground">
          Family info, anniversary, members list, and add/remove links.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Family info</h2>
          <p className="text-sm text-muted-foreground">Name, address, wedding anniversary.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">
            Add spouse/child, remove links without deleting members.
          </p>
        </div>
      </div>
    </div>
  );
}

