export default function AdminChurchSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Church profile</h1>
        <p className="text-sm text-muted-foreground">Update contact info and address.</p>
      </div>
      <form className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Church name</span>
          <input className="rounded-lg border px-3 py-2" defaultValue="Example Church" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Primary contact name</span>
          <input className="rounded-lg border px-3 py-2" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Primary contact email</span>
          <input className="rounded-lg border px-3 py-2" type="email" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">City</span>
          <input className="rounded-lg border px-3 py-2" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Timezone</span>
          <input className="rounded-lg border px-3 py-2" />
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

