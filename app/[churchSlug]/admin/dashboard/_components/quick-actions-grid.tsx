import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  bgColor: string;
  href: string;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
}

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <Link key={action.id} href={action.href} className="block">
          <Card className="group quick-action h-full border bg-card/95 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "action-icon rounded-xl p-3 text-white transition-transform duration-200",
                    action.bgColor,
                    "group-hover:scale-110"
                  )}
                >
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold transition-colors duration-200 group-hover:text-primary">{action.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                </div>
                <ChevronRight className="arrow h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
