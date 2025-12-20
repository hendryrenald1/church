import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BranchSnapshot {
  id: string;
  name: string;
  city: string | null;
  memberCount: number;
  pastorCount: number;
  href: string;
}

interface BranchOverviewWidgetProps {
  branches: BranchSnapshot[];
}

export function BranchOverviewWidget({ branches }: BranchOverviewWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          Branch Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent>
        {branches.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No branches yet</p>
        ) : (
          <div className="space-y-3">
            {branches.map((branch) => (
              <Link
                key={branch.id}
                href={branch.href}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{branch.name}</p>
                    <p className="text-xs text-muted-foreground">{branch.city ?? "City unknown"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{branch.memberCount} members</p>
                  <p className="text-xs text-muted-foreground">
                    {branch.pastorCount} pastor{branch.pastorCount === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
