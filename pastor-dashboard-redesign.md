# Pastor Dashboard Redesign Instructions

## Project Context

You are working on a church membership management application built with:
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase
- **Architecture**: Multi-tenant with URL-based routing

The application has role-based dashboards. The Admin dashboard is feature-rich with actionable insights, visual hierarchy, and quick actions. The Pastor dashboard currently shows basic statistics and needs to be elevated to match the Admin experience while serving pastor-specific needs.

---

## Current Pastor Dashboard Issues

1. **Static statistics** - Shows numbers without context or actionability
2. **No visual hierarchy** - Flat, monochromatic design
3. **Missing personalisation** - Generic header, no warmth
4. **No action items** - Pastors can't see what needs their attention
5. **No quick actions** - Common tasks require navigation
6. **No activity feed** - No visibility into recent changes
7. **No calendar/schedule** - Missing upcoming events view

---

## Redesign Requirements

### 1. Header Section

Replace the current plain header with a personalised welcome:

```
Welcome back, Pastor [Name]!
Here's what's happening in your branches today.
```

Include:
- Current date display
- Last login indicator (optional)

### 2. Key Metrics Cards (Top Row)

Create 4 visually distinct stat cards with:
- **Icon** (use Lucide icons)
- **Metric label** and **large number**
- **Trend indicator** (e.g., "+3 this month" in green/red)
- **Mini sparkline** (optional, for trends)
- **Subtle background colours** to differentiate cards

Cards to include:
1. **My Members** - Total members across assigned branches
2. **Cell Groups** - Number of active cell groups in branches
3. **This Week's Attendance** - Attendance percentage with fraction
4. **New Members** - Count from last 30 days

### 3. Action Items Section (Priority)

This is the most important addition. Create an "Action Items" card that surfaces pastoral priorities:

```typescript
interface ActionItem {
  id: string;
  type: 'followup' | 'birthday' | 'anniversary' | 'inactive' | 'missing_contact' | 'care_needed';
  title: string;
  description: string;
  count?: number;
  priority: 'high' | 'medium' | 'low';
  actionLabel: string;
  actionHref: string;
}
```

Action items to track:
- **Birthdays this week** - Members with upcoming birthdays
- **Anniversaries this week** - Wedding/membership anniversaries
- **Members needing follow-up** - Inactive for 30+ days
- **Missing contact info** - Members without phone/email
- **Missed cell group attendance** - Members who missed 2+ consecutive meetings
- **New members to welcome** - Recently joined, need pastoral contact

Each item should have:
- Icon (colour-coded by type)
- Title and brief description
- Action button/link (e.g., "View →", "Send wishes →", "Update →")

### 4. Cell Groups Overview (Enhanced)

Keep the current structure but enhance:

```typescript
interface CellGroupOverview {
  activeGroups: number;
  totalMembers: number;
  thisWeekAttendance: {
    attended: number;
    total: number;
    percentage: number;
  };
  newMembers: number;
  groupsNeedingAttention: CellGroupAlert[];
}

interface CellGroupAlert {
  groupId: string;
  groupName: string;
  leaderName: string;
  reason: 'low_attendance' | 'no_recent_meeting' | 'leader_inactive' | 'declining_trend';
  severity: 'warning' | 'critical';
}
```

Improvements:
- Make "Groups Needing Attention" expandable to show which groups and why
- Add click-through to each group
- Include leader contact quick action (WhatsApp icon)
- Show attendance as a visual progress bar (already present, keep it)

### 5. This Week Calendar Widget (Right Sidebar)

Create a compact calendar/schedule widget:

```typescript
interface UpcomingEvent {
  id: string;
  date: Date;
  title: string;
  type: 'cell_group' | 'birthday' | 'anniversary' | 'visit' | 'event';
  relatedEntity?: {
    type: 'member' | 'family' | 'group';
    id: string;
    name: string;
  };
}
```

