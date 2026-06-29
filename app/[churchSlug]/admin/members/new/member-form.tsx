"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressInput, AddressData, Country } from "@/components/forms/address-input";
import { User, Building2, MapPin, Calendar, Mail, Phone, Save, ArrowLeft } from "lucide-react";

type Branch = { id: string; name: string };
type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  branch_id: string | null;
  status: "ACTIVE" | "INACTIVE";
  joined_date: string;
  date_of_birth: string | null;
  baptism_date: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_county: string | null;
  postcode: string | null;
  country: string | null;
};

type Props = {
  churchSlug: string;
  branches: Branch[];
  member?: Member;
  apiBasePath?: "admin" | "pastor";
  redirectPath?: string;
};

const initialDate = new Date().toISOString().split("T")[0];

const normalizeDateInput = (value: string | null | undefined) => {
  if (!value) return "";
  return value.split("T")[0];
};

function SectionCard({
  icon: Icon,
  title,
  children
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b bg-muted/30">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function MemberForm({
  churchSlug,
  branches,
  member,
  apiBasePath = "admin",
  redirectPath
}: Props) {
  const router = useRouter();
  const isEditing = !!member;

  const [form, setForm] = useState({
    firstName: member?.first_name ?? "",
    lastName: member?.last_name ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    branchId: member?.branch_id ?? "",
    status: member?.status ?? "ACTIVE",
    joinedDate: member ? normalizeDateInput(member.joined_date) : initialDate,
    dateOfBirth: normalizeDateInput(member?.date_of_birth),
    baptismDate: normalizeDateInput(member?.baptism_date)
  });

  const [address, setAddress] = useState<AddressData>({
    addressLine1: member?.address_line1 ?? "",
    addressLine2: member?.address_line2 ?? "",
    city: member?.city ?? "",
    stateCounty: member?.state_county ?? "",
    postcode: member?.postcode ?? "",
    country: (member?.country as Country) ?? "UK"
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (field: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      branchId: form.branchId || null,
      status: form.status as "ACTIVE" | "INACTIVE",
      joinedDate: form.joinedDate,
      dateOfBirth: form.dateOfBirth || null,
      baptismDate: form.baptismDate || null,
      addressLine1: address.addressLine1.trim() || null,
      addressLine2: address.addressLine2.trim() || null,
      city: address.city.trim() || null,
      stateCounty: address.stateCounty.trim() || null,
      postcode: address.postcode.trim() || null,
      country: address.country
    };

    const endpoint = member
      ? `/api/${apiBasePath}/members/${member.id}`
      : `/api/${apiBasePath}/members`;
    const method = member ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to save member");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.push(redirectPath ?? `/${churchSlug}/${apiBasePath}/members`);
    router.refresh();
  };

  const cancelHref = redirectPath ?? `/${churchSlug}/${apiBasePath}/members`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Personal Information */}
      <SectionCard icon={User} title="Personal Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="firstName" className="text-xs font-medium">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              required
              value={form.firstName}
              onChange={setField("firstName")}
              placeholder="Jane"
              disabled={submitting}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="lastName" className="text-xs font-medium">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              required
              value={form.lastName}
              onChange={setField("lastName")}
              placeholder="Smith"
              disabled={submitting}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={setField("email")}
              placeholder="jane@example.com"
              disabled={submitting}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="phone" className="text-xs font-medium flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={setField("phone")}
              placeholder="+44 7700 900000"
              disabled={submitting}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="dateOfBirth" className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={setField("dateOfBirth")}
              disabled={submitting}
            />
          </div>
        </div>
      </SectionCard>

      {/* Church Details */}
      <SectionCard icon={Building2} title="Church Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium">Branch</Label>
            <Select
              value={form.branchId || "none"}
              onValueChange={(v) => setForm((prev) => ({ ...prev, branchId: v === "none" ? "" : v }))}
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs font-medium">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as "ACTIVE" | "INACTIVE" }))}
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </SelectItem>
                <SelectItem value="INACTIVE">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    Inactive
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="joinedDate" className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Joined Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="joinedDate"
              type="date"
              required
              value={form.joinedDate}
              onChange={setField("joinedDate")}
              disabled={submitting}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="baptismDate" className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Baptism Date
            </Label>
            <Input
              id="baptismDate"
              type="date"
              value={form.baptismDate}
              onChange={setField("baptismDate")}
              disabled={submitting}
            />
          </div>
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard icon={MapPin} title="Address">
        <AddressInput value={address} onChange={setAddress} disabled={submitting} />
      </SectionCard>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
          disabled={submitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="gap-2 min-w-[130px]">
          {submitting ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEditing ? "Save Changes" : "Add Member"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
