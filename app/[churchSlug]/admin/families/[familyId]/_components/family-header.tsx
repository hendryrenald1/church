"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Building2, Heart, MoreHorizontal, Send, Trash2, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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

  const head = family.members.find((m) => m.relationship === "HEAD");
  const branchName = head?.member.branchName ?? null;

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
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <button
          onClick={() => router.push(`/${churchSlug}/admin/families`)}
          className="hover:text-foreground transition-colors"
        >
          Families
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{family.familyName}</span>
      </nav>

      {/* Header card */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 px-6 py-5">
          {/* Icon */}
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-7 w-7 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{family.familyName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {family.members.length} member{family.members.length !== 1 ? "s" : ""}
              </span>
              {family.weddingAnniversary && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-rose-400" />
                    Anniversary {format(new Date(family.weddingAnniversary), "d MMM yyyy")}
                  </span>
                </>
              )}
              {branchName && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {branchName}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Message
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete family
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete family?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the family grouping but keeps each member record intact. Are you sure?
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
    </>
  );
}
