"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Search, UserRoundPlus } from "lucide-react";
import { MemberSearchResult, BranchSummary } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/lib/hooks/use-debounce";

type Props = {
  selectedMember: MemberSearchResult | null;
  onSelect: (member: MemberSearchResult) => void;
  onClear: () => void;
  branches: BranchSummary[];
};

type CreateMemberForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branchId: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export function MemberSearchSelector({ selectedMember, onSelect, onClear, branches }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateMemberForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    branchId: null,
    status: "ACTIVE"
  });
  const [creatingMember, setCreatingMember] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    const fetchMembers = async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/admin/pastors/member-search?q=${encodeURIComponent(debouncedQuery)}`, {
          signal: controller.signal
        });
        if (!res.ok) {
          throw new Error("Failed to load members");
        }
        const data = (await res.json()) as MemberSearchResult[];
        setResults(data);
        setHasSearched(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSearchError((err as Error).message);
      } finally {
        setIsSearching(false);
      }
    };
    fetchMembers();
    return () => controller.abort();
  }, [debouncedQuery]);

  const selectedSummary = useMemo(() => {
    if (!selectedMember) return null;
    return {
      fullName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      contact: selectedMember.email || selectedMember.phone || "Contact info missing"
    };
  }, [selectedMember]);

  const handleResultClick = (member: MemberSearchResult) => {
    onSelect(member);
    setResults([]);
    setQuery("");
  };

  const resetCreateForm = () => {
    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      branchId: null,
      status: "ACTIVE"
    });
  };

  const handleCreateMember = async () => {
    if (creatingMember) return;
    setCreatingMember(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/pastors/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: createForm.firstName.trim(),
          lastName: createForm.lastName.trim(),
          email: createForm.email.trim() || null,
          phone: createForm.phone.trim() || null,
          branchId: createForm.branchId,
          status: createForm.status
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create member");
      }
      const member = (await res.json()) as MemberSearchResult;
      onSelect(member);
      setCreateDialogOpen(false);
      resetCreateForm();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreatingMember(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1.5">
        <CardTitle>Select member</CardTitle>
        <CardDescription>Search by name, email, or phone. Pastors must be existing members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedSummary ? (
          <div className="flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-base font-semibold">{selectedSummary.fullName}</p>
              <p className="text-sm text-muted-foreground">{selectedMember?.branchName ?? "Branch unknown"}</p>
              <p className="text-sm text-muted-foreground">{selectedSummary.contact}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="ghost" onClick={onClear}>
                Change
              </Button>
              <Button variant="secondary" onClick={() => setCreateDialogOpen(true)}>
                Create new member
              </Button>
            </div>
          </div>
        ) : (
          <Fragment>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Start typing a name, email, or phone..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="rounded-lg border">
              <Command className="max-h-72">
                <CommandInput placeholder="Search members..." value={query} onValueChange={setQuery} />
                <CommandList>
                  <CommandEmpty>
                    {isSearching ? "Searching members..." : hasSearched ? "No members found" : "Start typing to search"}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="max-h-60">
                      {isSearching ? (
                        <div className="space-y-3 p-4">
                          {[0, 1, 2].map((idx) => (
                            <Skeleton key={idx} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : (
                        results.map((member) => (
                          <CommandItem
                            key={member.id}
                            value={`${member.firstName} ${member.lastName} ${member.email ?? ""} ${member.phone ?? ""}`}
                            onSelect={() => handleResultClick(member)}
                          >
                            <div className="flex-1">
                              <p className="font-medium">{`${member.firstName} ${member.lastName}`}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.branchName ?? "Branch unknown"} · {member.email ?? member.phone ?? "No contact"}
                              </p>
                            </div>
                            <Badge variant="secondary">{member.status}</Badge>
                          </CommandItem>
                        ))
                      )}
                    </ScrollArea>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
            {searchError && <p className="text-sm text-destructive">{searchError}</p>}
            <div className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3 text-sm">
              <span>Can&apos;t find the member?</span>
              <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
                <UserRoundPlus className="mr-2 h-4 w-4" />
                Create member
              </Button>
            </div>
          </Fragment>
        )}
      </CardContent>
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create member</DialogTitle>
            <DialogDescription>Add a minimal record so you can continue with the pastor flow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="member-first-name">First name</Label>
                <Input
                  id="member-first-name"
                  value={createForm.firstName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  placeholder="Jane"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="member-last-name">Last name</Label>
                <Input
                  id="member-last-name"
                  value={createForm.lastName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-phone">Phone</Label>
              <Input
                id="member-phone"
                value={createForm.phone}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+1 555 123 4567"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Select
                value={createForm.branchId ?? ""}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, branchId: value === "none" ? null : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} {branch.city ? `· ${branch.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={createForm.status} onValueChange={(value: "ACTIVE" | "INACTIVE") => setCreateForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creatingMember}>
              Cancel
            </Button>
            <Button onClick={handleCreateMember} disabled={creatingMember || !createForm.firstName || !createForm.lastName}>
              {creatingMember ? "Creating..." : "Create & select"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
