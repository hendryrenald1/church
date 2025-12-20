import Link from "next/link";
import { Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ActionItemVariant = "default" | "success" | "warning" | "destructive";

export interface ActionItem {
  id: string;
  icon: LucideIcon;
  message: string;
  actionLabel: string;
  href: string;
  variant?: ActionItemVariant;
}

interface ActionItemsSectionProps {
  items: ActionItem[];
}

export function ActionItemsSection({ items }: ActionItemsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-5 w-5 text-primary" />
          Action Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">All caught up. No actionable insights right now.</p>
        ) : (
          items.map((item) => (
            <Alert key={item.id} variant={item.variant}>
              <div className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-4 w-4" />
                <AlertDescription className="flex flex-1 flex-col items-start gap-2 text-foreground">
                  <span>{item.message}</span>
                  <Button variant="link" size="sm" className="px-0 text-primary" asChild>
                    <Link href={item.href}>{item.actionLabel} →</Link>
                  </Button>
                </AlertDescription>
              </div>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  );
}