Display:
- "This Week" header with "View Calendar" link
- List of upcoming events grouped by day
- Visual date indicator (like Admin's "TUE 23" style)
- Event type icons
- Click-through to relevant pages

### 6. Branch Snapshot (Right Sidebar)

Show assigned branches with key stats:

```typescript
interface BranchSnapshot {
  id: string;
  name: string;
  location: string;
  memberCount: number;
  pastorCount: number;
}
```

Display as compact cards with:
- Branch avatar/icon
- Branch name and location
- Member count
- Quick link to branch details

### 7. Quick Stats (Right Sidebar)

Compact list of secondary metrics:
- Birthdays this month
- Anniversaries this month
- Baptisms YTD
- Incomplete profiles

### 8. Quick Actions Grid

Create a grid of common pastor actions:

| Action | Icon | Description | Route |
|--------|------|-------------|-------|
| Add New Member | UserPlus | Register someone to the church | /members/new |
| Log Pastoral Visit | ClipboardList | Record a home/hospital visit | /visits/new |
| Send Message | MessageSquare | WhatsApp message to members | /messages/new |
| View Prayer Requests | Heart | See submitted prayer needs | /prayer-requests |
| Schedule Follow-up | Calendar | Set reminder for member | /followups/new |
| Cell Group Reports | FileText | View attendance reports | /cell-groups/reports |

Use card-style buttons with icon, title, and brief description.

### 9. Recent Activity Feed

Show recent changes in pastor's branches:

```typescript
interface ActivityItem {
  id: string;
  type: 'member_added' | 'member_updated' | 'family_created' | 'attendance_recorded' | 'visit_logged';
  description: string;
  timestamp: Date;
  actor?: string;
  relatedEntity: {
    type: string;
    id: string;
    name: string;
  };
}
```

Display:
- Activity icon (colour-coded by type)
- Description text
- Relative timestamp ("23 hours ago")
- "View All" link to full activity log

---

## Component Structure

```
app/
└── [churchSlug]/
    └── pastor/
        └── dashboard/
            ├── page.tsx                    # Main dashboard page
            └── components/
                ├── WelcomeHeader.tsx       # Personalised greeting
                ├── MetricsCards.tsx        # Top stat cards
                ├── ActionItems.tsx         # Priority action items
                ├── CellGroupsOverview.tsx  # Enhanced cell groups section
                ├── ThisWeekWidget.tsx      # Calendar sidebar
                ├── BranchSnapshot.tsx      # Branch cards
                ├── QuickStats.tsx          # Secondary metrics
                ├── QuickActions.tsx        # Action buttons grid
                └── RecentActivity.tsx      # Activity feed
```

---

## Data Fetching Requirements

Create server actions or API routes to fetch:

```typescript
// lib/actions/pastor-dashboard.ts

export async function getPastorDashboardData(pastorId: string, churchId: string) {
  // Fetch all dashboard data in parallel
  const [
    pastorProfile,
    assignedBranches,
    memberStats,
    cellGroupStats,
    actionItems,
    upcomingEvents,
    recentActivity
  ] = await Promise.all([
    getPastorProfile(pastorId),
    getAssignedBranches(pastorId),
    getMemberStatsByBranches(branchIds),
    getCellGroupStatsByBranches(branchIds),
    getActionItems(branchIds),
    getUpcomingEvents(branchIds),
    getRecentActivity(branchIds)
  ]);

  return {
    pastor: pastorProfile,
    branches: assignedBranches,
    metrics: memberStats,
    cellGroups: cellGroupStats,
    actionItems,
    events: upcomingEvents,
    activity: recentActivity
  };
}
```

---

## Styling Guidelines

### Colour Palette for Cards

Use subtle, muted backgrounds that aren't overwhelming:

```typescript
const cardStyles = {
  members: 'bg-blue-50 border-blue-100',
  cellGroups: 'bg-emerald-50 border-emerald-100',
  attendance: 'bg-amber-50 border-amber-100',
  newMembers: 'bg-purple-50 border-purple-100',
};

const iconStyles = {
  members: 'bg-blue-500 text-white',
  cellGroups: 'bg-emerald-500 text-white',
  attendance: 'bg-amber-500 text-white',
  newMembers: 'bg-purple-500 text-white',
};
```

### Action Item Priority Colours

```typescript
const priorityStyles = {
  high: 'bg-red-50 border-l-4 border-l-red-500',
  medium: 'bg-amber-50 border-l-4 border-l-amber-500',
  low: 'bg-blue-50 border-l-4 border-l-blue-500',
};
```

### Typography

- Page title: `text-2xl font-bold text-gray-900`
- Subtitle: `text-sm text-gray-500`
- Card titles: `text-sm font-medium text-gray-500`
- Large numbers: `text-3xl font-bold text-gray-900`
- Trend positive: `text-sm text-emerald-600`
- Trend negative: `text-sm text-red-600`

---

## Layout Structure

Use a responsive grid layout:

```tsx
<div className="min-h-screen bg-gray-50 p-6">
  {/* Welcome Header */}
  <WelcomeHeader pastor={pastor} />

  <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main Content - 2 columns on large screens */}
    <div className="lg:col-span-2 space-y-6">
      {/* Metrics Cards */}
      <MetricsCards metrics={metrics} />

      {/* Action Items */}
      <ActionItems items={actionItems} />

      {/* Cell Groups Overview */}
      <CellGroupsOverview data={cellGroups} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <RecentActivity items={activity} />
    </div>

    {/* Right Sidebar - 1 column */}
    <div className="space-y-6">
      {/* This Week Widget */}
      <ThisWeekWidget events={events} />

      {/* Branch Snapshot */}
      <BranchSnapshot branches={branches} />

      {/* Quick Stats */}
      <QuickStats stats={quickStats} />
    </div>
  </div>
</div>
```

---

## Mobile Responsiveness

Ensure the dashboard works well on mobile:

- Stack all sections vertically on small screens
- Metrics cards: 2x2 grid on mobile, 4-column on desktop
- Quick actions: 2-column grid on mobile, 3-column on desktop
- Sidebar widgets move below main content on mobile
- Action items should be tap-friendly with adequate spacing

---

## shadcn/ui Components to Use

Install/use these components:
- `Card, CardHeader, CardTitle, CardDescription, CardContent`
- `Button`
- `Badge`
- `Avatar, AvatarFallback, AvatarImage`
- `Progress`
- `Separator`
- `ScrollArea` (for activity feed)
- `Tooltip` (for icon explanations)

---

## Implementation Order

1. **Phase 1**: Create component files and basic layout structure
2. **Phase 2**: Implement WelcomeHeader and MetricsCards with mock data
3. **Phase 3**: Build ActionItems component with priority styling
4. **Phase 4**: Enhance CellGroupsOverview with expandable alerts
5. **Phase 5**: Create sidebar widgets (ThisWeek, BranchSnapshot, QuickStats)
6. **Phase 6**: Add QuickActions grid
7. **Phase 7**: Implement RecentActivity feed
8. **Phase 8**: Wire up real data fetching from Supabase
9. **Phase 9**: Add loading states and error handling
10. **Phase 10**: Mobile responsiveness testing and refinement

---

## Example: ActionItems Component

```tsx
// components/ActionItems.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Cake, Heart, UserX, AlertCircle, 
  Phone, Users, ChevronRight 
} from "lucide-react";
import Link from "next/link";

interface ActionItem {
  id: string;
  type: 'birthday' | 'anniversary' | 'inactive' | 'missing_contact' | 'followup';
  title: string;
  description: string;
  count?: number;
  priority: 'high' | 'medium' | 'low';
  actionLabel: string;
  actionHref: string;
}

const typeConfig = {
  birthday: { icon: Cake, color: 'text-pink-500', bg: 'bg-pink-50' },
  anniversary: { icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  inactive: { icon: UserX, color: 'text-amber-500', bg: 'bg-amber-50' },
  missing_contact: { icon: Phone, color: 'text-blue-500', bg: 'bg-blue-50' },
  followup: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
};

const priorityStyles = {
  high: 'border-l-4 border-l-red-500 bg-red-50/50',
  medium: 'border-l-4 border-l-amber-500 bg-amber-50/50',
  low: 'border-l-4 border-l-blue-500 bg-blue-50/50',
};

export function ActionItems({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-emerald-500" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            All caught up! No action items need your attention.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Action Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg ${priorityStyles[item.priority]}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${config.bg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.description}
                  </p>
                </div>
              </div>
              <Link href={item.actionHref}>
                <Button variant="ghost" size="sm" className="text-xs">
                  {item.actionLabel}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

---

## Notes

- Maintain consistency with Admin dashboard styling where appropriate
- Ensure all data is scoped to pastor's assigned branches only
- Add appropriate loading skeletons for async data
- Consider adding a "Customise Dashboard" feature later for pastor preferences
- WhatsApp integration should use existing Twilio setup for sending messages