"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Check, Home, MapPin, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { FamilyDetail } from "../page";

export function FamilyInformationCard({ family }: { family: FamilyDetail }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    familyName: family.familyName,
    weddingAnniversary: family.weddingAnniversary,
    address: family.address ?? "",
  });
  const [isPending, startTransition] = useTransition();

  const anniversaryDate = useMemo(
    () => (formData.weddingAnniversary ? new Date(formData.weddingAnniversary) : undefined),
    [formData.weddingAnniversary]
  );

  const handleSave = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/families/${family.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyName: formData.familyName,
            weddingAnniversary: formData.weddingAnniversary,
            address: formData.address,
          }),
        });
        if (!response.ok) throw new Error("Request failed");
        toast({ title: "Family information updated" });
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({ title: "Failed to update family", variant: "destructive" });
      }
    });
  };

  const resetForm = () => {
    setFormData({
      familyName: family.familyName,
      weddingAnniversary: family.weddingAnniversary,
      address: family.address ?? "",
    });
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" /> Family Information
        </h2>
        {!isEditing ? (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={resetForm} disabled={isPending}>
              <X className="h-3 w-3" />Cancel
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={isPending}>
              <Check className="h-3 w-3" />Save
            </Button>
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Family Name</Label>
              <Input
                value={formData.familyName}
                onChange={(e) => setFormData((p) => ({ ...p, familyName: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Wedding Anniversary</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("h-8 w-full justify-start text-sm font-normal", !anniversaryDate && "text-muted-foreground")}
                    disabled={isPending}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {anniversaryDate ? format(anniversaryDate, "d MMM yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={anniversaryDate}
                    onSelect={(date) =>
                      setFormData((p) => ({ ...p, weddingAnniversary: date ? date.toISOString() : null }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</Label>
              <Textarea
                rows={3}
                placeholder="House number, street, city"
                value={formData.address}
                onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                className="text-sm resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Family Name</p>
              <p className="text-sm font-medium mt-0.5">{family.familyName}</p>
            </div>
            {family.weddingAnniversary && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <Heart className="h-3 w-3 text-rose-400" /> Wedding Anniversary
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {format(new Date(family.weddingAnniversary), "d MMMM yyyy")}
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Address
              </p>
              {family.address ? (
                <p className="text-sm font-medium mt-0.5 whitespace-pre-wrap">{family.address}</p>
              ) : (
                <p className="text-sm italic text-muted-foreground mt-0.5">Not provided</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
