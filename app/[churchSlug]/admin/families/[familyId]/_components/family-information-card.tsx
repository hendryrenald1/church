"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Check, Heart, Home, X } from "lucide-react";
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
    address: family.address ?? ""
  });
  const [isPending, startTransition] = useTransition();

  const anniversaryDate = useMemo(() => (formData.weddingAnniversary ? new Date(formData.weddingAnniversary) : undefined), [formData.weddingAnniversary]);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/families/${family.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            familyName: formData.familyName,
            weddingAnniversary: formData.weddingAnniversary,
            address: formData.address
          })
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
      address: family.address ?? ""
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3 sm:flex-row">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Home className="h-5 w-5" />
          Family Information
        </CardTitle>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetForm} disabled={isPending}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              <Check className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="family-name">Family Name</Label>
              <Input
                id="family-name"
                value={formData.familyName}
                onChange={(e) => setFormData((prev) => ({ ...prev, familyName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Wedding Anniversary</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !anniversaryDate && "text-muted-foreground")} disabled={isPending}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {anniversaryDate ? format(anniversaryDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={anniversaryDate}
                    onSelect={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        weddingAnniversary: date ? date.toISOString() : null
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="family-address">Address</Label>
              <Textarea
                id="family-address"
                rows={3}
                placeholder="House number, street, city"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Family name</p>
              <p className="text-lg font-semibold">{family.familyName}</p>
            </div>

            {family.weddingAnniversary ? (
              <div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  Wedding anniversary
                </p>
                <p className="text-lg font-semibold">{format(new Date(family.weddingAnniversary), "MMMM dd, yyyy")}</p>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4" />
                Address
              </p>
              <p className="whitespace-pre-wrap text-base">{family.address ?? "Not provided"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
