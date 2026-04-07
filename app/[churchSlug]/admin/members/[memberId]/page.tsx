import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default async function AdminMemberDetailPage({ params }: Props) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const [
    { data: memberData, error: memberError },
    { data: familyMemberships, error: familyError },
    { data: groupMemberships, error: groupError }
  ] = await Promise.all([
    supabase
      .from("member")
      .select("id, first_name, last_name, email, phone, status, joined_date, date_of_birth, baptism_date, address_line1, address_line2, city, state_county, postcode, country, branch:branch_id (id, name)")
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
      .eq("church_id", session.churchId)
  ]);

  if (memberError || familyError || groupError || !memberData) {
    console.error("Failed to load member", memberError ?? familyError ?? groupError);
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

  const member = memberData as unknown as MemberRecord;
  const fams = (familyMemberships ?? []) as unknown as FamilyMembershipRecord[];
  const groupMembershipRecords = (groupMemberships ?? []) as unknown as Array<
    Pick<GroupMemberRow, "id" | "joined_at"> & { group: Pick<GroupRow, "id" | "name" | "type"> | null }
  >;
  const fullName = `${member.first_name} ${member.last_name}`;
  const basePath = `/${params.churchSlug}/admin/members`;
  const branchName = member.branch?.name ?? "Unassigned";

  const groups: GroupCardItem[] = groupMembershipRecords.map((g) => ({
    id: g.id,
    groupId: g.group?.id ?? "",
    name: g.group?.name ?? "Group",
    type: (g.group?.type as GroupType) ?? "default",
    role: "Member",
    joinedDate: g.joined_at
  }));

  const attendanceEntries: AttendanceEntry[] = [];
  const attendanceStats: AttendanceStats = {
    lastAttendedDate: null,
    thisMonthCount: 0,
    thisMonthTotal: 0,
    totalCheckins: attendanceEntries.length,
    currentStreak: 0,
    trend: "stable"
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
                      <Link key={group.id} href={`/${params.churchSlug}/admin/groups/${group.groupId}`} className="block">
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

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="sunday_service">Sunday Services</TabsTrigger>
                    <TabsTrigger value="group">Groups</TabsTrigger>
                    <TabsTrigger value="event">Events</TabsTrigger>
                  </TabsList>
                </Tabs>

                {attendanceEntries.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <CalendarX className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No attendance records yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Check-ins will appear here when recorded.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attendanceEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${getEventTypeStyles(entry.eventType)}`}>
                            {getEventTypeIcon(entry.eventType)}
                          </div>
                          <div>
                            <p className="font-medium">{entry.eventName}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.branch ? `${entry.branch} • ` : ""}
                              {formatTime(entry.checkInTime)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDate(entry.date)}</p>
                          <p className="text-xs text-muted-foreground">{formatDay(entry.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                      <Link
                        key={membership.id}
                        href={`/${params.churchSlug}/admin/families/${membership.family?.id ?? ""}`}
                        className="block"
                      >
                        <div
                          className={`group flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:border-primary/30 hover:bg-muted/50 ${
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
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                        </div>
                      </Link>
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
