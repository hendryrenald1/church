# Navigation Refactor Prompt – Multi-Tenant Church App

## Role

You are a **senior React/Next.js engineer and UX-focused frontend dev**.

You are given an **existing Next.js App Router project** (TypeScript, TailwindCSS, shadcn/ui, lucide-react, Supabase).  
Your task is to **modify the existing layouts and navigation**, *not* rebuild the whole app.

The app already has:

- `app/superadmin/...`
- `app/[churchSlug]/admin/...`
- `app/[churchSlug]/pastor/...`

It likely has simple top navs or sidebars.  
You will **replace / enhance** them with a modern, **mobile-first** navigation system.

---

## Goal

Implement a **hybrid navigation system**:

- **Mobile (default)**  
  - Bottom tab bar with icons + labels for core sections  
  - A **“More”** tab that opens a sheet for secondary items  

- **Desktop / Tablet (md and up)**  
  - Collapsible **vertical sidebar** on the left  
  - Icons + labels when expanded; icons with tooltips when collapsed  

Navigation must be:

- Role-aware: **Super Admin**, **Church Admin**, **Pastor** each see different menus
- Multi-tenant aware: Admin & Pastor routes are under `/{churchSlug}/...`
- Mobile-first and fully responsive
- Implemented using **shadcn/ui + Tailwind + lucide-react**

You must **modify the existing layout components** to introduce this navigation, while preserving all existing content and business logic.

---

## Context – Roles & Routes

Keep existing route structure. You are only changing navigation wiring & layout.

### Super Admin

Base: `/superadmin/*`

**Core routes:**

- `/superadmin/dashboard`
- `/superadmin/churches`
- `/superadmin/churches/new`
- `/superadmin/profile` (or user account)
- `/superadmin/settings` (optional, can be stubbed)

### Church Admin

Base: `/{churchSlug}/admin/*`

**Core routes:**

- `/{churchSlug}/admin/dashboard`
- `/{churchSlug}/admin/members`
- `/{churchSlug}/admin/families`
- `/{churchSlug}/admin/branches`
- `/{churchSlug}/admin/pastors`
- `/{churchSlug}/admin/settings/church`
- `/{churchSlug}/admin/settings/branding`
- `/{churchSlug}/admin/settings/admins`

### Pastor

Base: `/{churchSlug}/pastor/*`

**Core routes:**

- `/{churchSlug}/pastor/dashboard`
- `/{churchSlug}/pastor/members`
- `/{churchSlug}/pastor/members/new`
- `/{churchSlug}/pastor/profile` (can be added if not present yet)

---

## Navigation Design – BY ROLE

### 1️⃣ Super Admin

#### Mobile – Bottom Tabs

Tabs (fixed bottom bar):

1. **Dashboard** – icon: `LayoutDashboard`
2. **Churches** – icon: `Building2`
3. **New Church** – icon: `PlusCircle`
4. **Profile** – icon: `User`
5. **More** – icon: `MoreHorizontal` → opens bottom sheet with:
   - Settings
   - Logout (and any future items)

#### Desktop – Sidebar

Left sidebar containing:

- Dashboard (`/superadmin/dashboard`)
- Churches (`/superadmin/churches`)
- New Church (`/superadmin/churches/new`)
- Divider
- Settings
- Logout

Use icon + label, and show active state (background + left border).

---

### 2️⃣ Church Admin

#### Mobile – Bottom Tabs

Tabs (fixed bottom):

1. **Home** – `LayoutDashboard` → `/{churchSlug}/admin/dashboard`
2. **Members** – `Users` → `/{churchSlug}/admin/members`
3. **Families** – `Home` → `/{churchSlug}/admin/families`
4. **Branches** – `Building2` → `/{churchSlug}/admin/branches`
5. **More** – `MoreHorizontal` → bottom sheet with:
   - Pastors – `UserCog` → `/{churchSlug}/admin/pastors`
   - Reports (placeholder, optional) – `BarChart3`
   - Church Settings – `Settings` → `/{churchSlug}/admin/settings/church`
   - My Account (if exists)
   - Logout

#### Desktop – Sidebar

Sidebar entries:

- Dashboard
- Members
- Families
- Branches
- Pastors
- Divider
- Church Settings
- Logout

---

### 3️⃣ Pastor

#### Mobile – Bottom Tabs

1. **Home** – `LayoutDashboard` → `/{churchSlug}/pastor/dashboard`
2. **Members** – `Users` → `/{churchSlug}/pastor/members`
3. **Add** – `PlusCircle` → `/{churchSlug}/pastor/members/new`
4. **Profile** – `User` → `/{churchSlug}/pastor/profile` (or account page)
5. **More** – `MoreHorizontal` → bottom sheet:
   - Preferences (if any)
   - Logout

#### Desktop – Sidebar

- Dashboard
- Members
- Add Member
- Divider
- My Profile
- Logout

---

## Implementation Requirements

### 1. Don’t Destroy Existing Logic

- **Find the existing layout components**:
  - `app/superadmin/layout.tsx`
  - `app/[churchSlug]/admin/layout.tsx`
  - `app/[churchSlug]/pastor/layout.tsx`
- Wrap the existing `children` with the new layout shell (sidebar + bottom nav).
- Preserve all current `<main>` content – only change the chrome around it.

### 2. Components to Create / Modify

Create reusable components in something like `src/components/navigation`:

1. `SuperAdminSidebar.tsx`
2. `SuperAdminBottomNav.tsx`
3. `AdminSidebar.tsx`
4. `AdminBottomNav.tsx`
5. `PastorSidebar.tsx`
6. `PastorBottomNav.tsx`

Each:

- Accepts `currentPath` (from `usePathname()`) to highlight active item.
- Accepts `churchSlug` where needed (Admin/Pastor).
- Uses `lucide-react` icons.

Optional shared building blocks:

- `NavItem` – a small component for icon + label + active state.
- `BottomNav` – generic bottom bar container.

### 3. Responsive Behaviour

Use Tailwind + CSS:

- Sidebar:
  - `hidden md:flex` (visible from `md` upwards)
  - `w-16` collapsed option (icons only) is nice-to-have but optional.
- Bottom nav:
  - `fixed bottom-0 inset-x-0 z-40`  
  - `flex md:hidden` (only on mobile)
  - Use safe-area padding on iOS: `pb-safe` pattern if you have it, or `pb-4`.

Layout example (Admin):

```tsx
// app/[churchSlug]/admin/layout.tsx (example structure)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ churchSlug: string }>();
  const churchSlug = params.churchSlug;

  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <AdminSidebar
          churchSlug={churchSlug}
          currentPath={pathname}
          className="hidden md:flex"
        />

        {/* Main content */}
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <AdminBottomNav
        churchSlug={churchSlug}
        currentPath={pathname}
        className="md:hidden"
      />
    </div>
  );
}
