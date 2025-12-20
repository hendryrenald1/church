import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Cake, Droplet, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface QuickStats {
  birthdaysThisMonth: number;
  anniversariesThisMonth: number;
  baptismsYTD: number;
  incompleteProfiles: number;
}

interface QuickStatsWidgetProps {
  stats: QuickStats;
}

const quickStatConfig: {
  id: string;
  label: string;
  valueKey: keyof QuickStats;
  icon: LucideIcon;
  iconColor: string;
}[] = [
  { id: "birthdays", label: "Birthdays this month", valueKey: "birthdaysThisMonth", icon: Cake, iconColor: "text-pink-500" },
  { id: "anniversaries", label: "Anniversaries this month", valueKey: "anniversariesThisMonth", icon: Heart, iconColor: "text-red-500" },
  { id: "baptisms", label: "Baptisms YTD", valueKey: "baptismsYTD", icon: Droplet, iconColor: "text-blue-500" },
  { id: "incomplete", label: "Incomplete profiles", valueKey: "incompleteProfiles", icon: AlertTriangle, iconColor: "text-amber-500" }
];

export function QuickStatsWidget({ stats }: QuickStatsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickStatConfig.map((stat) => (
          <StatRow
            key={stat.id}
            icon={stat.icon}
            iconColor={stat.iconColor}
            label={stat.label}
            value={stats[stat.valueKey]}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function StatRow({ icon: Icon, iconColor, label, value }: { icon: LucideIcon; iconColor: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-2">
        <Icon className={`${iconColor} h-4 w-4`} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
