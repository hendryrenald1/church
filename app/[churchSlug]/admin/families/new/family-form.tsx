"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User, Users, Plus, Trash2, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type MemberOption = { id: string; first_name: string; last_name: string; email?: string; phone?: string };

type NewMember = {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phone: string;
};

type MemberSelection = {
  type: "existing" | "new";
  existing?: MemberOption;
  new?: NewMember;
};

type ChildEntry = MemberSelection & { tempId: string };

type Props = {
  churchSlug: string;
  members: MemberOption[];
};

const emptyNewMember: NewMember = {
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  email: "",
  phone: "",
};

function MemberSearchCombobox({
  members,
  selectedId,
  onSelect,
  placeholder = "Search members...",
  excludeIds = [],
}: {
  members: MemberOption[];
  selectedId?: string;
  onSelect: (member: MemberOption | null) => void;
  placeholder?: string;
  excludeIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredMembers = useMemo(() => {
    return members.filter(
      (m) =>
        !excludeIds.includes(m.id) &&
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [members, excludeIds, search]);

  const selectedMember = members.find((m) => m.id === selectedId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedMember
            ? `${selectedMember.first_name} ${selectedMember.last_name}`
            : placeholder}
          <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {filteredMembers.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`${member.first_name} ${member.last_name}`}
                  onSelect={() => {
                    onSelect(member.id === selectedId ? null : member);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${member.id === selectedId ? "opacity-100" : "opacity-0"}`}
                  />
                  <div className="flex flex-col">
                    <span>{member.first_name} {member.last_name}</span>
                    {(member.email || member.phone) && (
                      <span className="text-xs text-muted-foreground">
                        {member.email || member.phone}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function NewMemberForm({
  value,
  onChange,
  defaultLastName = "",
}: {
  value: NewMember;
  onChange: (value: NewMember) => void;
  defaultLastName?: string;
}) {
  const updateField = (field: keyof NewMember, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>First Name *</Label>
        <Input
          value={value.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
          placeholder="First name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Last Name *</Label>
        <Input
          value={value.lastName || defaultLastName}
          onChange={(e) => updateField("lastName", e.target.value)}
          placeholder="Last name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={value.gender} onValueChange={(v) => updateField("gender", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Date of Birth</Label>
        <Input
          type="date"
          value={value.dateOfBirth}
          onChange={(e) => updateField("dateOfBirth", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={value.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="Email address"
        />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          type="tel"
          value={value.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          placeholder="Phone number"
        />
      </div>
    </div>
  );
}

function MemberCard({
  member,
  role,
  onRemove,
}: {
  member: MemberSelection;
  role: string;
  onRemove?: () => void;
}) {
  const name =
    member.type === "existing"
      ? `${member.existing?.first_name} ${member.existing?.last_name}`
      : `${member.new?.firstName} ${member.new?.lastName}`;
  const isNew = member.type === "new";

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {role}
                </Badge>
                {isNew && (
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {onRemove && (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function FamilyForm({ churchSlug, members }: Props) {
  const router = useRouter();

  // Family info
  const [familyName, setFamilyName] = useState("");
  const [weddingAnniversary, setWeddingAnniversary] = useState("");
  const [address, setAddress] = useState("");

  // Head member
  const [headMember, setHeadMember] = useState<MemberSelection | null>(null);
  const [showCreateHead, setShowCreateHead] = useState(false);
  const [newHeadData, setNewHeadData] = useState<NewMember>({ ...emptyNewMember });

  // Spouse member
  const [spouseMember, setSpouseMember] = useState<MemberSelection | null>(null);
  const [showCreateSpouse, setShowCreateSpouse] = useState(false);
  const [newSpouseData, setNewSpouseData] = useState<NewMember>({ ...emptyNewMember });

  // Children
  const [children, setChildren] = useState<ChildEntry[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childTab, setChildTab] = useState<"existing" | "new">("existing");
  const [selectedChildMember, setSelectedChildMember] = useState<MemberOption | null>(null);
  const [newChildData, setNewChildData] = useState<NewMember>({ ...emptyNewMember });

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Excluded member IDs for selection
  const excludedMemberIds = useMemo(() => {
    const ids: string[] = [];
    if (headMember?.type === "existing" && headMember.existing) {
      ids.push(headMember.existing.id);
    }
    if (spouseMember?.type === "existing" && spouseMember.existing) {
      ids.push(spouseMember.existing.id);
    }
    children.forEach((child) => {
      if (child.type === "existing" && child.existing) {
        ids.push(child.existing.id);
      }
    });
    return ids;
  }, [headMember, spouseMember, children]);

  // Auto-suggest family name from head member
  const suggestedFamilyName = useMemo(() => {
    if (headMember?.type === "existing" && headMember.existing) {
      return `${headMember.existing.last_name} Family`;
    }
    if (headMember?.type === "new" && headMember.new?.lastName) {
      return `${headMember.new.lastName} Family`;
    }
    return "";
  }, [headMember]);

  // Head member selection handlers
  const handleSelectExistingHead = (member: MemberOption | null) => {
    if (member) {
      setHeadMember({ type: "existing", existing: member });
      setShowCreateHead(false);
      if (!familyName) {
        setFamilyName(`${member.last_name} Family`);
      }
    } else {
      setHeadMember(null);
    }
  };

  const handleCreateNewHead = () => {
    if (newHeadData.firstName && newHeadData.lastName) {
      setHeadMember({ type: "new", new: { ...newHeadData } });
      setShowCreateHead(false);
      if (!familyName) {
        setFamilyName(`${newHeadData.lastName} Family`);
      }
      setNewHeadData({ ...emptyNewMember });
    }
  };

  // Spouse member selection handlers
  const handleSelectExistingSpouse = (member: MemberOption | null) => {
    if (member) {
      setSpouseMember({ type: "existing", existing: member });
      setShowCreateSpouse(false);
    } else {
      setSpouseMember(null);
    }
  };

  const handleCreateNewSpouse = () => {
    if (newSpouseData.firstName && newSpouseData.lastName) {
      setSpouseMember({ type: "new", new: { ...newSpouseData } });
      setShowCreateSpouse(false);
      setNewSpouseData({ ...emptyNewMember });
    }
  };

  // Children handlers
  const handleAddExistingChild = () => {
    if (selectedChildMember) {
      setChildren((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          type: "existing",
          existing: selectedChildMember,
        },
      ]);
      setSelectedChildMember(null);
      setShowAddChild(false);
    }
  };

  const handleAddNewChild = () => {
    if (newChildData.firstName && newChildData.lastName) {
      setChildren((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          type: "new",
          new: { ...newChildData },
        },
      ]);
      setNewChildData({ ...emptyNewMember });
      setShowAddChild(false);
    }
  };

  const handleRemoveChild = (tempId: string) => {
    setChildren((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  // Get default last name for new members
  const defaultLastName = useMemo(() => {
    if (headMember?.type === "existing" && headMember.existing) {
      return headMember.existing.last_name;
    }
    if (headMember?.type === "new" && headMember.new?.lastName) {
      return headMember.new.lastName;
    }
    return "";
  }, [headMember]);

  // Total member count
  const totalMembers = (headMember ? 1 : 0) + (spouseMember ? 1 : 0) + children.length;

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validation
    if (!familyName.trim()) {
      setError("Please enter a family name");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      familyName: familyName.trim(),
      weddingAnniversary: weddingAnniversary || null,
      address: address.trim() || null,
    };

    // Add head member
    if (headMember) {
      if (headMember.type === "existing" && headMember.existing) {
        payload.headMember = { existing: headMember.existing.id };
      } else if (headMember.type === "new" && headMember.new) {
        payload.headMember = { new: headMember.new };
      }
    }

    // Add spouse member
    if (spouseMember) {
      if (spouseMember.type === "existing" && spouseMember.existing) {
        payload.spouseMember = { existing: spouseMember.existing.id };
      } else if (spouseMember.type === "new" && spouseMember.new) {
        payload.spouseMember = { new: spouseMember.new };
      }
    }

    // Add children
    if (children.length > 0) {
      payload.children = children.map((child) => {
        if (child.type === "existing" && child.existing) {
          return { existing: child.existing.id };
        } else if (child.type === "new" && child.new) {
          return { new: child.new };
        }
        return {};
      });
    }

    try {
      const res = await fetch("/api/admin/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Failed to create family");
        setSubmitting(false);
        return;
      }

      router.push(`/${churchSlug}/admin/families`);
      router.refresh();
    } catch {
      setError("Failed to create family");
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* Section 1: Family Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Family Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Family Name *</Label>
            <Input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder={suggestedFamilyName || "e.g. Doe Family"}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Wedding Anniversary</Label>
              <Input
                type="date"
                value={weddingAnniversary}
                onChange={(e) => setWeddingAnniversary(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Family address (optional)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Head Member */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Head Member</CardTitle>
            <Badge variant="secondary">Required</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {headMember ? (
            <MemberCard
              member={headMember}
              role="Head"
              onRemove={() => setHeadMember(null)}
            />
          ) : (
            <>
              <div className="space-y-2">
                <Label>Select Existing Member</Label>
                <MemberSearchCombobox
                  members={members}
                  onSelect={handleSelectExistingHead}
                  placeholder="Search for head member..."
                  excludeIds={excludedMemberIds}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {!showCreateHead ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCreateHead(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Member
                </Button>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">New Head Member</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCreateHead(false);
                          setNewHeadData({ ...emptyNewMember });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <NewMemberForm value={newHeadData} onChange={setNewHeadData} />
                    <Button
                      type="button"
                      onClick={handleCreateNewHead}
                      disabled={!newHeadData.firstName || !newHeadData.lastName}
                    >
                      Add as Head Member
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Spouse Member */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Spouse</CardTitle>
            <Badge variant="outline">Optional</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {spouseMember ? (
            <MemberCard
              member={spouseMember}
              role="Spouse"
              onRemove={() => setSpouseMember(null)}
            />
          ) : (
            <>
              <div className="space-y-2">
                <Label>Select Existing Member</Label>
                <MemberSearchCombobox
                  members={members}
                  onSelect={handleSelectExistingSpouse}
                  placeholder="Search for spouse..."
                  excludeIds={excludedMemberIds}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {!showCreateSpouse ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCreateSpouse(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Spouse
                </Button>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">New Spouse</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCreateSpouse(false);
                          setNewSpouseData({ ...emptyNewMember });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <NewMemberForm
                      value={newSpouseData}
                      onChange={setNewSpouseData}
                      defaultLastName={defaultLastName}
                    />
                    <Button
                      type="button"
                      onClick={handleCreateNewSpouse}
                      disabled={!newSpouseData.firstName || !newSpouseData.lastName}
                    >
                      Add as Spouse
                    </Button>
                  </CardContent>
                </Card>
              )}

              {weddingAnniversary && !spouseMember && (
                <p className="text-sm text-amber-600">
                  You set a wedding anniversary. Consider adding a spouse.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Children */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Children</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add children to this family unit
              </p>
            </div>
            <Badge variant="outline">{children.length} added</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {children.length > 0 ? (
            <div className="space-y-3">
              {children.map((child) => {
                const name =
                  child.type === "existing"
                    ? `${child.existing?.first_name} ${child.existing?.last_name}`
                    : `${child.new?.firstName} ${child.new?.lastName}`;
                const age =
                  child.type === "new" && child.new?.dateOfBirth
                    ? calculateAge(child.new.dateOfBirth)
                    : null;

                return (
                  <Card key={child.tempId} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">{name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                Child
                              </Badge>
                              {child.type === "new" && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                              {age !== null && <span>{age} years old</span>}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveChild(child.tempId)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No children added yet</p>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setShowAddChild(true);
              setChildTab("existing");
              setNewChildData({ ...emptyNewMember, lastName: defaultLastName });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Child
          </Button>
        </CardContent>
      </Card>

      {/* Add Child Dialog */}
      <Dialog open={showAddChild} onOpenChange={setShowAddChild}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Child</DialogTitle>
            <DialogDescription>
              Select an existing member or create a new child profile
            </DialogDescription>
          </DialogHeader>

          <Tabs value={childTab} onValueChange={(v) => setChildTab(v as "existing" | "new")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Select Existing</TabsTrigger>
              <TabsTrigger value="new">Create New</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 pt-4">
              <MemberSearchCombobox
                members={members}
                selectedId={selectedChildMember?.id}
                onSelect={setSelectedChildMember}
                placeholder="Search for child..."
                excludeIds={excludedMemberIds}
              />

              {selectedChildMember && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {selectedChildMember.first_name} {selectedChildMember.last_name}
                        </p>
                        {(selectedChildMember.email || selectedChildMember.phone) && (
                          <p className="text-sm text-muted-foreground">
                            {selectedChildMember.email || selectedChildMember.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddChild(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddExistingChild}
                  disabled={!selectedChildMember}
                >
                  Add Child
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="new" className="space-y-4 pt-4">
              <NewMemberForm
                value={newChildData}
                onChange={setNewChildData}
                defaultLastName={defaultLastName}
              />
              <p className="text-xs text-muted-foreground">
                Last name auto-filled from head member
              </p>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddChild(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddNewChild}
                  disabled={!newChildData.firstName || !newChildData.lastName}
                >
                  Create & Add Child
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Section 5: Summary */}
      {(headMember || spouseMember || children.length > 0) && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Family Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Family Name</p>
              <p className="text-lg">{familyName || "Not set"}</p>
            </div>

            {weddingAnniversary && (
              <div>
                <p className="text-sm font-medium">Wedding Anniversary</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(weddingAnniversary).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Family Members</p>
              <div className="space-y-2">
                {headMember && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge>Head</Badge>
                    <span>
                      {headMember.type === "existing"
                        ? `${headMember.existing?.first_name} ${headMember.existing?.last_name}`
                        : `${headMember.new?.firstName} ${headMember.new?.lastName}`}
                    </span>
                    {headMember.type === "new" && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                )}

                {spouseMember && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">Spouse</Badge>
                    <span>
                      {spouseMember.type === "existing"
                        ? `${spouseMember.existing?.first_name} ${spouseMember.existing?.last_name}`
                        : `${spouseMember.new?.firstName} ${spouseMember.new?.lastName}`}
                    </span>
                    {spouseMember.type === "new" && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                )}

                {children.map((child) => (
                  <div key={child.tempId} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">Child</Badge>
                    <span>
                      {child.type === "existing"
                        ? `${child.existing?.first_name} ${child.existing?.last_name}`
                        : `${child.new?.firstName} ${child.new?.lastName}`}
                    </span>
                    {child.type === "new" && child.new?.dateOfBirth && (
                      <span className="text-muted-foreground">
                        ({calculateAge(child.new.dateOfBirth)} years)
                      </span>
                    )}
                    {child.type === "new" && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Total members: {totalMembers}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error and Submit */}
      {error && <div className="text-sm text-destructive">{error}</div>}

      <Button type="submit" className="w-full" disabled={submitting || !familyName.trim()}>
        {submitting ? "Creating Family..." : "Create Family"}
      </Button>
    </form>
  );
}
