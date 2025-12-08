"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ChurchRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
};

export default function SuperAdminChurchesPage() {
  const [rows, setRows] = useState<ChurchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/superadmin/churches");
      if (!res.ok) {
        setError("Failed to load churches");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRows(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Churches</h1>
          <p className="text-sm text-muted-foreground">Manage all tenants</p>
        </div>
        <Link
          href="/superadmin/churches/new"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        >
          Create church
        </Link>
      </div>

      {error && <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-secondary/50">
            <tr>
              {["Name", "Slug", "Status", "Plan", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/40">
                <td className="px-4 py-2">{row.name}</td>
                <td className="px-4 py-2">{row.slug}</td>
                <td className="px-4 py-2">{row.status}</td>
                <td className="px-4 py-2">{row.plan}</td>
                <td className="px-4 py-2">
                  <Link href={`/superadmin/churches/${row.id}`} className="text-primary underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">No churches yet.</div>
        )}
        {loading && <div className="p-6 text-sm text-muted-foreground">Loading...</div>}
      </div>
    </div>
  );
}

