type Props = { params: { branchId: string } };

export default function AdminBranchDetailPage({ params }: Props) {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Branch {params.branchId}</h1>
        <p className="text-sm text-muted-foreground">Edit campus details.</p>
      </div>
      <form className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Name</span>
          <input className="rounded-lg border px-3 py-2" defaultValue="Central" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">City</span>
          <input className="rounded-lg border px-3 py-2" defaultValue="Austin" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Address</span>
          <input className="rounded-lg border px-3 py-2" />
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked className="h-4 w-4" /> Active
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}

