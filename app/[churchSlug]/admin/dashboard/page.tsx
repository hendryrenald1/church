import { addDays, differenceInCalendarDays, differenceInDays, differenceInHours, differenceInMinutes, endOfMonth, format, isSameMonth, startOfDay } from "date-fns";
import { AlertTriangle, Building, Cake, Droplet, Edit, Heart, Home, List, Settings, UserCheck, UserPlus, UserX, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ActionItemsSection, type ActionItem } from "./_components/action-items-section";
import { BranchOverviewWidget, type BranchSnapshot } from "./_components/branch-overview-widget";
import { QuickActionsGrid, type QuickAction } from "./_components/quick-actions-grid";
import { QuickStatsWidget, type QuickStats } from "./_components/quick-stats-widget";
import { RecentActivityTimeline, type RecentActivity } from "./_components/recent-activity-timeline";
import { StatCard } from "./_components/stat-card";
import { UpcomingEventsWidget, type UpcomingEvent } from "./_components/upcoming-events-widget";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type MemberRow = Database["public"]["Tables"]["member"]["Row"];
type FamilyRow = Database["public"]["Tables"]["family"]["Row"];
type BranchRow = Database["public"]["Tables"]["branch"]["Row"];
type PastorRow = Database["public"]["Tables"]["pastor_profile"]["Row"];
type PastorBranchRow = Database["public"]["Tables"]["pastor_branch"]["Row"];
type ActivityLogRow = Database["public"]["Tables"]["activity_log"]["Row"];

export default async function AdminDashboardPage({ params }: { params: { churchSlug: string } }) {
  const session = await getSessionUser();
  if (!session) redirect("/auth/login");
  if (session.role !== "ADMIN" || !session.churchId) notFound();
  if (session.churchSlug && session.churchSlug !== params.churchSlug) notFound();

  const supabase = createSupabaseAdminClient();
  const churchId = session.churchId;
  const [churchRes, membersRes, familiesRes, branchesRes, pastorsRes, pastorBranchesRes] = await Promise.all([
    supabase.from("church").select("name").eq("id", churchId).single(),
    supabase
      .from("member")
      .select("id, first_name, last_name, status, email, phone, branch_id, date_of_birth, baptism_date, created_at")
      .eq("church_id", churchId),
    supabase.from("family").select("id, family_name, wedding_anniversary, created_at").eq("church_id", churchId),
    supabase.from("branch").select("id, name, city, is_active, created_at").eq("church_id", churchId),
    supabase.from("pastor_profile").select("id, created_at").eq("church_id", churchId),
    supabase.from("pastor_branch").select("id, branch_id").eq("church_id", churchId)
  ]);

  const errors = [churchRes.error, membersRes.error, familiesRes.error, branchesRes.error, pastorsRes.error, pastorBranchesRes.error].filter(Boolean);
  if (errors.length) {
    console.error("Dashboard load failed", errors[0]);
    throw new Error("Failed to load dashboard data");
  }

  const members = membersRes.data ?? [];
  const families = familiesRes.data ?? [];
  const branches = branchesRes.data ?? [];
  const pastors = pastorsRes.data ?? [];
  const pastorBranches = pastorBranchesRes.data ?? [];

  const today = startOfDay(new Date());
  const birthdaysNextWeek = getUpcomingBirthdays(members, today, 7);
  const anniversariesNextTwoWeeks = getUpcomingAnniversaries(families, today, 14);
  const anniversariesNextWeek = anniversariesNextTwoWeeks.filter((ann) => differenceInCalendarDays(ann.date, today) <= 7);
  const baptismsThisMonth = getBaptismsBetween(members, today, endOfMonth(today));
  const baptismsNextWeek = baptismsThisMonth.filter((baptism) => differenceInCalendarDays(baptism.date, today) <= 7);

  const churchName = churchRes.data?.name ?? params.churchSlug;
  const metadata = session.user.user_metadata as Record<string, unknown>;
  const adminName =
    (typeof metadata?.["full_name"] === "string" ? (metadata["full_name"] as string) : undefined) ??
    (typeof metadata?.["first_name"] === "string" ? (metadata["first_name"] as string) : undefined) ??
    "Admin";

  const basePath = `/${params.churchSlug}/admin`;

  const branchSparkline = buildMonthlySparkline(branches);
  const pastorSparkline = buildMonthlySparkline(pastors);
  const memberSparkline = buildMonthlySparkline(members);
  const familySparkline = buildMonthlySparkline(families);

  const statCards = [
    {
      icon: Building,
      label: "Branches",
      value: branches.length,
      ...summarizeTrend(branchSparkline),
      color: "bg-purple-500",
      sparklineData: branchSparkline,
      href: `${basePath}/branches`
    },
    {
      icon: Users,
      label: "Pastors",
      value: pastors.length,
      ...summarizeTrend(pastorSparkline),
      color: "bg-green-500",
      sparklineData: pastorSparkline,
      href: `${basePath}/pastors`
    },
    {
      icon: UserCheck,
      label: "Members",
      value: members.length,
      ...summarizeTrend(memberSparkline),
      color: "bg-blue-500",
      breakdown: buildMemberBreakdown(members),
      sparklineData: memberSparkline,
      href: `${basePath}/members`
    },
    {
      icon: Home,
      label: "Families",
      value: families.length,
      ...summarizeTrend(familySparkline),
      color: "bg-orange-500",
      sparklineData: familySparkline,
      href: `${basePath}/families`
    }
  ] as const;

  const actionItems = buildActionItems({
    birthdays: birthdaysNextWeek,
    anniversaries: anniversariesNextTwoWeeks,
    missingContacts: members.filter((member) => !member.email || !member.phone),
    upcomingBaptisms: baptismsThisMonth,
    inactiveMembers: members.filter((member) => member.status === "INACTIVE"),
    basePath
  });

  const quickActions = buildQuickActions(basePath);
  const upcomingEvents = buildUpcomingEvents({
    birthdays: birthdaysNextWeek,
    anniversaries: anniversariesNextWeek,
    baptisms: baptismsNextWeek,
    basePath
  });
  const branchSnapshots = buildBranchSnapshots(branches, members, pastorBranches, basePath);
  const quickStats = buildQuickStats(members, families, today);
  const recentActivities = await getRecentActivities(supabase, churchId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {adminName}! 👋</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening at {churchName} today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ActionItemsSection items={actionItems} />
          <QuickActionsGrid actions={quickActions} />
          <RecentActivityTimeline activities={recentActivities} viewAllHref={`${basePath}/activity-log`} />
        </div>
        <div className="space-y-6">
          <UpcomingEventsWidget events={upcomingEvents} viewCalendarHref={`${basePath}/calendar`} />
          {branchSnapshots.length > 1 ? (
            <div className="hidden md:block">
              <BranchOverviewWidget branches={branchSnapshots} />
            </div>
          ) : null}
          <QuickStatsWidget stats={quickStats} />
        </div>
      </div>
    </div>
  );
}

