"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type MemberOption = { id: string; name: string; email?: string | null };

const avatarColors = [
  "bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600",
  "bg-rose-600",  "bg-teal-600",   "bg-indigo-600", "bg-pink-600",
];
function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return avatarColors[Math.abs(h) % avatarColors.length];
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface AddMemberFormProps {
  groupId: string;
  memberOptions: MemberOption[];
}

export function AddMemberForm({ groupId, memberOptions }: AddMemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [role, setRole] = useState<"LEADER" | "ASSISTANT" | "MEMBER">("MEMBER");
  const [error, setError] = useState<string | null>(null);

  const selected = memberOptions.find((m) => m.id === selectedId);

  const handleAdd = async () => {
    if (!selectedId) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch(`/api/admin/cell-groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedId, role }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Failed to add member");
        return;
      }

      setSelectedId("");
      setRole("MEMBER");
      router.refresh();
    });
  };

  return (
    <div className="p-4 border-b bg-muted/10">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Add Member
      </p>
      <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-center">
        {/* Searchable member combobox */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal h-10 text-sm"
            >
              {selected ? (
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-5 w-5 rounded-full ${getAvatarColor(selected.name)} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}
                  >
                    {getInitials(selected.name)}
                  </span>
                  <span className="truncate">{selected.name}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Search member…</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Type a name or email…" className="h-9" />
              <CommandList>
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  No members found.
                </CommandEmpty>
                <CommandGroup heading={`${memberOptions.length} available`}>
                  {memberOptions.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={`${member.name} ${member.email ?? ""}`}
                      onSelect={() => {
                        setSelectedId(member.id === selectedId ? "" : member.id);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2.5 py-2"
                    >
                      <span
                        className={`h-7 w-7 rounded-full ${getAvatarColor(member.name)} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                      >
                        {getInitials(member.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{member.name}</p>
                        {member.email && (
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selectedId === member.id ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Role select */}
        <Select
          value={role}
          onValueChange={(v) => setRole(v as "LEADER" | "ASSISTANT" | "MEMBER")}
          disabled={isPending}
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LEADER">Leader</SelectItem>
            <SelectItem value="ASSISTANT">Assistant</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
          </SelectContent>
        </Select>

        {/* Submit */}
        <Button
          onClick={handleAdd}
          disabled={!selectedId || isPending}
          className="h-10 gap-1.5 sm:w-auto w-full"
        >
          {isPending ? (
            <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Add
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
