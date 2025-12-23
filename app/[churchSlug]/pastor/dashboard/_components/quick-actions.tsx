import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  bgColor: string;
  href: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {actions.map((action) => (
            <Link key={action.id} href={action.href} className="block">
              <div className="group flex h-full flex-col rounded-lg border bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md sm:p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "rounded-lg p-2 text-white transition-transform duration-200 group-hover:scale-110 sm:p-2.5",
                      action.bgColor
                    )}
                  >
                    <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate text-sm font-semibold transition-colors duration-200 group-hover:text-primary">
                      {action.title}
                    </h4>
                    <p className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
