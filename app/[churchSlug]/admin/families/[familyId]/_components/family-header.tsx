"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, MoreVertical, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import type { FamilyDetail } from "../page";

interface FamilyHeaderProps {
  family: FamilyDetail;
  churchSlug: string;
}

export function FamilyHeader({ family, churchSlug }: FamilyHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/families/${family.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Request failed");
        toast({ title: "Family deleted" });
        router.push(`/${churchSlug}/admin/families`);
      } catch (error) {
        console.error(error);
        toast({ title: "Failed to delete family", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/${churchSlug}/admin/families`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Families
        </Button>
        <span className="hidden text-muted-foreground/70 sm:inline">/</span>
        <span className="text-xs uppercase tracking-wide text-primary">Family Detail</span>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{family.familyName}</h1>
          <p className="text-muted-foreground">
            {family.members.length} member{family.members.length === 1 ? "" : "s"}
            {family.weddingAnniversary ? (
              <span className="ml-2 text-sm text-muted-foreground">
                • Anniversary {format(new Date(family.weddingAnniversary), "MMMM dd, yyyy")}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/${churchSlug}/admin/families/${family.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Family
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast({ title: "Message workflow coming soon." })}>
                <Send className="mr-2 h-4 w-4" />
                Message Family
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Family
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete family?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the family grouping but keeps each member record intact. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete Family
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
