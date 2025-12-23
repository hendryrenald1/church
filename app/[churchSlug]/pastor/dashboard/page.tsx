import {
  differenceInCalendarDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays
} from "date-fns";
import {
  Building,
  Cake,
  ClipboardList,
  Edit,
  FileText,
  Heart,
  Home,
  MessageSquare,
  UserPlus,
  Users
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { WelcomeHeader } from "./_components/welcome-header";
import { MetricsCards } from "./_components/stat-card";
import { ActionItems, type ActionItem, type ActionItemPriority, type ActionItemType } from "./_components/action-items";
import { CellGroupsOverview, type CellGroupOverviewData, type CellGroupAlert } from "./_components/cell-groups-overview";
import { ThisWeekWidget, type UpcomingEvent, type EventType } from "./_components/this-week-widget";
import { BranchSnapshot, type BranchSnapshotData } from "./_components/branch-snapshot";
import { QuickStats, type QuickStatsData } from "./_components/quick-stats";
import { QuickActions, type QuickAction } from "./_components/quick-actions";
import { RecentActivity, type RecentActivityItem } from "./_components/recent-activity";

type MemberRow = Database["public"]["Tables"]["member"]["Row"];
type FamilyRow = Database["public"]["Tables"]["family"]["Row"];
type ActivityLogRow = Database["public"]["Tables"]["activity_log"]["Row"];

type BranchAssignment = {
  branch: {
    id: string;
    name: string | null;
    city: string | null;
  } | null;
};

type MemberSelect = {
  id: string;
  first_name: string;
  last_name: string;
  status: "ACTIVE" | "INACTIVE";
  email: string | null;
  phone: string | null;
  branch_id: string | null;
  date_of_birth: string | null;
  baptism_date: string | null;
  created_at: string;
};

type FamilySelect = {
  id: string;
  family_name: string | null;
  wedding_anniversary: string | null;
};

type CellGroupSelect = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  branch_id: string | null;
};

type CellGroupMemberSelect = {
  id: string;
  group_id: string;
  member_id: string;
  role: "LEADER" | "ASSISTANT" | "MEMBER";
};