function buildMemberBreakdown(members: MemberRow[]) {
  const active = members.filter((member) => member.status === "ACTIVE").length;
  const inactive = members.length - active;
  return `${active} active, ${inactive} inactive`;
}

function buildMonthlySparkline(rows: { created_at: string | null }[], months = 6) {
  const now = new Date();
  const counts = Array.from({ length: months }, () => 0);
  rows.forEach((row) => {
    if (!row.created_at) return;
    const created = new Date(row.created_at);
    if (Number.isNaN(created.getTime())) return;
    const monthDiff = now.getFullYear() * 12 + now.getMonth() - (created.getFullYear() * 12 + created.getMonth());
    if (monthDiff < 0 || monthDiff >= months) return;
    const index = months - monthDiff - 1;
    counts[index] += 1;
  });
  return counts;
}

function summarizeTrend(data: number[]) {
  if (data.length < 2) {
    return { trend: null, trendUp: undefined };
  }
  const current = data[data.length - 1];
  const previous = data[data.length - 2];
  const diff = current - previous;
  if (diff === 0) {
    return { trend: "No change", trendUp: true };
  }
  const trendUp = diff >= 0;
  const trendValue = `${diff > 0 ? "+" : ""}${diff} this month`;
  return { trend: trendValue, trendUp };
}

interface UpcomingMemberEvent {
  id: string;
  name: string;
  date: Date;
  member: MemberRow;
}

interface UpcomingAnniversary {
  id: string;
  familyName: string;
  date: Date;
  family: FamilyRow;
}

interface UpcomingBaptism {
  id: string;
  name: string;
  date: Date;
  member: MemberRow;
}

