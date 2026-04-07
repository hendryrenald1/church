import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarCheck,
  CalendarX,
  Cake,
  CheckCircle,
  ChevronRight,
  Church,
  Droplets,
  Flame,
  HandHeart,
  Heart,
  Mail,
  MapPin,
  Minus,
  MoreHorizontal,
  Music,
  Pencil,
  Phone,
  Plus,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AttendanceList } from "./attendance-list";

type Props = { params: { churchSlug: string; memberId: string } };

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

type GroupType = "worship" | "bible_study" | "youth" | "outreach" | "prayer" | "pastoral" | "admin" | "default";

interface GroupCardItem {
  id: string;
  groupId: string;
  name: string;
  type: GroupType;
  role: string;
  joinedDate: string;
}

type EventType = "sunday_service" | "midweek" | "prayer" | "group" | "event" | "default";

interface AttendanceEntry {
  id: string;
  eventName: string;
  eventType: EventType;
  date: string;
  checkInTime: string;
  branch?: string;
}

interface AttendanceStats {
  lastAttendedDate: string | null;
  thisMonthCount: number;
  thisMonthTotal: number;
  totalCheckins: number;
  currentStreak: number;
  trend: "up" | "down" | "stable";
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-slate-500",
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-pink-500"
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `${colors[hash % colors.length]} text-white`;
}

function formatRelationship(rel: string): string {
  const labels: Record<string, string> = {
    HEAD: "Head of Family",
    SPOUSE: "Spouse",
    CHILD: "Child",
    PARENT: "Parent",
    SIBLING: "Sibling"
  };
  return labels[rel] ?? rel;
}