export default async function PastorDashboardPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "PASTOR" || !session.churchId || !session.memberId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const churchId = session.churchId;

  // Get pastor profile
  const { data: profileData, error: profileError } = await supabase
    .from("pastor_profile")
    .select("id")
    .eq("church_id", churchId)
    .eq("member_id", session.memberId)
    .maybeSingle();

  if (profileError || !profileData) {
    console.error("Pastor profile missing", profileError);
    notFound();
  }

  const pastorProfileId = profileData.id;

  // Get branch assignments
  const { data: branchAssignments, error: branchError } = await supabase
    .from("pastor_branch")
    .select("branch:branch_id (id, name, city)")
    .eq("pastor_profile_id", pastorProfileId);

  if (branchError) throw new Error(branchError.message);

  const branches = (branchAssignments ?? []) as unknown as BranchAssignment[];
  const branchIds = branches
    .map((item) => item.branch?.id)
    .filter((id): id is string => Boolean(id));

  // Get pastor name from member table
  const { data: pastorMember } = await supabase
    .from("member")
    .select("first_name, last_name")
    .eq("id", session.memberId)
    .single();

  const pastorName = pastorMember
    ? [pastorMember.first_name, pastorMember.last_name].filter(Boolean).join(" ")
    : "Pastor";

  const basePath = `/${params.churchSlug}/pastor`;
  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 30);

  // If no branches assigned, show empty state
  if (branchIds.length === 0) {
    return (
      <div className="space-y-5 px-3 pt-2 pb-4 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
        <WelcomeHeader pastorName={pastorName} />
        <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 py-12 text-center">
          <Building className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">No Branches Assigned</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            You haven&apos;t been assigned to any branches yet. Please contact your church administrator to get branch assignments.
          </p>
        </div>
      </div>
    );
  }

  // Fetch all data in parallel
  const [
    membersRes,
    familiesRes,
    cellGroupsRes,
    cellGroupMembersRes,
    recentMeetingsRes,
    activityRes
  ] = await Promise.all([
    supabase
      .from("member")
      .select("id, first_name, last_name, status, email, phone, branch_id, date_of_birth, baptism_date, created_at")
      .eq("church_id", churchId)
      .in("branch_id", branchIds),
    supabase
      .from("family")
      .select("id, family_name, wedding_anniversary")
      .eq("church_id", churchId),
    supabase
      .from("cell_group")
      .select("id, name, status, branch_id")
      .eq("church_id", churchId)
      .in("branch_id", branchIds),
    supabase
      .from("cell_group_member")
      .select("id, group_id, member_id, role")
      .eq("church_id", churchId)
      .is("archived_at", null),
    supabase
      .from("cell_meeting")
      .select("id, group_id, meeting_date, status")
      .eq("church_id", churchId)
      .gte("meeting_date", subDays(today, 14).toISOString())
      .order("meeting_date", { ascending: false }),
    supabase
      .from("activity_log")
      .select("id, activity_type, title, description, created_at")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const members = (membersRes.data ?? []) as MemberSelect[];
  const families = (familiesRes.data ?? []) as FamilySelect[];
  const cellGroups = (cellGroupsRes.data ?? []) as CellGroupSelect[];
  const cellGroupMembers = (cellGroupMembersRes.data ?? []) as CellGroupMemberSelect[];
  const recentMeetings = recentMeetingsRes.data ?? [];

  // Filter cell group members to only those in pastor's cell groups
  const pastorGroupIds = new Set(cellGroups.map((g) => g.id));
  const filteredCellGroupMembers = cellGroupMembers.filter((m) => pastorGroupIds.has(m.group_id));

  // Calculate metrics
  const activeGroups = cellGroups.filter((g) => g.status === "ACTIVE");
  const newMembersCount = members.filter(
    (m) => new Date(m.created_at) >= thirtyDaysAgo
  ).length;

  // Calculate attendance (mock for now - would need meeting_attendance table)
  const totalCellGroupMembers = filteredCellGroupMembers.length;
  const attendancePercentage = totalCellGroupMembers > 0 ? 82 : 0; // Placeholder
  const attendedCount = Math.round((attendancePercentage / 100) * totalCellGroupMembers);

  const metrics = {
    members: members.length,
    membersTrend: null,
    cellGroups: activeGroups.length,
    cellGroupsTrend: null,
    attendancePercentage,
    attendanceFraction: `${attendedCount} / ${totalCellGroupMembers}`,
    newMembers: newMembersCount
  };

  // Build cell groups overview data
  const groupsNeedingAttention = buildGroupsNeedingAttention(
    cellGroups,
    filteredCellGroupMembers,
    members,
    recentMeetings
  );

  const cellGroupData: CellGroupOverviewData = {
    activeGroups: activeGroups.length,
    totalMembers: filteredCellGroupMembers.length,
    thisWeekAttendance: {
      attended: attendedCount,
      total: totalCellGroupMembers,
      percentage: attendancePercentage
    },
    newMembers: newMembersCount,
    groupsNeedingAttention
  };

  // Build action items
  const birthdaysThisWeek = getUpcomingBirthdays(members, today, 7);
  const anniversariesThisWeek = getUpcomingAnniversaries(families, today, 7);
  const inactiveMembers = members.filter((m) => m.status === "INACTIVE");
  const missingContacts = members.filter((m) => !m.email || !m.phone);
  const newMembersToWelcome = members.filter(
    (m) => new Date(m.created_at) >= subDays(today, 14)
  );

  const actionItems = buildActionItems({
    birthdays: birthdaysThisWeek,
    anniversaries: anniversariesThisWeek,
    inactiveMembers,
    missingContacts,
    newMembers: newMembersToWelcome,
    basePath
  });

  // Build upcoming events
  const upcomingEvents = buildUpcomingEvents({
    birthdays: birthdaysThisWeek,
    anniversaries: anniversariesThisWeek,
    basePath
  });

  // Build branch snapshots
  const branchSnapshots = buildBranchSnapshots(branches, members, basePath);

  // Build quick stats
  const quickStats = buildQuickStats(members, families, today);

  // Build quick actions
  const quickActions = buildQuickActions(basePath);

  // Build recent activities
  const recentActivities = buildRecentActivities(activityRes.data as ActivityLogRow[] | null);

  return (
    <div className="space-y-5 px-3 pt-2 pb-4 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
      <WelcomeHeader pastorName={pastorName} />

      <MetricsCards metrics={metrics} basePath={basePath} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ActionItems items={actionItems} />
          <CellGroupsOverview data={cellGroupData} basePath={basePath} />
          <QuickActions actions={quickActions} />
          <RecentActivity activities={recentActivities} />
        </div>

        <div className="space-y-6">
          <ThisWeekWidget events={upcomingEvents} />
          <BranchSnapshot branches={branchSnapshots} />
          <QuickStats stats={quickStats} />
        </div>
      </div>
    </div>
  );
}

// Helper functions

function formatFullName(first: string, last: string) {
  return [first, last].filter(Boolean).join(" ");
}

function getNextOccurrence(dateString: string | null, reference: Date) {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return null;
  const next = new Date(reference);
  next.setMonth(parsed.getMonth(), parsed.getDate());
  if (next < reference) {
    next.setFullYear(next.getFullYear() + 1);
  }
  return startOfDay(next);
}

interface BirthdayEntry {
  id: string;
  name: string;
  date: Date;
  member: MemberSelect;
}

function getUpcomingBirthdays(members: MemberSelect[], reference: Date, daysAhead: number): BirthdayEntry[] {
  return members
    .map((member) => {
      const nextDate = getNextOccurrence(member.date_of_birth, reference);
      if (!nextDate) return null;
      const diff = differenceInCalendarDays(nextDate, reference);
      if (diff < 0 || diff > daysAhead) return null;
      return {
        id: member.id,
        name: formatFullName(member.first_name, member.last_name),
        date: nextDate,
        member
      };
    })
    .filter((entry): entry is BirthdayEntry => Boolean(entry))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

interface AnniversaryEntry {
  id: string;
  familyName: string;
  date: Date;
  family: FamilySelect;
}

function getUpcomingAnniversaries(families: FamilySelect[], reference: Date, daysAhead: number): AnniversaryEntry[] {
  return families
    .map((family) => {
      const nextDate = getNextOccurrence(family.wedding_anniversary, reference);
      if (!nextDate) return null;
      const diff = differenceInCalendarDays(nextDate, reference);
      if (diff < 0 || diff > daysAhead) return null;
      return {
        id: family.id,
        familyName: family.family_name ?? "Unnamed Family",
        date: nextDate,
        family
      };
    })
    .filter((entry): entry is AnniversaryEntry => Boolean(entry))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function buildGroupsNeedingAttention(
  groups: CellGroupSelect[],
  cellGroupMembers: CellGroupMemberSelect[],
  allMembers: MemberSelect[],
  meetings: { id: string; group_id: string; meeting_date: string; status: string }[]
): CellGroupAlert[] {
  const alerts: CellGroupAlert[] = [];
  const membersById = new Map(allMembers.map((m) => [m.id, m]));

  for (const group of groups) {
    if (group.status !== "ACTIVE") continue;

    const groupMembers = cellGroupMembers.filter((m) => m.group_id === group.id);
    const leader = groupMembers.find((m) => m.role === "LEADER");
    const leaderMember = leader ? membersById.get(leader.member_id) : null;
    const leaderName = leaderMember
      ? formatFullName(leaderMember.first_name, leaderMember.last_name)
      : "Unknown";
    const leaderPhone = leaderMember?.phone ?? null;

    const groupMeetings = meetings.filter((m) => m.group_id === group.id);
    const hasRecentMeeting = groupMeetings.some(
      (m) => m.status === "HELD" && differenceInDays(new Date(), new Date(m.meeting_date)) <= 14
    );

    if (!hasRecentMeeting && groupMeetings.length === 0) {
      alerts.push({
        groupId: group.id,
        groupName: group.name,
        leaderName,
        leaderPhone,
        reason: "no_recent_meeting",
        severity: "warning"
      });
    }
  }

  return alerts.slice(0, 5);
}

function buildActionItems({
  birthdays,
  anniversaries,
  inactiveMembers,
  missingContacts,
  newMembers,
  basePath
}: {
  birthdays: BirthdayEntry[];
  anniversaries: AnniversaryEntry[];
  inactiveMembers: MemberSelect[];
  missingContacts: MemberSelect[];
  newMembers: MemberSelect[];
  basePath: string;
}): ActionItem[] {
  const items: ActionItem[] = [];

  if (birthdays.length > 0) {
    const next = birthdays[0];
    items.push({
      id: "birthdays",
      type: "birthday",
      title: `${birthdays.length} birthday${birthdays.length !== 1 ? "s" : ""} this week`,
      description: `Next: ${next.name} on ${format(next.date, "MMM d")}`,
      count: birthdays.length,
      priority: "medium",
      actionLabel: "Send wishes",
      actionHref: `${basePath}/members?filter=birthdays`
    });
  }

  if (anniversaries.length > 0) {
    const next = anniversaries[0];
    items.push({
      id: "anniversaries",
      type: "anniversary",
      title: `${anniversaries.length} anniversary${anniversaries.length !== 1 ? "ies" : ""} this week`,
      description: `Next: ${next.familyName} on ${format(next.date, "MMM d")}`,
      count: anniversaries.length,
      priority: "medium",
      actionLabel: "Send wishes",
      actionHref: `${basePath}/members?filter=anniversaries`
    });
  }

  if (newMembers.length > 0) {
    items.push({
      id: "new-members",
      type: "new_member",
      title: `${newMembers.length} new member${newMembers.length !== 1 ? "s" : ""} to welcome`,
      description: "Recently joined, may need pastoral contact",
      count: newMembers.length,
      priority: "high",
      actionLabel: "View",
      actionHref: `${basePath}/members?filter=new`
    });
  }

  if (inactiveMembers.length > 0) {
    items.push({
      id: "inactive",
      type: "inactive",
      title: `${inactiveMembers.length} inactive member${inactiveMembers.length !== 1 ? "s" : ""}`,
      description: "May need follow-up",
      count: inactiveMembers.length,
      priority: "high",
      actionLabel: "Review",
      actionHref: `${basePath}/members?status=INACTIVE`
    });
  }

  if (missingContacts.length > 0) {
    items.push({
      id: "missing-contacts",
      type: "missing_contact",
      title: `${missingContacts.length} member${missingContacts.length !== 1 ? "s" : ""} missing contact info`,
      description: "Missing phone or email",
      count: missingContacts.length,
      priority: "low",
      actionLabel: "Update",
      actionHref: `${basePath}/members?filter=incomplete`
    });
  }

  return items;
}

function buildUpcomingEvents({
  birthdays,
  anniversaries,
  basePath
}: {
  birthdays: BirthdayEntry[];
  anniversaries: AnniversaryEntry[];
  basePath: string;
}): UpcomingEvent[] {
  const events: (UpcomingEvent & { eventDate: Date })[] = [
    ...birthdays.slice(0, 3).map((entry) => ({
      id: `birthday-${entry.id}`,
      eventDate: entry.date,
      dayOfWeek: format(entry.date, "EEE").toUpperCase(),
      dateDisplay: format(entry.date, "d"),
      type: "birthday" as EventType,
      title: entry.name,
      description: "Send a birthday wish",
      href: `${basePath}/members/${entry.id}`
    })),
    ...anniversaries.slice(0, 2).map((entry) => ({
      id: `anniversary-${entry.id}`,
      eventDate: entry.date,
      dayOfWeek: format(entry.date, "EEE").toUpperCase(),
      dateDisplay: format(entry.date, "d"),
      type: "anniversary" as EventType,
      title: entry.familyName,
      description: "Celebrate this milestone",
      href: undefined
    }))
  ];

  return events
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
    .slice(0, 5)
    .map(({ eventDate, ...rest }) => rest);
}

function buildBranchSnapshots(
  branches: BranchAssignment[],
  members: MemberSelect[],
  basePath: string
): BranchSnapshotData[] {
  return branches
    .filter((b) => b.branch)
    .map((b) => {
      const branch = b.branch!;
      const memberCount = members.filter((m) => m.branch_id === branch.id).length;
      return {
        id: branch.id,
        name: branch.name ?? "Unnamed Branch",
        location: branch.city,
        memberCount,
        pastorCount: 1,
        href: `${basePath}/members?branch=${branch.id}`
      };
    });
}

function buildQuickStats(members: MemberSelect[], families: FamilySelect[], reference: Date): QuickStatsData {
  const birthdaysThisMonth = members.filter((m) => {
    if (!m.date_of_birth) return false;
    const date = new Date(m.date_of_birth);
    return date.getMonth() === reference.getMonth();
  }).length;

  const anniversariesThisMonth = families.filter((f) => {
    if (!f.wedding_anniversary) return false;
    const date = new Date(f.wedding_anniversary);
    return date.getMonth() === reference.getMonth();
  }).length;

  const baptismsYTD = members.filter((m) => {
    if (!m.baptism_date) return false;
    const date = new Date(m.baptism_date);
    return date.getFullYear() === reference.getFullYear();
  }).length;

  const incompleteProfiles = members.filter((m) => !m.email || !m.phone).length;

  return { birthdaysThisMonth, anniversariesThisMonth, baptismsYTD, incompleteProfiles };
}

function buildQuickActions(basePath: string): QuickAction[] {
  return [
    {
      id: "add-member",
      title: "Add Member",
      description: "Register new member",
      icon: UserPlus,
      bgColor: "bg-blue-500",
      href: `${basePath}/members/new`
    },
    {
      id: "view-members",
      title: "View Members",
      description: "Browse directory",
      icon: Users,
      bgColor: "bg-indigo-500",
      href: `${basePath}/members`
    },
    {
      id: "cell-groups",
      title: "Cell Groups",
      description: "Manage groups",
      icon: Home,
      bgColor: "bg-emerald-500",
      href: `${basePath}/cell-groups`
    },
    {
      id: "reports",
      title: "Reports",
      description: "View attendance",
      icon: FileText,
      bgColor: "bg-amber-500",
      href: `${basePath}/cell-groups`
    },
    {
      id: "messages",
      title: "Messages",
      description: "Send message",
      icon: MessageSquare,
      bgColor: "bg-purple-500",
      href: `${basePath}/members`
    },
    {
      id: "profile",
      title: "My Profile",
      description: "Update profile",
      icon: ClipboardList,
      bgColor: "bg-gray-500",
      href: `${basePath}/profile`
    }
  ];
}

const activityIconMap: Record<
  string,
  {
    icon: typeof UserPlus;
    iconBg: string;
    fallbackDescription: string;
  }
> = {
  member_added: { icon: UserPlus, iconBg: "bg-emerald-500", fallbackDescription: "New member added" },
  member_updated: { icon: Edit, iconBg: "bg-orange-500", fallbackDescription: "Member updated" },
  family_created: { icon: Home, iconBg: "bg-purple-500", fallbackDescription: "Family created" },
  attendance_recorded: { icon: Users, iconBg: "bg-blue-500", fallbackDescription: "Attendance recorded" }
};

function buildRecentActivities(activities: ActivityLogRow[] | null): RecentActivityItem[] {
  if (!activities) return [];

  return activities.map((activity) => {
    const mapEntry = activityIconMap[activity.activity_type ?? ""] ?? activityIconMap.member_updated;
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description ?? mapEntry.fallbackDescription,
      timeAgo: formatRelativeTime(activity.created_at),
      icon: mapEntry.icon,
      iconBg: mapEntry.iconBg
    };
  });
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) {
    const safeMinutes = Math.max(1, minutes);
    return `${safeMinutes} minute${safeMinutes === 1 ? "" : "s"} ago`;
  }
  const hours = differenceInHours(now, date);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = differenceInDays(now, date);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  return format(date, "MMM d");
}
