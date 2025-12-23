# Member Profile Screen Redesign Instructions

## Project Context

You are working on a church membership management application built with:
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase
- **Architecture**: Multi-tenant with URL-based routing
- **Target Platform**: Mobile-first PWA

---

## Objective

Transform the current member profile screen (a scrollable multi-card layout) into a compact, single-view design that displays all essential information without excessive scrolling.

---

## Current State Analysis

The current implementation has these issues:

1. **Header is too sparse** - Large avatar with name/status takes too much vertical space
2. **Actions buried** - Edit and Message are full-width buttons taking excessive space
3. **Information scattered** - Contact, Church info, Groups, Attendance, Family are in separate scrollable cards
4. **Too much scrolling required** - User must scroll through 3-4 screens to see all info
5. **No quick actions** - Call, Email, Message require navigation or multiple taps
6. **Attendance not prominent** - Key pastoral metric is hidden below the fold

---

## Target Design Specifications

### Overall Layout

```
┌─────────────────────────────────────┐
│ ← Member Profile              🌙    │  ← Header with back & theme toggle
├─────────────────────────────────────┤
│    ┌──────┐                         │
│    │Avatar│  Name                   │
│    │  ✓   │  Member since Date      │  ← Compact profile header
│    └──────┘  📍 Branch  🎂 Birthday │
│                                     │
│   📞 Call  ✉️ Email  💬 Msg  ✏️ Edit │  ← Quick action buttons (icons)
├─────────────────────────────────────┤
│ 📱 +44 7705 678901          [COPY]  │  ← Contact info (inline)
│ @ olivia.martinez@email.com         │
├─────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────┐ │
│ │ ATTENDANCE  │ │ GROUPS          │ │
│ │ 📊          │ │ 👥              │ │  ← Stats cards (side by side)
│ │ 100% (4/4)  │ │ 0 active        │ │
│ │ Last: Sun   │ │ [+ Join Group]  │ │
│ └─────────────┘ └─────────────────┘ │
├─────────────────────────────────────┤
│ FAMILY MEMBERS              Manage  │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Olivia Martinez        HEAD  │→│  ← Family list
│ │ 👤 Anderson Family      Spouse  │→│
│ │ 👤 Jackson Family        Child  │→│
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│  🏠    👥     👨‍👩‍👧    🏛️    •••    │  ← Bottom navigation
│ Home Members Family Branch  More    │
└─────────────────────────────────────┘
```

---

## Detailed Component Specifications

### 1. Header Bar

```tsx
interface HeaderProps {
  title: string;
  onBack: () => void;
  onThemeToggle?: () => void;
}
```

**Design:**
- Height: `h-14` (56px)
- Back arrow on left (← icon)
- Title "Member Profile" centered or left-aligned after arrow
- Theme toggle icon (moon/sun) on right
- Background: `bg-white` with subtle bottom border

**Implementation:**
```tsx
<header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100">
  <button onClick={onBack} className="p-2 -ml-2">
    <ChevronLeft className="h-5 w-5 text-gray-700" />
  </button>
  <h1 className="text-base font-semibold text-gray-900">Member Profile</h1>
  <button onClick={onThemeToggle} className="p-2 -mr-2">
    <Moon className="h-5 w-5 text-gray-500" />
  </button>
</header>
```

---

### 2. Profile Header Section

```tsx
interface MemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  status: 'active' | 'inactive';
  memberSince: Date;
  branch: {
    id: string;
    name: string;
  };
  birthday?: Date; // Day and month only displayed
  isVerified?: boolean;
}
```

**Design:**
- Avatar: `w-16 h-16` (64px) rounded-full with colored background
- Verification badge: Small checkmark overlay on avatar (bottom-right)
- Name: `text-xl font-bold`
- Status badge: Pill shape, green for active (`bg-emerald-100 text-emerald-700`)
- "Member since [Month Year]" in muted text
- Branch with location pin icon
- Birthday with cake icon (format: "Oct 24" - no year)

**Layout:**
```tsx
<div className="px-4 pt-4 pb-3">
  <div className="flex items-start gap-4">
    {/* Avatar with verification badge */}
    <div className="relative">
      <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl font-semibold">
        {initials}
      </div>
      {isVerified && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
    
    {/* Info */}
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
          ACTIVE
        </span>
      </div>
      <p className="text-sm text-gray-500">Member since {memberSince}</p>
      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {branch.name}
        </span>
        {birthday && (
          <span className="flex items-center gap-1">
            <Cake className="h-3.5 w-3.5" />
            {formattedBirthday}
          </span>
        )}
      </div>
    </div>
  </div>
</div>
```

---

### 3. Quick Action Buttons

**Design:**
- 4 circular icon buttons in a row
- Equal spacing with `justify-around` or grid
- Each button: icon + label below
- Icons in rounded containers with subtle background
- Labels: small text below each icon

