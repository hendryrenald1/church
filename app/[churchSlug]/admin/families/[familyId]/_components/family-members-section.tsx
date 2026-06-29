"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Baby, Calendar, Check, Crown, Droplets, Edit, ExternalLink,
  Heart, Loader2, Mail, MoreHorizontal, Phone, Plus, Trash2,
  User, UserMinus, UserPlus, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { FamilyDetail, FamilyMemberDetail } from "../page";
import { useToast } from "@/components/ui/use-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-600","bg-emerald-600","bg-violet-600","bg-rose-600",
  "bg-amber-600","bg-teal-600","bg-indigo-600","bg-pink-600",
];
function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}
function calcAge(dob: string) {
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
}

const REL_LABEL: Record<string, string> = {
  HEAD: "Head of Family", SPOUSE: "Spouse", CHILD: "Child", OTHER: "Other",
};
const REL_PILL: Record<string, string> = {
  HEAD:   "bg-amber-100 text-amber-700",
  SPOUSE: "bg-rose-100 text-rose-700",
  CHILD:  "bg-blue-100 text-blue-700",
  OTHER:  "bg-muted text-muted-foreground",
};
const REL_ICON: Record<string, React.ElementType> = {
  HEAD: Crown, SPOUSE: Heart, CHILD: Baby, OTHER: Users,
};

// ── Section group ─────────────────────────────────────────────────────────────
function MemberGroup({
  icon: Icon, iconCls, title, members, churchSlug, onRemove,
}: {
  icon: React.ElementType; iconCls: string; title: string;
  members: FamilyMemberDetail[]; churchSlug: string;
  onRemove: (m: FamilyMemberDetail) => void;
}) {
  if (!members.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2 px-5 pt-3 pb-1">
        <Icon className={cn("h-3.5 w-3.5", iconCls)} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      {members.map((fm) => (
        <MemberRow key={fm.id} familyMember={fm} churchSlug={churchSlug} onRemove={() => onRemove(fm)} />
      ))}
    </div>
  );
}

