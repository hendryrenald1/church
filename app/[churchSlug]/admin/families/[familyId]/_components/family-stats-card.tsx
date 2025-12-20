import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { FamilyDetail, FamilyMemberDetail } from "../page";

export function FamilyStatsCard({ family }: { family: FamilyDetail }) {
  const total = family.members.length;
  const active = family.members.filter((member) => member.member.status === "ACTIVE").length;
  const children = family.members.filter((member) => member.relationship === "CHILD").length;
  const baptized = family.members.filter((member) => Boolean(member.member.baptismDate)).length;
  const avgAge = calculateAverageAge(family.members);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Family Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatPill label="Total Members" value={total} color="text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950" />
          <StatPill label="Active" value={active} color="text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-950" />
          <StatPill label="Children" value={children} color="text-purple-600 bg-purple-50 dark:text-purple-300 dark:bg-purple-950" />
          <StatPill label="Avg Age" value={avgAge ? `${avgAge}` : "N/A"} color="text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950" />
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Baptized</span>
            <Badge variant="outline">
              {baptized}/{total}
            </Badge>
          </div>
          {family.weddingAnniversary ? (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Years married</span>
              <Badge variant="outline">{calculateYearsMarried(family.weddingAnniversary)}</Badge>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{format(new Date(family.createdAt), "MMM dd, yyyy")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-lg p-3 text-center ${color}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function calculateAverageAge(members: FamilyMemberDetail[]) {
  const ages = members
    .map((member) => member.member.dateOfBirth)
    .filter(Boolean)
    .map((date) => calculateAge(date!));
  if (!ages.length) return null;
  return Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
}

function calculateYearsMarried(dateString: string) {
  const start = new Date(dateString);
  const now = new Date();
  return now.getFullYear() - start.getFullYear();
}

function calculateAge(dateString: string) {
  const birth = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
