"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { FamilyActivity, FamilyDetail } from "../page";
import { FamilyStatsCard } from "./family-stats-card";
import { QuickActionsCard } from "./quick-actions-card";
import { FamilyTimelineCard } from "./family-timeline-card";

export function FamilySidebarSheet({ family, activities, churchSlug }: { family: FamilyDetail; activities: FamilyActivity[]; churchSlug: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            View Stats & Actions
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Family Insights</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <FamilyStatsCard family={family} />
            <QuickActionsCard family={family} churchSlug={churchSlug} />
            <FamilyTimelineCard activities={activities} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
