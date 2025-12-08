export default function AdminBrandingSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Branding</h1>
        <p className="text-sm text-muted-foreground">Logo, colors, and tagline.</p>
      </div>
      <form className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Logo URL</span>
          <input className="rounded-lg border px-3 py-2" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Primary color</span>
          <input className="rounded-lg border px-3 py-2" placeholder="#0f172a" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Accent color</span>
          <input className="rounded-lg border px-3 py-2" placeholder="#22c55e" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Tagline</span>
          <input className="rounded-lg border px-3 py-2" />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          Save branding
        </button>
      </form>
    </div>
  );
}

