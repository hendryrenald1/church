import Link from "next/link";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  trend?: string | null;
  trendUp?: boolean;
  color: string;
  breakdown?: string | null;
  sparklineData?: number[];
  href?: string;
  badge?: string | null;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  color,
  breakdown,
  sparklineData,
  href,
  badge
}: StatCardProps) {
  const sparklinePath = buildSparklinePath(sparklineData);
  const cardContent = (
    <Card
      className={cn(
        "group relative overflow-hidden border bg-card/95 transition-all duration-200 ease-in-out hover:shadow-xl",
        href ? "hover:-translate-y-1 cursor-pointer" : "",
        "stat-card"
      )}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold">{value.toLocaleString()}</p>
              {badge ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{badge}</span>
              ) : null}
            </div>
          </div>
          <div className={cn("rounded-xl p-3 text-white shadow-inner", color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {breakdown ? <p className="text-sm text-muted-foreground">{breakdown}</p> : null}

        {trend ? (
          <div
            className={cn(
              "flex items-center gap-2 text-xs font-medium",
              trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}
          >
            {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>{trend}</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Updated moments ago</div>
        )}

        {sparklinePath ? (
          <div className="mt-1 h-16">
            <svg viewBox="0 0 100 40" className="h-full w-full fill-none stroke-current text-primary/50">
              <polyline points={sparklinePath} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : null}

        {href ? (
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              View details
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        ) : null}
      </div>
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}

function buildSparklinePath(data?: number[]) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const step = data.length > 1 ? 100 / (data.length - 1) : 100;
  return data
    .map((value, index) => {
      const x = index * step;
      const y = 40 - (value / max) * 40;
      return `${x},${y}`;
    })
    .join(" ");
}