**Actions:**
| Action | Icon | Color | Handler |
|--------|------|-------|---------|
| Call | Phone | `text-blue-600 bg-blue-50` | `tel:${phone}` |
| Email | Mail | `text-blue-600 bg-blue-50` | `mailto:${email}` |
| Message | MessageSquare | `text-blue-600 bg-blue-50` | WhatsApp/SMS |
| Edit | Pencil | `text-blue-600 bg-blue-50` | Navigate to edit |

**Implementation:**
```tsx
<div className="flex justify-around px-4 py-3 border-b border-gray-100">
  {actions.map((action) => (
    <button
      key={action.label}
      onClick={action.onClick}
      className="flex flex-col items-center gap-1"
    >
      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
        <action.icon className="h-5 w-5 text-blue-600" />
      </div>
      <span className="text-xs text-gray-600">{action.label}</span>
    </button>
  ))}
</div>
```

---

### 4. Contact Information Section

**Design:**
- Simple list with icon prefix
- Phone number with COPY button on right
- Email below phone
- Subtle divider or card background

**Implementation:**
```tsx
<div className="px-4 py-3 space-y-2 bg-white">
  {/* Phone */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Phone className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-900">{phone}</span>
    </div>
    <button 
      onClick={copyPhone}
      className="text-xs font-medium text-blue-600 hover:text-blue-700"
    >
      COPY
    </button>
  </div>
  
  {/* Email */}
  <div className="flex items-center gap-3">
    <AtSign className="h-4 w-4 text-gray-400" />
    <span className="text-sm text-gray-900">{email}</span>
  </div>
</div>
```

---

### 5. Stats Cards (Attendance & Groups)

**Design:**
- Two cards side by side in a grid
- Each card has: icon, label, large stat, secondary info
- Rounded corners with subtle border
- Attendance card shows percentage with fraction
- Groups card shows count with "+ Join Group" action

```tsx
interface AttendanceStats {
  percentage: number;
  attended: number;
  total: number;
  lastAttended?: Date;
}

interface GroupStats {
  activeCount: number;
  groups: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}
```

**Implementation:**
```tsx
<div className="px-4 py-3">
  <div className="grid grid-cols-2 gap-3">
    {/* Attendance Card */}
    <div className="p-4 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        <BarChart3 className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">Attendance</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
        <span className="text-sm text-gray-500">({attended}/{total})</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Last: {lastAttended || 'Never'}
      </p>
    </div>

    {/* Groups Card */}
    <div className="p-4 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        <Users className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">Groups</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{activeCount}</span>
        <span className="text-sm text-gray-500">active</span>
      </div>
      <button className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
        <Plus className="h-3 w-3" />
        Join Group
      </button>
    </div>
  </div>
</div>
```

---

### 6. Family Members Section

**Design:**
- Section header with "FAMILY MEMBERS" label and "Manage" action
- List of family members with avatar, name, and role
- Chevron right for navigation
- Roles: HEAD (highlighted), Spouse, Child, etc.
- HEAD role gets special badge styling

```tsx
interface FamilyMember {
  id: string;
  memberId: string;
  name: string;
  role: 'head' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  avatarUrl?: string;
}
```

**Implementation:**
```tsx
<div className="px-4 py-3">
  {/* Section Header */}
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      Family Members
    </h3>
    <button className="text-sm font-medium text-blue-600">
      Manage
    </button>
  </div>

  {/* Family List */}
  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
    {familyMembers.map((member) => (
      <button
        key={member.id}
        onClick={() => navigateToMember(member.memberId)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            {getInitials(member.name)}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{member.name}</p>
            <span className={cn(
              "text-xs",
              member.role === 'head' 
                ? "text-blue-600 font-medium uppercase" 
                : "text-gray-500 capitalize"
            )}>
              {member.role === 'head' ? 'HEAD' : member.role}
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </button>
    ))}
  </div>
</div>
```

---

### 7. Bottom Navigation

**Design:**
- Fixed at bottom
- 5 items: Home, Members, Families, Branches, More
- Active state with colored icon and label
- Inactive state with gray icon and label

```tsx
const navItems = [
  { icon: LayoutGrid, label: 'Home', href: '/home', active: false },
  { icon: Users, label: 'Members', href: '/members', active: true },
  { icon: Home, label: 'Families', href: '/families', active: false },
  { icon: Building2, label: 'Branches', href: '/branches', active: false },
  { icon: MoreHorizontal, label: 'More', href: '/more', active: false },
];
```

**Implementation:**
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe">
  <div className="flex justify-around py-2">
    {navItems.map((item) => (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          "flex flex-col items-center gap-1 px-3 py-1",
          item.active ? "text-blue-600" : "text-gray-500"
        )}
      >
        <item.icon className="h-5 w-5" />
        <span className="text-xs">{item.label}</span>
      </Link>
    ))}
  </div>