function getUpcomingBirthdays(members: MemberRow[], reference: Date, daysAhead: number): UpcomingMemberEvent[] {
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
    .filter((entry): entry is UpcomingMemberEvent => Boolean(entry))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getUpcomingAnniversaries(families: FamilyRow[], reference: Date, daysAhead: number): UpcomingAnniversary[] {
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
    .filter((entry): entry is UpcomingAnniversary => Boolean(entry))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getBaptismsBetween(members: MemberRow[], start: Date, end: Date): UpcomingBaptism[] {
  return members
    .map((member) => {
      if (!member.baptism_date) return null;
      const baptismDate = new Date(member.baptism_date);
      if (Number.isNaN(baptismDate.getTime())) return null;
      if (baptismDate < start || baptismDate > end) return null;
      return {
        id: `${member.id}-${baptismDate.toISOString()}`,
        name: formatFullName(member.first_name, member.last_name),
        date: baptismDate,
        member
      };
    })
    .filter((entry): entry is UpcomingBaptism => Boolean(entry))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
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

function formatFullName(first: string, last: string) {
  return [first, last].filter(Boolean).join(" ");
}

function buildActionItems({
  birthdays,
  anniversaries,
  missingContacts,
  upcomingBaptisms,
  inactiveMembers,
  basePath
}: {
  birthdays: UpcomingMemberEvent[];
  anniversaries: UpcomingAnniversary[];
  missingContacts: MemberRow[];
  upcomingBaptisms: UpcomingBaptism[];
  inactiveMembers: MemberRow[];
  basePath: string;
}): ActionItem[] {
  const nextBirthday = birthdays[0];
  const nextAnniversary = anniversaries[0];
  const birthdayDetail = nextBirthday ? `${nextBirthday.name} on ${format(nextBirthday.date, "MMM d")}` : "TBD";
  const anniversaryDetail = nextAnniversary ? `${nextAnniversary.familyName} - ${format(nextAnniversary.date, "MMM d")}` : "TBD";
  return [
    {
      id: "birthdays",
      icon: Cake,
      message: birthdays.length
        ? `${birthdays.length} birthday${birthdays.length === 1 ? "" : "s"} this week (next: ${birthdayDetail})`
        : "No birthdays this week",
      actionLabel: "View",
      href: `${basePath}/members?filter=birthdays`
    },
    {
      id: "anniversaries",
      icon: Heart,
      message: anniversaries.length
        ? `${anniversaries.length} anniversar${anniversaries.length === 1 ? "y" : "ies"} coming up (${anniversaryDetail})`
        : "No anniversaries in the next 2 weeks",
      actionLabel: "Send wishes",
      href: `${basePath}/families?filter=anniversaries`
    },
    {
      id: "missing-data",
      icon: AlertTriangle,
      message: `${missingContacts.length} member${missingContacts.length === 1 ? "" : "s"} missing contact info`,
      actionLabel: "Update",
      href: `${basePath}/members?filter=incomplete`,
      variant: "warning"
    },
    {
      id: "baptisms",
      icon: Droplet,
      message: upcomingBaptisms.length
        ? `${upcomingBaptisms.length} baptism${upcomingBaptisms.length === 1 ? "" : "s"} scheduled this month`
        : "No baptisms scheduled this month",
      actionLabel: "Manage",
      href: `${basePath}/members?filter=baptisms`,
      variant: "success"
    },
    {
      id: "inactive-members",
      icon: UserX,
      message: `${inactiveMembers.length} inactive member${inactiveMembers.length === 1 ? "" : "s"} need follow-up`,
      actionLabel: "Review",
      href: `${basePath}/members?status=INACTIVE`,
      variant: "destructive"
    }
  ];
}

function buildQuickActions(basePath: string): QuickAction[] {
  return [
    {
      id: "add-member",
      title: "Add New Member",
      description: "Register someone to the church",
      icon: UserPlus,
      bgColor: "bg-blue-500",
      href: `${basePath}/members/new`
    },
    {
      id: "add-branch",
      title: "Add Branch",
      description: "Create new campus location",
      icon: Building,
      bgColor: "bg-purple-500",
      href: `${basePath}/branches/new`
    },
    {
      id: "add-pastor",
      title: "Add Pastor",
      description: "Register pastoral staff",
      icon: Users,
      bgColor: "bg-green-500",
      href: `${basePath}/pastors/new`
    },
    {
      id: "create-family",
      title: "Create Family",
      description: "Link members into families",
      icon: Home,
      bgColor: "bg-orange-500",
      href: `${basePath}/families/new`
    },
    {
      id: "view-members",
      title: "View All Members",
      description: "Browse complete directory",
      icon: List,
      bgColor: "bg-indigo-500",
      href: `${basePath}/members`
    },
    {
      id: "settings",
      title: "Church Settings",
      description: "Manage church profile",
      icon: Settings,
      bgColor: "bg-gray-500",
      href: `${basePath}/settings/church`
    }
  ];
}

function buildUpcomingEvents({
  birthdays,
  anniversaries,
  baptisms,
  basePath
}: {
  birthdays: UpcomingMemberEvent[];
  anniversaries: UpcomingAnniversary[];
  baptisms: UpcomingBaptism[];
  basePath: string;
}): UpcomingEvent[] {
  type TimelineEvent = UpcomingEvent & { eventDate: Date };
  const events: TimelineEvent[] = [
    ...birthdays.map((event) => ({
      eventDate: event.date,
      id: `birthday-${event.id}`,
      dayOfWeek: format(event.date, "EEE").toUpperCase(),
      dateDisplay: format(event.date, "d"),
      type: "Birthday",
      title: event.name,
      description: "Send a birthday wish",
      badgeClassName: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
      icon: Cake,
      href: `${basePath}/members/${event.member.id}`
    })),
    ...anniversaries.map((event) => ({
      eventDate: event.date,
      id: `anniversary-${event.id}`,
      dayOfWeek: format(event.date, "EEE").toUpperCase(),
      dateDisplay: format(event.date, "d"),
      type: "Anniversary",
      title: event.familyName,
      description: "Celebrate this family milestone",
      badgeClassName: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
      icon: Heart,
      href: `${basePath}/families/${event.family.id}`
    })),
    ...baptisms.map((event) => ({
      eventDate: event.date,
      id: `baptism-${event.id}`,
      dayOfWeek: format(event.date, "EEE").toUpperCase(),
      dateDisplay: format(event.date, "d"),
      type: "Baptism",
      title: event.name,
      description: "Confirm schedule and prep",
      badgeClassName: "bg-green-500/15 text-green-600 dark:text-green-300",
      icon: Droplet,
      href: `${basePath}/members/${event.member.id}`
    }))
  ];

  return events
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
    .slice(0, 5)
    .map(({ eventDate, ...rest }) => rest);
}

function buildBranchSnapshots(
  branches: BranchRow[],
  members: MemberRow[],
  pastorBranches: PastorBranchRow[],
  basePath: string
): BranchSnapshot[] {
  const activeBranches = branches.filter((branch) => branch.is_active);
  return activeBranches.map((branch) => {
    const memberCount = members.filter((member) => member.branch_id === branch.id).length;
    const pastorCount = pastorBranches.filter((entry) => entry.branch_id === branch.id).length;
    return {
      id: branch.id,
      name: branch.name,
      city: branch.city,
      memberCount,
      pastorCount,
      href: `${basePath}/branches/${branch.id}`
    };
  });
}

function buildQuickStats(members: MemberRow[], families: FamilyRow[], reference: Date): QuickStats {
  const birthdaysThisMonth = members.filter((member) => occursThisMonth(member.date_of_birth, reference)).length;
  const anniversariesThisMonth = families.filter((family) => occursThisMonth(family.wedding_anniversary, reference)).length;
  const baptismsYTD = members.filter((member) => {
    if (!member.baptism_date) return false;
    const date = new Date(member.baptism_date);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === reference.getFullYear();
  }).length;
  const incompleteProfiles = members.filter((member) => !member.email || !member.phone).length;
  return { birthdaysThisMonth, anniversariesThisMonth, baptismsYTD, incompleteProfiles };
}

function occursThisMonth(dateString: string | null, reference: Date) {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  return date.getMonth() === reference.getMonth();
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
  member_updated: { icon: Edit, iconBg: "bg-orange-500", fallbackDescription: "Member information updated" },
  family_created: { icon: Home, iconBg: "bg-purple-500", fallbackDescription: "Family created" },
  baptism_scheduled: { icon: Droplet, iconBg: "bg-blue-500", fallbackDescription: "Baptism scheduled" },
  pastor_assigned: { icon: Users, iconBg: "bg-emerald-600", fallbackDescription: "Pastor assigned" },
  branch_created: { icon: Building, iconBg: "bg-purple-600", fallbackDescription: "Branch added" }
};

async function getRecentActivities(supabase: ReturnType<typeof createSupabaseAdminClient>, churchId: string): Promise<RecentActivity[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, activity_type, title, description, created_at")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.warn("Recent activity fetch failed", error);
    return [];
  }

  const rows = (data as ActivityLogRow[] | null) ?? [];
  return rows.map((activity) => {
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
