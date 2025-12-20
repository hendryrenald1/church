"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, FileText, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FamilyDetail } from "../page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export function QuickActionsCard({ family, churchSlug }: { family: FamilyDetail; churchSlug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const actions = [
    {
      icon: Send,
      label: "Send Message",
      description: "Notify all family members",
      onClick: () => setShowMessageDialog(true)
    },
    {
      icon: UserPlus,
      label: "Add Member",
      description: "Create or link member",
      onClick: () => router.push(`/${churchSlug}/admin/families/${family.id}#family-members`)
    },
    {
      icon: Calendar,
      label: "Schedule Event",
      description: "Plan a family gathering",
      onClick: () => router.push(`/${churchSlug}/admin/events/new?family=${family.id}`)
    },
    {
      icon: FileText,
      label: "View Reports",
      description: "Attendance and engagement",
      onClick: () => router.push(`/${churchSlug}/admin/reports?family=${family.id}`)
    }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.map((action) => (
            <Button key={action.label} variant="outline" className="w-full justify-start text-left" onClick={action.onClick}>
              <action.icon className="mr-3 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send message to family</DialogTitle>
            <DialogDescription>Send a quick note or reminder to everyone in this family.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Type your message..." rows={4} />
          <Button
            onClick={() => {
              toast({ title: "Message sent" });
              setShowMessageDialog(false);
            }}
          >
            Send
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