// ── Member row ─────────────────────────────────────────────────────────────────
function MemberRow({
  familyMember, churchSlug, onRemove,
}: {
  familyMember: FamilyMemberDetail; churchSlug: string; onRemove: () => void;
}) {
  const router = useRouter();
  const m = familyMember.member;
  const fullName = `${m.firstName} ${m.lastName}`;
  const RelIcon = REL_ICON[familyMember.relationship] ?? Users;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b last:border-b-0 hover:bg-muted/30 transition-colors group">
      <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", getAvatarColor(fullName))}>
        {getInitials(m.firstName, m.lastName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-sm font-medium truncate">{fullName}</span>
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0", REL_PILL[familyMember.relationship])}>
            <RelIcon className="h-2.5 w-2.5" />
            {REL_LABEL[familyMember.relationship]}
          </span>
          {familyMember.isPrimaryContact && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              Primary
            </span>
          )}
          {m.status === "INACTIVE" && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
              Inactive
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
          {m.email && (
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{m.email}</span>
          )}
          {m.phone && (
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone}</span>
          )}
          {m.dateOfBirth && (
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Age {calcAge(m.dateOfBirth)}</span>
          )}
          {m.baptismDate && (
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-sky-400 inline-block" />
              Baptised {format(new Date(m.baptismDate), "MMM yyyy")}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => router.push(`/${churchSlug}/admin/members/${m.id}`)}>
            <ExternalLink className="mr-2 h-4 w-4" />View profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/${churchSlug}/admin/members/${m.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />Edit member
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onRemove}>
            <UserMinus className="mr-2 h-4 w-4" />Remove from family
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function FamilyMembersSection({ family, churchSlug }: { family: FamilyDetail; churchSlug: string }) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<FamilyMemberDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const head     = family.members.find((m) => m.relationship === "HEAD");
  const spouse   = family.members.find((m) => m.relationship === "SPOUSE");
  const children = family.members.filter((m) => m.relationship === "CHILD");
  const others   = family.members.filter((m) => m.relationship === "OTHER");

  const handleRemoveMember = () => {
    if (!memberToRemove) return;
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/families/members/${memberToRemove.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Request failed");
        toast({ title: "Member removed from family" });
        setMemberToRemove(null);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({ title: "Failed to remove member", variant: "destructive" });
      }
    });
  };

  return (
    <>
      <div id="family-members" className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Members</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {family.members.length}
            </span>
          </div>
          <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />Add member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <AddFamilyMemberDialog
                familyId={family.id}
                existingMemberIds={family.members.map((m) => m.memberId)}
                onSuccess={() => { setShowAddMember(false); router.refresh(); }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {head && (
          <MemberGroup icon={Crown} iconCls="text-amber-500" title="Head of Family"
            members={[head]} churchSlug={churchSlug} onRemove={setMemberToRemove} />
        )}
        {spouse && (
          <MemberGroup icon={Heart} iconCls="text-rose-400" title="Spouse"
            members={[spouse]} churchSlug={churchSlug} onRemove={setMemberToRemove} />
        )}
        {children.length > 0 && (
          <MemberGroup icon={Baby} iconCls="text-blue-500" title="Children"
            members={children} churchSlug={churchSlug} onRemove={setMemberToRemove} />
        )}
        {others.length > 0 && (
          <MemberGroup icon={Users} iconCls="text-muted-foreground" title="Other"
            members={others} churchSlug={churchSlug} onRemove={setMemberToRemove} />
        )}

        {family.members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Users className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No members yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add the first member to get started.</p>
            <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setShowAddMember(true)}>
              <UserPlus className="h-3.5 w-3.5" />Add first member
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={Boolean(memberToRemove)} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberToRemove?.member.firstName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This only detaches them from this family. The member profile stays in your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleRemoveMember}
              disabled={isPending}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Add member dialog (unchanged logic, tidied) ───────────────────────────────
interface MemberOption {
  id: string; firstName: string; lastName: string; email: string | null;
}

function AddFamilyMemberDialog({
  familyId, existingMemberIds, onSuccess,
}: {
  familyId: string; existingMemberIds: string[]; onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<"existing" | "new">("existing");
  const [relationship, setRelationship] = useState<FamilyMemberDetail["relationship"]>("CHILD");
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);
  const [options, setOptions] = useState<MemberOption[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (existingMemberIds.length) params.set("exclude", existingMemberIds.join(","));
        if (debouncedQuery) params.set("search", debouncedQuery);
        params.set("limit", "50");
        const res = await fetch(`/api/admin/members?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!active) return;
        setOptions((data.data ?? []).map((m: { id: string; first_name: string; last_name: string; email: string | null }) => ({
          id: m.id, firstName: m.first_name, lastName: m.last_name, email: m.email,
        })));
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [existingMemberIds, debouncedQuery]);

  const selectedMember = useMemo(() => options.find((o) => o.id === selectedMemberId) ?? null, [options, selectedMemberId]);

  const handleAddExisting = () => {
    if (!selectedMemberId) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/families/${familyId}/add-member`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: selectedMemberId, relationship, isPrimaryContact }),
        });
        if (!res.ok) throw new Error();
        toast({ title: "Member linked to family" });
        onSuccess();
      } catch {
        toast({ title: "Failed to add member", variant: "destructive" });
      }
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add family member</DialogTitle>
        <DialogDescription>Select an existing member or create someone new.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Relationship</Label>
            <Select value={relationship} onValueChange={(v: FamilyMemberDetail["relationship"]) => setRelationship(v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HEAD">Head</SelectItem>
                <SelectItem value="SPOUSE">Spouse</SelectItem>
                <SelectItem value="CHILD">Child</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Checkbox checked={isPrimaryContact} onCheckedChange={(v) => setIsPrimaryContact(Boolean(v))} />
              Primary contact
            </label>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing member</TabsTrigger>
            <TabsTrigger value="new">Create new</TabsTrigger>
          </TabsList>
          <TabsContent value="existing" className="space-y-4 pt-4">
            <Popover open={listOpen} onOpenChange={setListOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-8 text-sm">
                  {selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : "Search members…"}
                  {loading ? <Loader2 className="h-4 w-4 animate-spin opacity-60" /> : <User className="h-4 w-4 opacity-60" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search members…" value={query} onValueChange={setQuery} />
                  <CommandList>
                    <CommandEmpty>{loading ? "Loading…" : "No members found."}</CommandEmpty>
                    <CommandGroup>
                      {options.map((opt) => (
                        <CommandItem
                          key={opt.id}
                          value={`${opt.firstName} ${opt.lastName}`}
                          onSelect={() => { setSelectedMemberId(opt.id); setListOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedMemberId === opt.id ? "opacity-100" : "opacity-0")} />
                          <div className="flex flex-col">
                            <span>{opt.firstName} {opt.lastName}</span>
                            {opt.email && <span className="text-xs text-muted-foreground">{opt.email}</span>}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </TabsContent>
          <TabsContent value="new" className="pt-4">
            <CreateMemberForm
              isPending={isPending}
              onSubmit={(payload) => {
                startTransition(async () => {
                  try {
                    const res = await fetch(`/api/admin/members`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (!res.ok) throw new Error();
                    const result = await res.json();
                    await fetch(`/api/admin/families/${familyId}/add-member`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ memberId: result.member.id, relationship, isPrimaryContact }),
                    });
                    toast({ title: "Member created and linked" });
                    onSuccess();
                  } catch {
                    toast({ title: "Failed to create member", variant: "destructive" });
                  }
                });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onSuccess}>Close</Button>
        {selectedTab === "existing" && (
          <Button onClick={handleAddExisting} disabled={!selectedMemberId || isPending}>
            Add to Family
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

function CreateMemberForm({
  isPending, onSubmit,
}: {
  isPending: boolean;
  onSubmit: (d: { firstName: string; lastName: string; email?: string; phone?: string }) => void;
}) {
  const [fd, setFd] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const disabled = !fd.firstName || !fd.lastName || isPending;
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!disabled) onSubmit({ firstName: fd.firstName, lastName: fd.lastName, email: fd.email || undefined, phone: fd.phone || undefined }); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">First name</Label>
          <Input value={fd.firstName} onChange={(e) => setFd(p => ({ ...p, firstName: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Last name</Label>
          <Input value={fd.lastName} onChange={(e) => setFd(p => ({ ...p, lastName: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input type="email" value={fd.email} onChange={(e) => setFd(p => ({ ...p, email: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Phone</Label>
          <Input value={fd.phone} onChange={(e) => setFd(p => ({ ...p, phone: e.target.value }))} className="h-8 text-sm" />
        </div>
      </div>
      <Button type="submit" disabled={disabled} className="w-full" size="sm">
        {isPending ? "Saving…" : "Create and Add"}
      </Button>
    </form>
  );
}
