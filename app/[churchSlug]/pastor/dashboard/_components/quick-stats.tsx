import { AlertTriangle, Cake, Droplet, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface QuickStatsData {
  birthdaysThisMonth: number;
  anniversariesThisMonth: number;
  baptismsYTD: number;
  incompleteProfiles: number;
}

interface QuickStatsProps {
  stats: QuickStatsData;
}

const statConfig: {
  id: string;
  label: string;
  valueKey: keyof QuickStatsData;
  icon: LucideIcon;
  iconColor: string;
}[] = [
  {
    id: "birthdays",
    label: "Birthdays this month",
    valueKey: "birthdaysThisMonth",
    icon: Cake,
    iconColor: "text-pink-500"
  },
  {
    id: "anniversaries",
    label: "Anniversaries this month",
    valueKey: "anniversariesThisMonth",
    icon: Heart,
    iconColor: "text-red-500"
  },
  {
    id: "baptisms",
    label: "Baptisms YTD",
    valueKey: "baptismsYTD",
    icon: Droplet,
    iconColor: "text-blue-500"
  },
  {
    id: "incomplete",
    label: "Incomplete profiles",
    valueKey: "incompleteProfiles",
    icon: AlertTriangle,
    iconColor: "text-amber-500"
  }
];

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                <span className="text-sm">{stat.label}</span>
              </div>
              <span className="font-semibold">{stats[stat.valueKey]}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
