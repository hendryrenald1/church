"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Baby,
  Calendar,
  Check,
  CheckCircle,
  Crown,
  Edit,
  ExternalLink,
  Heart,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  Users,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import type { FamilyDetail, FamilyMemberDetail } from "../page";
import { useToast } from "@/components/ui/use-toast";

interface FamilyMembersSectionProps {
  family: FamilyDetail;
  churchSlug: string;
}

export function FamilyMembersSection({ family, churchSlug }: FamilyMembersSectionProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<FamilyMemberDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const head = family.members.find((member) => member.relationship === "HEAD");
  const spouse = family.members.find((member) => member.relationship === "SPOUSE");
  const children = family.members.filter((member) => member.relationship === "CHILD");
  const others = family.members.filter((member) => member.relationship === "OTHER");

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
    <Card id="family-members">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Family Members ({family.members.length})
        </CardTitle>

        <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <AddFamilyMemberDialog
              familyId={family.id}
              existingMemberIds={family.members.map((member) => member.memberId)}
              onSuccess={() => {
                setShowAddMember(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-8">
        {head ? (
          <MemberGroup title="Head of Family" icon={<Crown className="h-4 w-4 text-yellow-500" />} members={[head]} churchSlug={churchSlug} onRemove={setMemberToRemove} />
        ) : (
          <EmptyRelationship prompt="No head assigned" actionLabel="Set Head" onClick={() => setShowAddMember(true)} />
        )}

        {spouse ? (
          <MemberGroup title="Spouse" icon={<Heart className="h-4 w-4 text-rose-500" />} members={[spouse]} churchSlug={churchSlug} onRemove={setMemberToRemove} />
        ) : (
          <EmptyRelationship prompt="No spouse added" actionLabel="Add Spouse" onClick={() => setShowAddMember(true)} />
        )}

        <MemberGroup
          title={`Children (${children.length})`}
          icon={<Baby className="h-4 w-4 text-blue-500" />}
          members={children}
          churchSlug={churchSlug}
          onRemove={setMemberToRemove}
        />

        <MemberGroup
          title={`Other Members (${others.length})`}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          members={others}
          churchSlug={churchSlug}
          onRemove={setMemberToRemove}
        />

        {family.members.length === 0 ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No members in this family yet.</p>
            <Button variant="outline" className="mt-3" onClick={() => setShowAddMember(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add First Member
            </Button>
          </div>
        ) : null}
      </CardContent>

      <AlertDialog open={Boolean(memberToRemove)} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberToRemove?.member.firstName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing a member only detaches them from this family grouping. The member profile will remain in your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleRemoveMember} disabled={isPending}>
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function MemberGroup({ title, icon, members, churchSlug, onRemove }: { title: string; icon: ReactNode; members: FamilyMemberDetail[]; churchSlug: string; onRemove: (member: FamilyMemberDetail) => void }) {
  if (!members.length) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">
        {members.map((member) => (
          <MemberCard key={member.id} familyMember={member} churchSlug={churchSlug} onRemove={() => onRemove(member)} />
        ))}
      </div>
    </div>
  );
}

function EmptyRelationship({ prompt, actionLabel, onClick }: { prompt: string; actionLabel: string; onClick: () => void }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <p className="text-sm text-muted-foreground">{prompt}</p>
      <Button variant="ghost" size="sm" className="mt-2" onClick={onClick}>
        {actionLabel}
      </Button>
    </div>
  );
}

function MemberCard({
  familyMember,
  churchSlug,
  onRemove
}: {
  familyMember: FamilyMemberDetail;
  churchSlug: string;
  onRemove: () => void;
}) {
  const router = useRouter();
  const member = familyMember.member;
  const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase();
  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-start gap-3">
        <Avatar>
          <AvatarFallback>{initials || "NA"}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              {member.firstName} {member.lastName}
            </p>
            <Badge variant={member.status === "ACTIVE" ? "outline" : "secondary"} className="flex items-center gap-1 text-xs">
              {member.status === "ACTIVE" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {member.status === "ACTIVE" ? "Active" : "Inactive"}
            </Badge>
            {familyMember.isPrimaryContact ? (
              <Badge className="text-xs">Primary contact</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {member.email ? (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {member.email}
              </span>
            ) : null}
            {member.phone ? (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {member.phone}
              </span>
            ) : null}
            {member.branchName ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {member.branchName}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {member.dateOfBirth ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Age {calculateAge(member.dateOfBirth)}
              </span>
            ) : null}
            {member.baptismDate ? (
              <span className="flex items-center gap-1">
                <DropsIcon />
                Baptized {format(new Date(member.baptismDate), "MMM dd, yyyy")}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/${churchSlug}/admin/members/${member.id}`)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/${churchSlug}/admin/members/${member.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit member
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={onRemove}>
            <UserMinus className="mr-2 h-4 w-4" />
            Remove from family
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function DropsIcon() {
  return <span className="inline-flex h-3 w-3 rounded-full bg-sky-500" />;
}

interface MemberOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

function AddFamilyMemberDialog({
  familyId,
  existingMemberIds,
  onSuccess
}: {
  familyId: string;
  existingMemberIds: string[];
  onSuccess: () => void;
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

  // Debounce the search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadMembers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (existingMemberIds.length > 0) {
          params.set("exclude", existingMemberIds.join(","));
        }
        if (debouncedQuery) {
          params.set("search", debouncedQuery);
        }
        params.set("limit", "50");
        const response = await fetch(`/api/admin/members?${params.toString()}`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error("Request failed");
        const data = await response.json();
        if (!active) return;
        setOptions(
          (data.data ?? []).map((m: { id: string; first_name: string; last_name: string; email: string | null }) => ({
            id: m.id,
            firstName: m.first_name,
            lastName: m.last_name,
            email: m.email
          }))
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadMembers();
    return () => {
      active = false;
      controller.abort();
    };
  }, [existingMemberIds, debouncedQuery]);

  const selectedMember = useMemo(() => options.find((option) => option.id === selectedMemberId) ?? null, [options, selectedMemberId]);

  const handleAddExisting = () => {
    if (!selectedMemberId) return;
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/families/${familyId}/add-member`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: selectedMemberId, relationship, isPrimaryContact })
        });
        if (!response.ok) throw new Error("Request failed");
        toast({ title: "Member linked to family" });
        onSuccess();
      } catch (error) {
        console.error(error);
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
        <div className="space-y-2">
          <Label>Relationship</Label>
          <Select value={relationship} onValueChange={(value: FamilyMemberDetail["relationship"]) => setRelationship(value)}>
            <SelectTrigger>
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
        <div className="flex items-center space-x-2">
          <Checkbox id="primary-contact" checked={isPrimaryContact} onCheckedChange={(checked) => setIsPrimaryContact(Boolean(checked))} />
          <Label htmlFor="primary-contact">Primary contact</Label>
        </div>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing member</TabsTrigger>
            <TabsTrigger value="new">Create new</TabsTrigger>
          </TabsList>
          <TabsContent value="existing" className="space-y-4 pt-4">
            <Popover open={listOpen} onOpenChange={setListOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={listOpen} className="w-full justify-between font-normal">
                  {selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : "Search members..."}
                  {loading ? <Loader2 className="h-4 w-4 animate-spin opacity-60" /> : <User className="h-4 w-4 opacity-60" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search members..." value={query} onValueChange={setQuery} />
                  <CommandList>
                    <CommandEmpty>{loading ? "Loading members..." : "No members found."}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={`${option.firstName} ${option.lastName}`}
                          onSelect={() => {
                            setSelectedMemberId(option.id);
                            setListOpen(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selectedMemberId === option.id ? "opacity-100" : "opacity-0"}`} />
                          <div className="flex flex-col">
                            <span>
                              {option.firstName} {option.lastName}
                            </span>
                            {option.email ? <span className="text-xs text-muted-foreground">{option.email}</span> : null}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </TabsContent>
          <TabsContent value="new" className="space-y-4 pt-4">
            <CreateMemberForm
              isPending={isPending}
              onSubmit={async (payload) => {
                startTransition(async () => {
                  try {
                    const response = await fetch(`/api/admin/members`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify(payload)
                    });
                    if (!response.ok) throw new Error("Failed to create member");
                    const result = await response.json();
                    await fetch(`/api/admin/families/${familyId}/add-member`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ memberId: result.member.id, relationship, isPrimaryContact })
                    });
                    toast({ title: "Member created and linked" });
                    onSuccess();
                  } catch (error) {
                    console.error(error);
                    toast({ title: "Failed to create member", variant: "destructive" });
                  }
                });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onSuccess}>
          Close
        </Button>
        {selectedTab === "existing" ? (
          <Button onClick={handleAddExisting} disabled={!selectedMemberId || isPending}>
            Add to Family
          </Button>
        ) : null}
      </DialogFooter>
    </>
  );
}

function CreateMemberForm({
  isPending,
  onSubmit
}: {
  isPending: boolean;
  onSubmit: (data: { firstName: string; lastName: string; email?: string; phone?: string }) => void;
}) {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const disabled = !formData.firstName || !formData.lastName || isPending;
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;
        onSubmit({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone || undefined
        });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="new-member-first">First name</Label>
          <Input id="new-member-first" value={formData.firstName} onChange={(event) => setFormData((prev) => ({ ...prev, firstName: event.target.value }))} />
        </div>
        <div>
          <Label htmlFor="new-member-last">Last name</Label>
          <Input id="new-member-last" value={formData.lastName} onChange={(event) => setFormData((prev) => ({ ...prev, lastName: event.target.value }))} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="new-member-email">Email</Label>
          <Input id="new-member-email" type="email" value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} />
        </div>
        <div>
          <Label htmlFor="new-member-phone">Phone</Label>
          <Input id="new-member-phone" value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} />
        </div>
      </div>
      <Button type="submit" disabled={disabled} className="w-full">
        {isPending ? "Saving..." : "Create and Add"}
      </Button>
    </form>
  );
}

function calculateAge(dateString: string) {
  const birth = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
