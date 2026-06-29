import { format } from "date-fns";
import type { FamilyDetail, FamilyMemberDetail } from "../page";

export function FamilyStatsCard({ family }: { family: FamilyDetail }) {
  const total    = family.members.length;
  const active   = family.members.filter((m) => m.member.status === "ACTIVE").length;
  const children = family.members.filter((m) => m.relationship === "CHILD").length;
  const baptized = family.members.filter((m) => Boolean(m.member.baptismDate)).length;
  const yearsMarried = family.weddingAnniversary ? calcYearsMarried(family.weddingAnniversary) : null;

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b">
        <h2 className="text-sm font-semibold">Family Stats</h2>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 divide-x border-b">
        <StatCell label="Members"  value={total} />
        <StatCell label="Active"   value={active}    cls="text-emerald-600" />
        <StatCell label="Children" value={children}  cls="text-blue-600" />
      </div>

      {/* Detail rows */}
      <div className="px-5 divide-y">
        <InfoRow label="Baptised"      value={`${baptized} of ${total}`} />
        {yearsMarried !== null && (
          <InfoRow label="Years married" value={`${yearsMarried} yrs`} />
        )}
        <InfoRow label="Created" value={format(new Date(family.createdAt), "d MMM yyyy")} />
      </div>
    </div>
  );
}

function StatCell({ label, value, cls }: { label: string; value: string | number; cls?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-3 gap-0.5">
      <span className={`text-2xl font-bold leading-none ${cls ?? ""}`}>{value}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function calcYearsMarried(d: string) {
  return new Date().getFullYear() - new Date(d).getFullYear();
}