export default async function PastorMemberDetailPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "PASTOR" || !session.churchId || !session.memberId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();

  // Get pastor profile and assigned branches
  const { data: profileData, error: profileError } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", session.churchId)
    .eq("member_id", session.memberId)
    .maybeSingle();

  if (profileError || !profileData) notFound();

  const profile = profileData as { id: string };

  const { data: assignments } = await supabase
    .from("pastor_branch")
    .select("branch_id")
    .eq("pastor_profile_id", profile.id);

  const branchIds = ((assignments ?? []) as { branch_id: string }[])
    .map((row) => row.branch_id)
    .filter((id): id is string => Boolean(id));

  if (branchIds.length === 0) notFound();

  // Fetch member data (only if in assigned branches)
  const [
    { data: memberData, error: memberError },
    { data: familyMemberships, error: familyError },
    { data: groupMemberships, error: groupError },
    { data: cellGroupMemberships, error: cellGroupError },
    { data: attendanceData, error: attendanceError }
  ] = await Promise.all([
    supabase
      .from("member")
      .select("id, first_name, last_name, email, phone, status, joined_date, date_of_birth, baptism_date, address_line1, address_line2, city, state_county, postcode, country, branch:branch_id (id, name)")
      .eq("church_id", session.churchId)
      .eq("id", params.memberId)
      .in("branch_id", branchIds)
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
      .select("id, role, joined_at, archived_at, group:group_id (id, name, status)")
      .eq("member_id", params.memberId)
      .eq("church_id", session.churchId)
      .is("archived_at", null),
    supabase
      .from("meeting_attendance")
      .select(`
        id,
        status,
        recorded_at,
        meeting:meeting_id (
          id,
          meeting_date,
          start_time,
          topic,
          status,
          group:group_id (
            id,
            name,
            branch:branch_id (id, name)
          )
        )
      `)
      .eq("member_id", params.memberId)
      .eq("church_id", session.churchId)
      .in("status", ["PRESENT", "LATE"])
      .order("recorded_at", { ascending: false })
  ]);

  if (memberError || familyError || groupError || cellGroupError || attendanceError || !memberData) {
    console.error("Failed to load member", memberError ?? familyError ?? groupError ?? cellGroupError ?? attendanceError);
    notFound();
  }

  type MemberRow = Database["public"]["Tables"]["member"]["Row"];
  type BranchRow = Database["public"]["Tables"]["branch"]["Row"];
  type MemberRecord = Pick<
    MemberRow,
    "id" | "first_name" | "last_name" | "email" | "phone" | "status" | "joined_date" | "date_of_birth" | "baptism_date" | "address_line1" | "address_line2" | "city" | "state_county" | "postcode" | "country"
  > & { branch: Pick<BranchRow, "id" | "name"> | null };

  type FamilyMemberRow = Database["public"]["Tables"]["family_member"]["Row"];
  type FamilyRow = Database["public"]["Tables"]["family"]["Row"];
  type FamilyMembershipRecord = Pick<FamilyMemberRow, "id" | "relationship"> & {
    family: Pick<FamilyRow, "id" | "family_name"> | null;
  };
  type GroupMemberRow = Database["public"]["Tables"]["group_member"]["Row"];
  type GroupRow = Database["public"]["Tables"]["group"]["Row"];
  type CellGroupMemberRow = Database["public"]["Tables"]["cell_group_member"]["Row"];
  type CellGroupRow = Database["public"]["Tables"]["cell_group"]["Row"];

  const member = memberData as unknown as MemberRecord;
  const fams = (familyMemberships ?? []) as unknown as FamilyMembershipRecord[];
  const groupMembershipRecords = (groupMemberships ?? []) as unknown as Array<
    Pick<GroupMemberRow, "id" | "joined_at"> & { group: Pick<GroupRow, "id" | "name" | "type"> | null }
  >;
  const cellGroupMembershipRecords = (cellGroupMemberships ?? []) as unknown as Array<
    Pick<CellGroupMemberRow, "id" | "role" | "joined_at" | "archived_at"> & { group: Pick<CellGroupRow, "id" | "name" | "status"> | null }
  >;
  const fullName = `${member.first_name} ${member.last_name}`;
  const basePath = `/${params.churchSlug}/pastor/members`;
  const branchName = member.branch?.name ?? "Unassigned";

  // Combine regular groups and cell groups
  const regularGroups: GroupCardItem[] = groupMembershipRecords.map((g) => ({
    id: g.id,
    groupId: g.group?.id ?? "",
    name: g.group?.name ?? "Group",
    type: (g.group?.type as GroupType) ?? "default",
    role: "Member",
    joinedDate: g.joined_at
  }));

  const cellGroups: GroupCardItem[] = cellGroupMembershipRecords
    .filter((g) => g.group?.status === "ACTIVE")
    .map((g) => ({
      id: g.id,
      groupId: g.group?.id ?? "",
      name: g.group?.name ?? "Cell Group",
      type: "default" as GroupType,
      role: g.role ?? "Member",
      joinedDate: g.joined_at
    }));

  const groups: GroupCardItem[] = [...regularGroups, ...cellGroups];

  // Process attendance data
  type AttendanceRecord = {
    id: string;
    status: string;
    recorded_at: string | null;
    meeting: {
      id: string;
      meeting_date: string;
      start_time: string | null;
      topic: string | null;
      status: string;
      group: {
        id: string;
        name: string;
        branch: { id: string; name: string } | null;
      } | null;
    } | null;
  };

  const attendanceRecords = (attendanceData ?? []) as unknown as AttendanceRecord[];

  const attendanceEntries: AttendanceEntry[] = attendanceRecords
    .filter((a) => a.meeting !== null)
    .map((a) => ({
      id: a.id,
      eventName: a.meeting?.topic || a.meeting?.group?.name || "Group Meeting",
      eventType: "group" as EventType,
      date: a.meeting?.meeting_date ?? "",
      checkInTime: a.recorded_at ?? a.meeting?.start_time ?? a.meeting?.meeting_date ?? "",
      branch: a.meeting?.group?.branch?.name
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate attendance stats
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const thisMonthAttendance = attendanceEntries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= thisMonthStart && entryDate <= thisMonthEnd;
  });

  // Calculate approximate total meetings this month (assuming weekly meetings for each group the member is in)
  const weeksThisMonth = Math.ceil((thisMonthEnd.getDate() - thisMonthStart.getDate() + 1) / 7);
  const estimatedTotalMeetings = groups.length * weeksThisMonth;

  // Calculate current streak (consecutive weeks with at least one attendance)
  let currentStreak = 0;
  if (attendanceEntries.length > 0) {
    const sortedDates = [...new Set(attendanceEntries.map((e) => e.date))]
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDates.length > 0) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Check if most recent attendance is within last week
      if (sortedDates[0] >= oneWeekAgo) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const daysDiff = (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff <= 14) {
            // Within 2 weeks gap means continuous streak
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
  }

  // Calculate trend (compare this month to last month)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthAttendance = attendanceEntries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= lastMonthStart && entryDate <= lastMonthEnd;
  });

  let trend: "up" | "down" | "stable" = "stable";
  if (thisMonthAttendance.length > lastMonthAttendance.length) {
    trend = "up";
  } else if (thisMonthAttendance.length < lastMonthAttendance.length) {
    trend = "down";
  }

  const attendanceStats: AttendanceStats = {
    lastAttendedDate: attendanceEntries.length > 0 ? attendanceEntries[0].date : null,
    thisMonthCount: thisMonthAttendance.length,
    thisMonthTotal: Math.max(estimatedTotalMeetings, thisMonthAttendance.length),
    totalCheckins: attendanceEntries.length,
    currentStreak,
    trend
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Mobile redesigned layout */}
      <div className="lg:hidden space-y-4 px-4 py-4">
        <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur">
          <Link href={basePath} className="-ml-2 p-2" aria-label="Back to members">
            <ChevronRight className="h-5 w-5 rotate-180 text-gray-700" />
          </Link>
          <h1 className="text-base font-semibold text-gray-900">Member Profile</h1>
          <button className="-mr-2 p-2" aria-label="Toggle theme">
            <Settings className="h-5 w-5 text-gray-500" />
          </button>
        </header>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className={`h-16 w-16 rounded-full ${getAvatarColor(fullName)} flex items-center justify-center text-xl font-semibold`}>
                {getInitials(fullName)}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
                <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>{member.status}</Badge>
              </div>
              <p className="text-sm text-gray-500">Member since {formatDate(member.joined_date)}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {branchName}
                </span>
                {member.date_of_birth ? (
                  <span className="flex items-center gap-1">
                    <Cake className="h-3.5 w-3.5" />
                    {formatDate(member.date_of_birth)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: "Call", icon: Phone, href: member.phone ? `tel:${member.phone}` : undefined },
              { label: "Email", icon: Mail, href: member.email ? `mailto:${member.email}` : undefined },
              { label: "Message", icon: Mail, href: member.email ? `mailto:${member.email}` : undefined },
              { label: "Edit", icon: Pencil, href: `${basePath}/${member.id}/edit` }
            ].map((action) => {
              const content = (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{action.label}</span>
                </div>
              );
              return action.href ? (
                <Link key={action.label} href={action.href} className="flex justify-center">
                  {content}
                </Link>
              ) : (
                <div key={action.label} className="opacity-50">
                  {content}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">{member.phone ?? "No phone"}</span>
            </div>
            {member.phone ? (
              <Link href={`tel:${member.phone}`} className="text-xs font-semibold text-blue-600">
                Call
              </Link>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">{member.email ?? "No email"}</span>
          </div>
          {(member.address_line1 || member.city || member.postcode) && (
            <div className="flex items-start gap-3 pt-2 border-t">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="text-sm text-gray-900">
                {member.address_line1 && <p>{member.address_line1}</p>}
                {member.address_line2 && <p>{member.address_line2}</p>}
                <p>
                  {[member.city, member.state_county, member.postcode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="text-gray-500">
                  {member.country === "IN" ? "India" : "United Kingdom"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="mb-2 flex items-center gap-2 text-gray-500">
                <CalendarCheck className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Attendance</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {attendanceStats.thisMonthTotal
                    ? Math.round((attendanceStats.thisMonthCount / attendanceStats.thisMonthTotal) * 100)
                    : 0}
                  %
                </span>
                <span className="text-sm text-gray-500">
                  ({attendanceStats.thisMonthCount}/{attendanceStats.thisMonthTotal})
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Last: {attendanceStats.lastAttendedDate ? formatDate(attendanceStats.lastAttendedDate) : "Never"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="mb-2 flex items-center gap-2 text-gray-500">
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Groups</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{groups.length}</span>
                <span className="text-sm text-gray-500">active</span>
              </div>
              <Button variant="link" size="sm" className="px-0 text-xs text-blue-600" asChild>
                <Link href={`/${params.churchSlug}/pastor/cell-groups`}>Join group</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Family Members</h3>
            <Button variant="link" size="sm" className="px-0 text-blue-600" asChild>
              <Link href={`${basePath}/${member.id}/families`}>Manage</Link>
            </Button>
          </div>
          {fams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No family linked yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {fams.map((membership) => {
                const familyName = membership.family?.family_name ?? "Family";
                const relationship = membership.relationship ?? "";
                return (
                  <button
                    key={membership.id}
                    type="button"
                    className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                        {getInitials(familyName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{familyName}</p>
                        <span
                          className={cn(
                            "text-xs",
                            relationship === "HEAD" ? "text-blue-600 font-semibold uppercase" : "text-gray-500 capitalize"
                          )}
                        >
                          {relationship === "HEAD" ? "HEAD" : relationship.toLowerCase() || "Member"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop view (unchanged) */}
      <div className="container mx-auto hidden max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:block lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={basePath} className="transition-colors hover:text-foreground">
            Members
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{fullName}</span>
        </nav>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarFallback className={getAvatarColor(fullName)}>{getInitials(fullName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold leading-tight">{fullName}</h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>{member.status}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {branchName}
              </span>
            </div>
          </div>

          <div className="flex flex-col w-full gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-2">
            <Button asChild className="justify-center">
              <Link href={`${basePath}/${member.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" className="justify-center">
              <Mail className="mr-2 h-4 w-4" />
              Message
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="self-center">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Change status</DropdownMenuItem>
                <DropdownMenuItem>Move to branch</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Delete member</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">Contact</p>
                    <div className="space-y-3">
                      {member.email ? (
                        <ContactField icon={Mail} label="Email" value={member.email} href={`mailto:${member.email}`} />
                      ) : (
                        <InfoField icon={Mail} label="Email" value={null} />
                      )}
                      {member.phone ? (
                        <ContactField icon={Phone} label="Phone" value={member.phone} href={`tel:${member.phone}`} />
                      ) : (
                        <InfoField icon={Phone} label="Phone" value={null} />
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">Church</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <InfoField icon={MapPin} label="Branch" value={branchName} />
                      <InfoField icon={Calendar} label="Joined" value={formatDate(member.joined_date)} />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">Personal</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <InfoField icon={Cake} label="Birth date" value={formatDate(member.date_of_birth)} />
                      <InfoField icon={Droplets} label="Baptism date" value={formatDate(member.baptism_date)} />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">Address</p>
                    {member.address_line1 || member.city || member.postcode ? (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                          {member.address_line1 && <p className="text-sm font-medium">{member.address_line1}</p>}
                          {member.address_line2 && <p className="text-sm">{member.address_line2}</p>}
                          <p className="text-sm">
                            {[member.city, member.state_county, member.postcode]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.country === "IN" ? "India" : "United Kingdom"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="text-sm font-medium">
                            <span className="italic text-muted-foreground">Not provided</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Groups</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {groups.length}
                  </Badge>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add to group
                </Button>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">Not part of any groups yet</p>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add to group
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groups.map((group) => (
                      <Link key={group.id} href={`/${params.churchSlug}/pastor/cell-groups/${group.groupId}`} className="block">
                        <div className="group flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:border-primary/20 hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getGroupTypeStyles(group.type)}`}>
                              {getGroupTypeIcon(group.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{group.name}</p>
                                <Badge variant={getRoleBadgeVariant(group.role)} className="text-xs">
                                  {group.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">Joined {formatDate(group.joinedDate)}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Attendance</CardTitle>
                <Button variant="ghost" size="sm">
                  View full history
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard icon={Calendar} label="Last attended" value={attendanceStats.lastAttendedDate ? formatDate(attendanceStats.lastAttendedDate) : "Not yet"} />
                  <StatCard icon={CalendarCheck} label="This month" value={`${attendanceStats.thisMonthCount} of ${attendanceStats.thisMonthTotal}`} />
                  <StatCard icon={CheckCircle} label="Total check-ins" value={attendanceStats.totalCheckins.toString()} />
                  <StatCard icon={Flame} label="Current streak" value={`${attendanceStats.currentStreak} weeks`} />
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {attendanceStats.trend === "up" && (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Increasing</span>
                    </>
                  )}
                  {attendanceStats.trend === "down" && (
                    <>
                      <TrendingDown className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-600">Declining</span>
                    </>
                  )}
                  {attendanceStats.trend === "stable" && (
                    <>
                      <Minus className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Stable</span>
                    </>
                  )}
                </div>

                <AttendanceList entries={attendanceEntries} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Family</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`${basePath}/${member.id}/families`}>Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {fams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No family linked yet.</p>
              ) : (
                <div className="space-y-3">
                  {fams.map((membership) => {
                    const familyName = membership.family?.family_name ?? "Family";
                    const relationship = membership.relationship ?? "";
                    return (
                      <div
                        key={membership.id}
                        className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                          relationship === "HEAD" ? "border-primary/40 bg-primary/5" : ""
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            {familyName}
                            <span className="ml-2 text-sm font-normal text-muted-foreground">(family)</span>
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs font-normal">
                            {formatRelationship(relationship)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 lg:hidden">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <Link href={`${basePath}/${member.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" className="flex-1">
              <Mail className="mr-2 h-4 w-4" />
              Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactField({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: string; href: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <a href={href} className="text-sm font-medium transition-colors hover:text-primary hover:underline">
          {value}
        </a>
      </div>
    </div>
  );
}

function InfoField({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | null }) {
  const display = value && value !== "—" ? value : null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">
          {display ? (
            display
          ) : (
            <span className="italic text-muted-foreground">Not provided</span>
          )}
        </p>
      </div>
    </div>
  );
}

function getGroupTypeIcon(type: GroupType): JSX.Element {
  const icons: Record<GroupType, LucideIcon> = {
    worship: Music,
    bible_study: BookOpen,
    youth: Users,
    outreach: Heart,
    prayer: HandHeart,
    pastoral: Users,
    admin: Settings,
    default: Users
  };
  const Icon = icons[type] ?? icons.default;
  return <Icon className="h-5 w-5" />;
}

function getGroupTypeStyles(type: GroupType): string {
  const styles: Record<GroupType, string> = {
    worship: "bg-purple-100 text-purple-700",
    bible_study: "bg-blue-100 text-blue-700",
    youth: "bg-green-100 text-green-700",
    outreach: "bg-pink-100 text-pink-700",
    prayer: "bg-amber-100 text-amber-700",
    pastoral: "bg-teal-100 text-teal-700",
    admin: "bg-slate-100 text-slate-700",
    default: "bg-gray-100 text-gray-700"
  };
  return styles[type] ?? styles.default;
}

function getRoleBadgeVariant(role: string): "default" | "secondary" {
  const lowered = role.toLowerCase();
  if (lowered === "leader" || lowered === "coordinator") return "default";
  return "secondary";
}

function getEventTypeIcon(type: EventType): JSX.Element {
  const icons: Record<EventType, LucideIcon> = {
    sunday_service: Church,
    midweek: BookOpen,
    prayer: HandHeart,
    group: Users,
    event: Calendar,
    default: CheckCircle
  };
  const Icon = icons[type] ?? icons.default;
  return <Icon className="h-4 w-4" />;
}

function getEventTypeStyles(type: EventType): string {
  const styles: Record<EventType, string> = {
    sunday_service: "bg-blue-100 text-blue-700",
    midweek: "bg-purple-100 text-purple-700",
    prayer: "bg-amber-100 text-amber-700",
    group: "bg-green-100 text-green-700",
    event: "bg-pink-100 text-pink-700",
    default: "bg-gray-100 text-gray-700"
  };
  return styles[type] ?? styles.default;
}

function formatDay(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { weekday: "long" });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
