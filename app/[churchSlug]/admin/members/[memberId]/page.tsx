import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Cake,
  Calendar,
  CalendarCheck,
  CalendarX,
  CheckCircle,
  ChevronRight,
  Church,
  Droplets,
  Flame,
  HandHeart,
  Heart,
  Mail,
  MapPin,
  MoreHorizontal,
  Music,
  Pencil,
  Phone,
  Plus,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

type Props = { params: { churchSlug: string; memberId: string } };

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type GroupType = "worship" | "bible_study" | "youth" | "outreach" | "prayer" | "pastoral" | "admin" | "default";
type EventType = "sunday_service" | "midweek" | "prayer" | "group" | "event" | "default";

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-rose-600",
    "bg-amber-600", "bg-teal-600", "bg-indigo-600", "bg-pink-600",
    "bg-sky-600",   "bg-orange-600",
  ];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${colors[hash % colors.length]} text-white`;
}

function formatRelationship(rel: string): string {
  const labels: Record<string, string> = {
    HEAD: "Head of Family", SPOUSE: "Spouse", CHILD: "Child",
    PARENT: "Parent", SIBLING: "Sibling",
  };
  return labels[rel] ?? rel;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, value, href }: { label: string; value?: string | null; href?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {value ? (
        href ? (
          <a href={href} className="text-sm font-medium text-primary hover:underline">
            {value}
          </a>
        ) : (
          <span className="text-sm font-medium">{value}</span>
        )
      ) : (
        <span className="text-sm italic text-muted-foreground">Not provided</span>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function QuickInfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {value ? (
          href ? (
            <a href={href} className="block truncate text-sm font-medium text-primary hover:underline">
              {value}
            </a>
          ) : (
            <p className="text-sm font-medium">{value}</p>
          )
        ) : (
          <p className="text-sm italic text-muted-foreground">Not provided</p>
        )}
      </div>
    </div>
  );
}

function AttendanceStatCell({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-3.5 gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-base font-bold leading-tight ${highlight ? "text-emerald-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Group helpers ─────────────────────────────────────────────────────────────

function getGroupIcon(type: GroupType): LucideIcon {
  const map: Record<GroupType, LucideIcon> = {
    worship: Music, bible_study: BookOpen, youth: Users,
    outreach: Heart, prayer: HandHeart, pastoral: Users,
    admin: Settings, default: Users,
  };
  return map[type] ?? Users;
}

function getGroupStyles(type: GroupType): string {
  const map: Record<GroupType, string> = {
    worship:     "bg-violet-100 text-violet-700",
    bible_study: "bg-blue-100   text-blue-700",
    youth:       "bg-emerald-100 text-emerald-700",
    outreach:    "bg-rose-100   text-rose-700",
    prayer:      "bg-amber-100  text-amber-700",
    pastoral:    "bg-teal-100   text-teal-700",
    admin:       "bg-slate-100  text-slate-700",
    default:     "bg-muted      text-muted-foreground",
  };
  return map[type] ?? map.default;
}

// ─── Event helpers ─────────────────────────────────────────────────────────────

function getEventIcon(type: EventType): LucideIcon {
  const map: Record<EventType, LucideIcon> = {
    sunday_service: Church, midweek: BookOpen, prayer: HandHeart,
    group: Users, event: Calendar, default: CheckCircle,
  };
  return map[type] ?? CheckCircle;
}

function getEventStyles(type: EventType): string {
  const map: Record<EventType, string> = {
    sunday_service: "bg-blue-100   text-blue-700",
    midweek:        "bg-violet-100 text-violet-700",
    prayer:         "bg-amber-100  text-amber-700",
    group:          "bg-emerald-100 text-emerald-700",
    event:          "bg-rose-100   text-rose-700",
    default:        "bg-muted      text-muted-foreground",
  };
  return map[type] ?? map.default;
}

function formatDay(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { weekday: "long" });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminMemberDetailPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [
    { data: memberData, error: memberError },
    { data: familyMemberships, error: familyError },
    { data: groupMemberships },
    { data: cellGroupMemberships },
    { data: attendanceData },
  ] = await Promise.all([
    supabase
      .from("member")
      .select(
        "id, first_name, last_name, email, phone, status, joined_date, date_of_birth, baptism_date, address_line1, address_line2, city, state_county, postcode, country, branch:branch_id (id, name)"
      )
      .eq("church_id", session.churchId)
      .eq("id", params.memberId)
      .single(),
    supabase
      .from("family_member")
      .select("id, relationship, family:family_id (id, family_name)")
      .eq("member_id", params.memberId)
      .eq("church_id", session.churchId),
    supabase
      .from("group_member")
      .select("id, joined_at, group:group_id (id, name, type)")
      .eq("member_id", params.memberId)
      .eq("church_id", session.churchId),
    supabase
      .from("cell_group_member")
      .select("id, joined_at, role, cell_group:group_id (id, name, branch:branch_id (id, name))")
      .eq("member_id", params.memberId)
      .eq("church_id", session.churchId)
      .is("archived_at", null),
    supabase
      .from("meeting_attendance")
      .select(
        `id, status,
         cell_meeting:meeting_id (
           id, meeting_date, status,
           cell_group:group_id (id, name, branch:branch_id (id, name))
         )`
      )
      .eq("member_id", params.memberId)
      .eq("church_id", session.churchId)
      .limit(100),
  ]);

  if (memberError || familyError || !memberData) {
    console.error("Failed to load member", memberError ?? familyError);
    notFound();
  }

  type MemberRow = Database["public"]["Tables"]["member"]["Row"];
  type BranchRow = Database["public"]["Tables"]["branch"]["Row"];
  type MemberRecord = Pick<
    MemberRow,
    | "id" | "first_name" | "last_name" | "email" | "phone" | "status"
    | "joined_date" | "date_of_birth" | "baptism_date"
    | "address_line1" | "address_line2" | "city" | "state_county" | "postcode" | "country"
  > & { branch: Pick<BranchRow, "id" | "name"> | null };

  type FamilyMemberRow = Database["public"]["Tables"]["family_member"]["Row"];
  type FamilyRow      = Database["public"]["Tables"]["family"]["Row"];
  type FamilyMembershipRecord = Pick<FamilyMemberRow, "id" | "relationship"> & {
    family: Pick<FamilyRow, "id" | "family_name"> | null;
  };

  type GroupMemberRow = Database["public"]["Tables"]["group_member"]["Row"];
  type GroupRow       = Database["public"]["Tables"]["group"]["Row"];

  const member  = memberData as unknown as MemberRecord;
  const fams    = (familyMemberships ?? []) as unknown as FamilyMembershipRecord[];
  const rawGroups = (groupMemberships ?? []) as unknown as Array<
    Pick<GroupMemberRow, "id" | "joined_at"> & { group: Pick<GroupRow, "id" | "name" | "type"> | null }
  >;

  type CellGroupMembershipRow = {
    id: string;
    joined_at: string;
    role: "LEADER" | "ASSISTANT" | "MEMBER";
    cell_group: { id: string; name: string; branch: { id: string; name: string } | null } | null;
  };
  const rawCellGroups = (cellGroupMemberships ?? []) as unknown as CellGroupMembershipRow[];

  const fullName   = `${member.first_name} ${member.last_name}`;
  const basePath   = `/${params.churchSlug}/admin/members`;
  const cellGroupBasePath = `/${params.churchSlug}/admin/cell-groups`;
  const branchName = member.branch?.name ?? "Unassigned";
  const isActive   = member.status === "ACTIVE";

  // Ministry groups (group_member table)
  const ministryGroups = rawGroups.map((g) => ({
    id:         g.id,
    groupId:    g.group?.id ?? "",
    name:       g.group?.name ?? "Group",
    type:       (g.group?.type as GroupType) ?? "default",
    joinedDate: g.joined_at,
    href:       `/${params.churchSlug}/admin/groups/${g.group?.id ?? ""}`,
    kind:       "ministry" as const,
    role:       null as string | null,
    subtitle:   null as string | null,
  }));

  // Cell groups (cell_group_member table)
  const cellGroups = rawCellGroups.map((g) => ({
    id:         g.id,
    groupId:    g.cell_group?.id ?? "",
    name:       g.cell_group?.name ?? "Cell Group",
    type:       "default" as GroupType,
    joinedDate: g.joined_at,
    href:       `${cellGroupBasePath}/${g.cell_group?.id ?? ""}`,
    kind:       "cell" as const,
    role:       g.role,
    subtitle:   g.cell_group?.branch?.name ?? "Church-wide",
  }));

  const groups = [...ministryGroups, ...cellGroups];

  // ── Attendance (real data from meeting_attendance) ────────────────────────
  type AttendanceRecord = {
    id: string;
    status: string;
    cell_meeting: {
      id: string;
      meeting_date: string;
      status: string;
      cell_group: { id: string; name: string; branch: { id: string; name: string } | null } | null;
    } | null;
  };

  const rawAttendance = (attendanceData ?? []) as unknown as AttendanceRecord[];

  // Only consider HELD meetings
  const heldAttendance = rawAttendance
    .filter((r) => r.cell_meeting?.status === "HELD")
    .sort(
      (a, b) =>
        new Date(b.cell_meeting!.meeting_date).getTime() -
        new Date(a.cell_meeting!.meeting_date).getTime()
    );

  const isAttended = (s: string) => s === "PRESENT" || s === "LATE";

  // Total attended
  const totalAttended = heldAttendance.filter((r) => isAttended(r.status)).length;

  // This month: X of Y
  const now = new Date();
  const thisMonthRecords = heldAttendance.filter((r) => {
    const d = new Date(r.cell_meeting!.meeting_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const thisMonthAttended = thisMonthRecords.filter((r) => isAttended(r.status)).length;
  const thisMonthStr = `${thisMonthAttended} of ${thisMonthRecords.length}`;

  // Streak: consecutive recent meetings with PRESENT/LATE
  let streak = 0;
  for (const r of heldAttendance) {
    if (isAttended(r.status)) streak++;
    else break;
  }

  // Trend: compare last 4 vs previous 4 attendance rates
  const last4 = heldAttendance.slice(0, 4);
  const prev4 = heldAttendance.slice(4, 8);
  const last4Rate = last4.length > 0 ? last4.filter((r) => isAttended(r.status)).length / last4.length : 0;
  const prev4Rate = prev4.length > 0 ? prev4.filter((r) => isAttended(r.status)).length / prev4.length : 0;
  const trendValue: "up" | "down" | "stable" =
    prev4.length === 0 ? "stable"
    : last4Rate > prev4Rate + 0.15 ? "up"
    : last4Rate < prev4Rate - 0.15 ? "down"
    : "stable";

  const attendanceStats = {
    thisMonth: thisMonthStr,
    total: totalAttended,
    streak,
    trend: trendValue,
  };

  // History entries — exclude UNKNOWN, show most recent 10
  const attendanceEntries: Array<{
    id: string; eventName: string; eventType: EventType;
    date: string; checkInTime: string; branch?: string; status: string;
  }> = heldAttendance
    .filter((r) => r.status !== "UNKNOWN")
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      eventName: r.cell_meeting?.cell_group?.name ?? "Cell Group",
      eventType: "group" as EventType,
      date: r.cell_meeting!.meeting_date,
      checkInTime: r.cell_meeting!.meeting_date,
      branch: r.cell_meeting?.cell_group?.branch?.name,
      status: r.status,
    }));

  const hasAddress = !!(member.address_line1 || member.city || member.postcode);

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href={basePath} className="hover:text-foreground transition-colors">
            Members
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{fullName}</span>
        </nav>

        {/* ── Profile header card ── */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          {/* Colour accent band */}
          <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-5 px-6 py-5">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className={`text-xl font-bold ${getAvatarColor(fullName)}`}>
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight leading-tight">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
                <span className={`inline-flex items-center gap-1.5 font-medium ${isActive ? "text-emerald-700" : "text-muted-foreground"}`}>
                  <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                  {isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {branchName}
                </span>
                {member.joined_date && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {formatDate(member.joined_date)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button asChild className="gap-2">
                <Link href={`${basePath}/${member.id}/edit`}>
                  <Pencil className="h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" /> Message
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem>Change status</DropdownMenuItem>
                  <DropdownMenuItem>Move to branch</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    Delete member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile details card */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
              {/* Contact */}
              <div className="px-5 pt-5 pb-5">
                <SectionLabel>Contact</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Email address"
                    value={member.email}
                    href={member.email ? `mailto:${member.email}` : undefined}
                  />
                  <Field
                    label="Phone number"
                    value={member.phone}
                    href={member.phone ? `tel:${member.phone}` : undefined}
                  />
                </div>
              </div>

              <Separator />

              {/* Church details */}
              <div className="px-5 pt-5 pb-5">
                <SectionLabel>Church Details</SectionLabel>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Branch"       value={branchName} />
                  <Field label="Status"       value={isActive ? "Active" : "Inactive"} />
                  <Field label="Joined"       value={formatDate(member.joined_date)} />
                  <Field label="Baptism date" value={formatDate(member.baptism_date)} />
                </div>
              </div>

              <Separator />

              {/* Personal */}
              <div className="px-5 pt-5 pb-5">
                <SectionLabel>Personal</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date of birth" value={formatDate(member.date_of_birth)} />
                </div>
              </div>

              <Separator />

              {/* Address */}
              <div className="px-5 pt-5 pb-5">
                <SectionLabel>Address</SectionLabel>
                {hasAddress ? (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="text-sm leading-relaxed space-y-0.5">
                      {member.address_line1 && (
                        <p className="font-medium">{member.address_line1}</p>
                      )}
                      {member.address_line2 && (
                        <p className="text-muted-foreground">{member.address_line2}</p>
                      )}
                      {(member.city || member.state_county) && (
                        <p className="text-muted-foreground">
                          {[member.city, member.state_county].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {member.postcode && (
                        <p className="text-muted-foreground">
                          {member.postcode}
                          {member.country && (
                            <span> · {member.country === "IN" ? "India" : "United Kingdom"}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">No address on record.</p>
                )}
              </div>
            </div>

            {/* Groups card */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">Groups</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {groups.length}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add to group
                </Button>
              </div>

              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Users className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Not part of any groups</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Assign this member to a group to get started.</p>
                  <Button variant="outline" size="sm" className="mt-4 gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add to group
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {groups.map((group) => {
                    const Icon = group.kind === "cell" ? Users : getGroupIcon(group.type);
                    const iconStyle = group.kind === "cell"
                      ? "bg-primary/10 text-primary"
                      : getGroupStyles(group.type);

                    return (
                      <Link
                        key={group.id}
                        href={group.href}
                        className="group flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                      >
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${iconStyle}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-medium truncate">{group.name}</p>
                            {group.kind === "cell" && group.role && group.role !== "MEMBER" && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                                {group.role.charAt(0) + group.role.slice(1).toLowerCase()}
                              </span>
                            )}
                            {group.kind === "cell" && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                                Cell Group
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {group.subtitle && <span>{group.subtitle} · </span>}
                            Joined {formatDate(group.joinedDate) ?? "—"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attendance card */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
                <h2 className="text-sm font-semibold">Attendance</h2>
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
                  <Link href={`${basePath}/${member.id}/attendance`}>
                    Full history <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x border-b">
                <AttendanceStatCell icon={CalendarCheck} label="This month" value={attendanceStats.thisMonth} />
                <AttendanceStatCell icon={CheckCircle}   label="Total"      value={String(attendanceStats.total)} />
                <AttendanceStatCell icon={Flame}         label="Streak"     value={`${attendanceStats.streak} wks`} />
                <AttendanceStatCell
                  icon={TrendingUp}
                  label="Trend"
                  value={attendanceStats.trend === "up" ? "↑ Rising" : attendanceStats.trend === "down" ? "↓ Falling" : "— Stable"}
                  highlight={attendanceStats.trend === "up"}
                />
              </div>

              {/* History */}
              {attendanceEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <CalendarX className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No attendance records yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Check-ins will appear here once recorded.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {attendanceEntries.map((entry) => {
                    const Icon = getEventIcon(entry.eventType);
                    const statusStyle =
                      entry.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" :
                      entry.status === "LATE"    ? "bg-amber-100 text-amber-700"   :
                      entry.status === "ABSENT"  ? "bg-red-100 text-red-700"       :
                      entry.status === "EXCUSED" ? "bg-blue-100 text-blue-700"     :
                      "bg-muted text-muted-foreground";
                    const statusLabel =
                      entry.status === "PRESENT" ? "Present" :
                      entry.status === "LATE"    ? "Late"    :
                      entry.status === "ABSENT"  ? "Absent"  :
                      entry.status === "EXCUSED" ? "Excused" : entry.status;
                    return (
                      <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${getEventStyles(entry.eventType)}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{entry.eventName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {entry.branch ?? "Cell Group"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusStyle}`}>
                            {statusLabel}
                          </span>
                          <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar (1/3) ── */}
          <div className="space-y-6">

            {/* Quick info card */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="text-sm font-semibold">Quick Info</h2>
              </div>
              <div className="px-5 py-4 space-y-4">
                <QuickInfoRow icon={Mail}      label="Email"        value={member.email}       href={member.email  ? `mailto:${member.email}`  : undefined} />
                <QuickInfoRow icon={Phone}     label="Phone"        value={member.phone}       href={member.phone  ? `tel:${member.phone}`      : undefined} />
                <QuickInfoRow icon={Building2} label="Branch"       value={branchName} />
                <QuickInfoRow icon={Calendar}  label="Joined"       value={formatDate(member.joined_date)} />
                <QuickInfoRow icon={Cake}      label="Date of birth" value={formatDate(member.date_of_birth)} />
                <QuickInfoRow icon={Droplets}  label="Baptism date" value={formatDate(member.baptism_date)} />
              </div>
            </div>

            {/* Family card */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 className="text-sm font-semibold">Family</h2>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" asChild>
                  <Link href={`${basePath}/${member.id}/families`}>Manage</Link>
                </Button>
              </div>

              {fams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <p className="text-sm text-muted-foreground">No family linked yet.</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Link family
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {fams.map((membership) => {
                    const familyName    = membership.family?.family_name ?? "Family";
                    const relationship  = membership.relationship ?? "";
                    const isHead        = relationship === "HEAD";
                    return (
                      <Link
                        key={membership.id}
                        href={`/${params.churchSlug}/admin/families/${membership.family?.id ?? ""}`}
                        className="group flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{familyName}</p>
                            <span className={`text-xs font-medium ${isHead ? "text-primary" : "text-muted-foreground"}`}>
                              {formatRelationship(relationship)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur p-4 lg:hidden">
        <div className="mx-auto max-w-6xl flex gap-3">
          <Button asChild className="flex-1">
            <Link href={`${basePath}/${member.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="outline" className="flex-1">
            <Mail className="mr-2 h-4 w-4" /> Message
          </Button>
        </div>
      </div>
    </div>
  );
}
