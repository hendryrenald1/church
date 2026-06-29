"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronRight, FileText, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FamilyDetail } from "../page";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export function QuickActionsCard({ family, churchSlug }: { family: FamilyDetail; churchSlug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const actions = [
    {
      icon: Send, label: "Send Message", desc: "Notify all members",
      onClick: () => setShowMessageDialog(true),
    },
    {
      icon: UserPlus, label: "Add Member", desc: "Create or link member",
      onClick: () => router.push(`/${churchSlug}/admin/families/${family.id}#family-members`),
    },
    {
      icon: Calendar, label: "Schedule Event", desc: "Plan a gathering",
      onClick: () => router.push(`/${churchSlug}/admin/events/new?family=${family.id}`),
    },
    {
      icon: FileText, label: "View Reports", desc: "Attendance & engagement",
      onClick: () => router.push(`/${churchSlug}/admin/reports?family=${family.id}`),
    },
  ];

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b">
          <h2 className="text-sm font-semibold">Quick Actions</h2>
        </div>
        <div className="divide-y">
          {actions.map(({ icon: Icon, label, desc, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send message to family</DialogTitle>
            <DialogDescription>Send a note or reminder to everyone in this family.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Type your message…" rows={4} />
          <Button
            onClick={() => { toast({ title: "Message sent" }); setShowMessageDialog(false); }}
          >
            Send
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
