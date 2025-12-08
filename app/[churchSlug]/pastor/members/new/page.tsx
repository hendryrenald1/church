export default function PastorCreateMemberPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add member</h1>
        <p className="text-sm text-muted-foreground">
          Pastors can add members only to their assigned branches.
        </p>
      </div>
      <form className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">First name</span>
          <input className="rounded-lg border px-3 py-2" required />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Last name</span>
          <input className="rounded-lg border px-3 py-2" required />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Branch (assigned only)</span>
          <select className="rounded-lg border px-3 py-2">
            <option>Central</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Joined date</span>
          <input className="rounded-lg border px-3 py-2" type="date" required />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