</nav>
```

---

## Complete Page Structure

```tsx
// app/[churchSlug]/members/[memberId]/page.tsx

export default async function MemberProfilePage({ params }: Props) {
  const member = await getMemberById(params.memberId);
  const attendance = await getMemberAttendance(params.memberId);
  const groups = await getMemberGroups(params.memberId);
  const family = await getMemberFamily(params.memberId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <ProfileHeader />

      {/* Main Content */}
      <main>
        {/* Profile Info */}
        <ProfileSection member={member} />

        {/* Quick Actions */}
        <QuickActions member={member} />

        {/* Contact Info */}
        <ContactInfo phone={member.phone} email={member.email} />

        {/* Stats Grid */}
        <StatsCards attendance={attendance} groups={groups} />

        {/* Family Members */}
        <FamilySection members={family} />
      </main>

      {/* Bottom Nav */}
      <BottomNavigation />
    </div>
  );
}
```

---

## Component File Structure

```
app/
└── [churchSlug]/
    └── members/
        └── [memberId]/
            ├── page.tsx
            └── components/
                ├── ProfileHeader.tsx      # Back button, title, theme toggle
                ├── ProfileSection.tsx     # Avatar, name, status, branch, birthday
                ├── QuickActions.tsx       # Call, Email, Message, Edit buttons
                ├── ContactInfo.tsx        # Phone and email with copy
                ├── StatsCards.tsx         # Attendance and Groups cards
                └── FamilySection.tsx      # Family members list
```

---

## Styling Constants

```tsx
// lib/constants/profile-styles.ts

export const avatarColors = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export const statusStyles = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
};

export const roleStyles = {
  head: 'text-blue-600 font-medium uppercase',
  spouse: 'text-gray-500 capitalize',
  child: 'text-gray-500 capitalize',
  parent: 'text-gray-500 capitalize',
  sibling: 'text-gray-500 capitalize',
  other: 'text-gray-500 capitalize',
};
```

---

## Data Fetching

```tsx
// lib/actions/member-profile.ts

export async function getMemberProfileData(memberId: string) {
  const supabase = createServerClient();

  const [memberResult, attendanceResult, groupsResult, familyResult] = await Promise.all([
    supabase
      .from('members')
      .select(`
        *,
        branch:branches(id, name)
      `)
      .eq('id', memberId)
      .single(),

    supabase
      .from('attendance_records')
      .select('*')
      .eq('member_id', memberId)
      .gte('date', getStartOfMonth()),

    supabase
      .from('group_members')
      .select(`
        *,
        group:groups(id, name, type)
      `)
      .eq('member_id', memberId)
      .eq('status', 'active'),

    supabase
      .from('family_members')
      .select(`
        *,
        member:members(id, first_name, last_name)
      `)
      .eq('family_id', memberFamilyId),
  ]);

  return {
    member: memberResult.data,
    attendance: calculateAttendanceStats(attendanceResult.data),
    groups: groupsResult.data,
    family: familyResult.data,
  };
}
```

---

## Key Differences from Current Implementation

| Aspect | Current | Target |
|--------|---------|--------|
| Layout | Multiple scrollable cards | Single compact view |
| Avatar | Large, centered | Smaller, left-aligned |
| Actions | Full-width buttons | Icon buttons in row |
| Contact | Separate card section | Inline list |
| Stats | Hidden below fold | Prominent side-by-side cards |
| Family | Separate card at bottom | Integrated section |
| Scrolling | 3-4 screens | Minimal (1-1.5 screens) |

---

## Implementation Checklist

- [ ] Create new component files in the structure above
- [ ] Refactor page.tsx to use new compact layout
- [ ] Implement ProfileSection with avatar and info
- [ ] Add QuickActions with icon buttons
- [ ] Create compact ContactInfo section
- [ ] Build side-by-side StatsCards
- [ ] Implement FamilySection with role badges
- [ ] Add copy-to-clipboard functionality for phone
- [ ] Wire up navigation handlers (Call, Email, Message, Edit)
- [ ] Test on mobile viewport (375px width)
- [ ] Ensure bottom navigation doesn't overlap content (pb-20)
- [ ] Add loading states for async data
- [ ] Handle empty states (no family, no groups)

---

## Additional Notes

### Phone Actions
- **Call**: Use `<a href="tel:+447705678901">` or `window.location.href`
- **Message**: Integrate with WhatsApp via Twilio or `https://wa.me/${phone}`

### Copy Functionality
```tsx
const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
};
```

### Birthday Display
- Store full date but only display day and month
- Format: "Oct 24" using `format(birthday, 'MMM d')`

### Avatar Color Assignment
- Use consistent color based on member ID or name hash
- `avatarColors[hashCode(memberId) % avatarColors.length]`

### Verification Badge
- Show if member has verified email or phone
- Purple checkmark overlay on avatar