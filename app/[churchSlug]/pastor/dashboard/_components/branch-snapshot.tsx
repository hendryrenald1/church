import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BranchSnapshotData {
  id: string;
  name: string;
  location: string | null;
  memberCount: number;
  pastorCount: number;
  href: string;
}

interface BranchSnapshotProps {
  branches: BranchSnapshotData[];
}

export function BranchSnapshot({ branches }: BranchSnapshotProps) {
  if (branches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            My Branches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No branches assigned yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          My Branches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
                <p className="text-xs text-muted-foreground">
                  {branch.location ?? "Location unknown"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-right text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">{branch.memberCount}</span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
