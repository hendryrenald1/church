import Link from "next/link";
import { ArrowUpRight, CalendarCheck, TrendingDown, TrendingUp, UserPlus, Users, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: string | null;
  trendUp?: boolean;
  color: string;
  bgColor: string;
  breakdown?: string | null;
  href?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  color,
  bgColor,
  breakdown,
  href
}: StatCardProps) {
  const formattedValue = typeof value === "number" ? value.toLocaleString() : String(value);

  const cardContent = (
    <Card
      className={cn(
        "group relative overflow-hidden border transition-all duration-200 ease-in-out hover:shadow-lg",
        bgColor,
        href ? "hover:-translate-y-1 cursor-pointer" : ""
      )}
    >
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-bold sm:text-3xl">{formattedValue}</p>
          </div>
          <div className={cn("rounded-xl p-2.5 text-white shadow-inner sm:p-3", color)}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        {breakdown ? (
          <p className="text-xs text-muted-foreground sm:text-sm">{breakdown}</p>
        ) : null}

        {trend ? (
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}
          >
            {trendUp ? (
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
            <span>{trend}</span>
          </div>
        ) : null}

        {href ? (
          <div className="mt-1 flex items-center justify-end text-xs text-muted-foreground">
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        ) : null}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export interface MetricsCardsProps {
  metrics: {
    members: number;
    membersTrend?: { value: string; up: boolean } | null;
    cellGroups: number;
    cellGroupsTrend?: { value: string; up: boolean } | null;
    attendancePercentage: number;
    attendanceFraction: string;
    newMembers: number;
  };
  basePath: string;
}

export function MetricsCards({ metrics, basePath }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        icon={Users}
        label="My Members"
        value={metrics.members}
        trend={metrics.membersTrend?.value}
        trendUp={metrics.membersTrend?.up}
        color="bg-blue-500"
        bgColor="bg-blue-50 border-blue-100"
        href={`${basePath}/members`}
      />
      <StatCard
        icon={Users2}
        label="Cell Groups"
        value={metrics.cellGroups}
        trend={metrics.cellGroupsTrend?.value}
        trendUp={metrics.cellGroupsTrend?.up}
        color="bg-emerald-500"
        bgColor="bg-emerald-50 border-emerald-100"
        href={`${basePath}/cell-groups`}
      />
      <StatCard
        icon={CalendarCheck}
        label="This Week's Attendance"
        value={`${metrics.attendancePercentage}%`}
        breakdown={metrics.attendanceFraction}
        color="bg-amber-500"
        bgColor="bg-amber-50 border-amber-100"
      />
      <StatCard
        icon={UserPlus}
        label="New Members"
        value={metrics.newMembers}
        trend={metrics.newMembers > 0 ? `+${metrics.newMembers} this month` : undefined}
        trendUp={metrics.newMembers > 0}
        color="bg-purple-500"
        bgColor="bg-purple-50 border-purple-100"
        href={`${basePath}/members?filter=new`}
      />
    </div>
  );
}
