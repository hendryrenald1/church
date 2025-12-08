## ROLE

You are a **senior full-stack SaaS engineer and UX-focused frontend architect**.

You build **production-ready multi-tenant web apps** using:

- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Supabase** for:
    - PostgreSQL database
    - Authentication (email/password with Supabase Auth)
    - Row-Level Security (RLS) where appropriate

You write **clean, fully typed, secure code**, enforce **strict tenant isolation**, and implement **role-based authorization**.

All UI must be **modern, responsive, accessible, and easy to use**.

---

## CORE PRODUCT

Build a **Multi-Tenant Church Management Platform** where:

- Multiple churches share the same app instance.
- Each church is a **tenant**.
- Each church has:
    - **Admins** – manage that church
    - **Pastors** – manage members in their assigned branches
    - **Members** – stored as data only (no login)
- A **Super Admin** manages the *overall platform* (all churches).

---

## MULTI-TENANCY & ROLES

### Tenancy

- Every data row that belongs to a church must carry a `churchId`.
- Tenant resolution uses:
    - `churchSlug` in the URL: `/{churchSlug}/...`
    - `churchId` in the Supabase-authenticated session.
- All queries must filter by `churchId` and cross-check against `churchSlug`.

### Roles

Use Supabase Auth for users:

- `SUPER_ADMIN` – has platform-wide access to all churches (no `churchSlug` restrictions).
- `ADMIN` – has access only to one specific church (scoped by `churchId`).
- `PASTOR` – has access only to:
    - Their church (`churchId`)
    - Their assigned branches (through mapping)

**Members have no login.**

They exist only in the `Member` table and are managed by Admin/Pastor.

---

## CORE ENTITIES (DATA MODEL)

You can implement this with Supabase tables and optionally Prisma pointing at Supabase Postgres. If you use Prisma, ensure the connection string targets Supabase.

### `Church`

Represents a tenant.

- `id`
- `name`
- `slug` (unique, used in URL)
- `primaryContactName`
- `primaryContactEmail`
- `status`: `PENDING | ACTIVE | SUSPENDED`
- `plan`: `FREE | STANDARD | PREMIUM`
- `createdAt`
- `updatedAt`

### `User`

Supabase Auth will store core user identity; create a `users` (or `AppUser`) table linked to Supabase Auth `auth.users` id.

- `id` (UUID, matches Supabase Auth user)
- `email`
- `role`: `SUPER_ADMIN | ADMIN | PASTOR`
- `churchId` (nullable for `SUPER_ADMIN`)
- `memberId` (nullable; used when the user is also a Member, e.g., Pastor)
- `createdAt`
- `updatedAt`

### `Branch`

Church branches/campuses.

- `id`
- `churchId`
- `name`
- `city`
- `address`
- `isActive`
- `createdAt`
- `updatedAt`

### `Member`

Any person who belongs to a church.

> Pastors are also Members.
> 
- `id`
- `churchId`
- `branchId` (nullable initially; can assign later)
- `firstName`
- `lastName`
- `gender` (optional)
- `email` (nullable, especially for children)
- `phone` (nullable)
- `status`: `ACTIVE | INACTIVE`
- `joinedDate` (membership date)
- `dateOfBirth` (nullable)
- `baptismDate` (nullable)
- `createdAt`
- `updatedAt`

### `PastorProfile`

Extension of `Member` for pastors.

- `id`
- `memberId` (FK → `Member.id`)
- `churchId`
- `title` (e.g., “Senior Pastor”, “Associate Pastor”)
- `ordinationDate` (nullable)
- `bio` (nullable)
- `createdAt`
- `updatedAt`

### `PastorBranch`

Relationship between Pastor and Branch.

- `id`
- `churchId`
- `pastorProfileId` (FK → `PastorProfile.id`)
- `branchId` (FK → `Branch.id`)
- `createdAt`
- `updatedAt`

### `Family`

Represents a household/family unit.

Wedding anniversary is stored at the family level.

- `id`
- `churchId`
- `familyName` (e.g. “David Family”, optional)
- `weddingAnniversary` (nullable)
- `address` (nullable; shared family address)
- `createdAt`
- `updatedAt`

### `FamilyMember`

Links Members to a Family with their role.

- `id`
- `familyId`
- `memberId`
- `relationship`: `HEAD | SPOUSE | CHILD | OTHER`
- `isPrimaryContact` (boolean)
- `createdAt`
- `updatedAt`

> Business rule:
> 
> 
> Every person in a family **must** be a Member.
> 
> No separate “family-only” records.
> 
> ## AUTH & SECURITY (SUPABASE)
> 
> - Use **Supabase Auth** (email/password) for user authentication.
> - Use Supabase **Row-Level Security (RLS)** policies to enforce:
>     - Tenant isolation (`churchId`)
>     - Role-based access on server queries where appropriate.
> - On the Next.js side, use the Supabase client with:
>     - Server-side helpers for reading the current user & role.
> - For all server logic:
>     - Derive `churchId`, `role`, `userId`, and `memberId` from the Supabase session.
>     - Enforce that `churchSlug` in the URL matches `churchId` in the session (except `SUPER_ADMIN`).
> 
> ---
> 
> ## HIGH-LEVEL MODULES
> 
> 1. **Public Module**
> 2. **Super Admin Module**
> 3. **Church Admin Module**
> 4. **Pastor Module**
> 
> No Member-facing module. All member & family management is done by Admins (and optionally Pastors later).
> 
> ---
> 
> ## 1️⃣ PUBLIC MODULE
> 
> ### 1. Landing Page `/`
> 
> - Explain the platform: multi-tenant church management.
> - Calls to action:
>     - “Register Church”
>     - “Login”
> 
> ### 2. Church Registration `/auth/register-church`
> 
> - Inputs:
>     - Church Name
>     - Desired Slug (validated for uniqueness)
>     - Primary Contact Name
>     - Primary Contact Email
>     - Admin Password (for first admin user)
> - Behaviour:
>     - Creates:
>         - `Church` with `status = PENDING`
>         - Associated `User` with:
>             - `role = ADMIN`
>             - `churchId` set to the new church
>     - Shows a “Pending approval” state.
> - Until the Church is approved by Super Admin, its Admin cannot access the admin dashboard.
> 
> ### 3. Login `/auth/login`
> 
> - Auth via Supabase.
> - After login:
>     - If `role = SUPER_ADMIN` → redirect to `/superadmin/dashboard`
>     - If `role = ADMIN` → redirect to `/{churchSlug}/admin/dashboard`
>     - If `role = PASTOR` → redirect to `/{churchSlug}/pastor/dashboard`
> 
> ---
> 
> ## 2️⃣ SUPER ADMIN MODULE
> 
> Base path: `/superadmin/*`
> 
> Access: only `SUPER_ADMIN` users.
> 
> ### Pages
> 
> 1. **Login** `/superadmin/login` (can reuse `/auth/login` with role-based redirect)
> 2. **Dashboard** `/superadmin/dashboard`
>     - Total churches
>     - Active vs Pending vs Suspended
>     - New churches in last 7/30 days
>     - Quick actions: “View all churches”, “Create church”
> 3. **Church List** `/superadmin/churches`
>     - Table with:
>         - Name, Slug, Status, Plan, Primary Contact, Created Date
>     - Filters:
>         - By status
>         - By plan
>         - Search by name/slug/email
>     - Actions:
>         - View / Edit
>         - Approve / Suspend
>         - Delete (or Archive)
> 4. **Create Church** `/superadmin/churches/new`
>     - Same data as public registration, but Super Admin driven.
>     - Creates a Church and initial Admin user.
> 5. **Church Detail** `/superadmin/churches/[churchId]`
>     - Tabs:
>         - Overview (stats: branches, pastors, members)
>         - Status & Plan (approve, suspend, change plan)
>         - Admin Users (view/add Admins for that church)
>         - Danger Zone (archive/delete)
>     - Optional: “Impersonate Admin” button to create an impersonation session that redirects to `/{churchSlug}/admin/dashboard`.
> 
> ### APIs (examples)
> 
> All restricted to `SUPER_ADMIN`.
> 
> - `GET /api/superadmin/churches`
> - `POST /api/superadmin/churches`
> - `GET /api/superadmin/churches/[id]`
> - `PATCH /api/superadmin/churches/[id]` (status, plan, contact info)
> - `DELETE /api/superadmin/churches/[id]`
> - `POST /api/superadmin/churches/[id]/impersonate` (optional)

## 3️⃣ CHURCH ADMIN MODULE

Base path: `/{churchSlug}/admin/*`

Access: `role = ADMIN` and session church must match `churchSlug`.

### 3.1 Admin Dashboard `/{churchSlug}/admin/dashboard`

- KPI cards:
    - Number of Branches
    - Number of Pastors
    - Number of Members
    - Number of Families
- Quick links:
    - “Add Member”
    - “Add Branch”
    - “Add Pastor”
    - “View Families”

---

### 3.2 Branch Management

**List:** `/{churchSlug}/admin/branches`

- Table: Name, City, Address, Active?, #Members
- Actions: View, Edit, Delete, Deactivate
- Button: “Add Branch”

**Create/Edit:** `/{churchSlug}/admin/branches/new` & `/{churchSlug}/admin/branches/[branchId]`

- Form: name, city, address, isActive
- All operations scoped by `churchId`.

APIs:

- `GET /api/admin/branches`
- `POST /api/admin/branches`
- `GET /api/admin/branches/[id]`
- `PATCH /api/admin/branches/[id]`
- `DELETE /api/admin/branches/[id]`

---

### 3.3 Member Management (Member First, Then Family – Flow Option 2)

### Member List `/{churchSlug}/admin/members`

- Table with filters:
    - Filter by branch
    - Search by name/email
    - Filter by status
- Columns: Name, Branch, Status, DOB, Joined Date.
- Actions: View, Edit, Delete
- Button: “Add Member”

### Add/Edit Member

`/{churchSlug}/admin/members/new`

`/{churchSlug}/admin/members/[memberId]/edit`

- Fields:
    - First name, Last name
    - Gender
    - Email, Phone
    - Branch (select from church branches)
    - Status
    - Joined Date
    - Date of Birth (optional)
    - Baptism Date (optional)

APIs:

- `GET /api/admin/members`
- `POST /api/admin/members`
- `GET /api/admin/members/[id]`
- `PATCH /api/admin/members/[id]`
- `DELETE /api/admin/members/[id]`

### Member Detail `/{churchSlug}/admin/members/[memberId]`

- Shows full member profile.
- Section: “Family”
    - If member is not in any family:
        - Show message: “This member is not assigned to a family.”
        - Button: **“Create Family for this Member”**
    - If already in a family:
        - Show family summary and link to Family detail.

---

### 3.4 Family Management (Admin-Only, Member First Flow – OPTION 2)

> Rule: Admin always creates/edits family data. No member login.
> 

### Family List `/{churchSlug}/admin/families`

- Table:
    - Family Name
    - Head (Member)
    - Spouse (if any)
    - #Children
    - Wedding Anniversary
- Filters:
    - Search by family name or head name.

### Create Family from Member Detail (Flow Option 2)

From `Member Detail`:

- If no family:
    - Button: **“Create Family”**
    - Behaviour:
        - Create `Family` with:
            - `churchId` = member’s `churchId`
            - `familyName` (optional, can default to last name + “Family”)
        - Create `FamilyMember`:
            - `memberId` = current member
            - `relationship = HEAD`
- Family detail page opens.

### Family Detail `/{churchSlug}/admin/families/[familyId]`

Shows:

- Family name, address, weddingAnniversary
- List of Family Members:
    - Name
    - Relationship (HEAD / SPOUSE / CHILD / OTHER)
    - DOB
    - Baptism Date

Actions:

- **Edit Family Info**
    - Set/change weddingAnniversary.
    - Edit familyName / address.
- **Add Spouse**
    - Option 1: Search existing Member (by name/email) → link as `SPOUSE`.
    - Option 2: Create new Member inline → then link as `SPOUSE`.
- **Add Child**
    - Always creates a new Member (or allows linking an existing one).
    - Links as `CHILD`.
- **Remove from Family**
    - Allows removing a member’s link (FamilyMember row), not deleting Member itself.

APIs:

- `GET /api/admin/families`
- `POST /api/admin/families` (normally from Member detail to create)
- `GET /api/admin/families/[id]`
- `PATCH /api/admin/families/[id]`
- `POST /api/admin/families/[familyId]/add-member` (body: memberId, relationship)
- `DELETE /api/admin/families/[familyMemberId]`

---

### 3.5 Pastor Management

**List:** `/{churchSlug}/admin/pastors`

- Shows: Pastor Name, Email, Assigned Branches, Title.
- Each row is based on `PastorProfile` joined with `Member`.

**Create Pastor Flow:**

Admin goes to “Add Pastor”:

1. Step 1 – Select or Create Member:
    - Option A: Search existing Member → select.
    - Option B: Create new Member (then automatically use them).
2. Step 2 – Create `PastorProfile`:
    - title, ordinationDate, bio
3. Step 3 – Assign Branches:
    - Multi-select branches from this church.
    - Creates `PastorBranch` rows.

APIs:

- `GET /api/admin/pastors`
- `POST /api/admin/pastors` (handles: member + pastorProfile + branch mappings)
- `GET /api/admin/pastors/[id]`
- `PATCH /api/admin/pastors/[id]`
- `DELETE /api/admin/pastors/[id]`
- `GET /api/admin/pastor-branches`
- `POST /api/admin/pastor-branches`
- `DELETE /api/admin/pastor-branches/[id]`

---

### 3.6 Church Settings (Admin)

### Church Profile `/{churchSlug}/admin/settings/church`

- Church name
- Primary contact name/email
- Address / city
- Timezone
- (Slug is displayed but not editable by default)

### Branding `/{churchSlug}/admin/settings/branding`

- Logo
- Primary color / accent color
- Short description/tagline.

APIs:

- `GET /api/admin/church`
- `PATCH /api/admin/church`
- `GET /api/admin/church/branding`
- `PATCH /api/admin/church/branding`

## 4️⃣ PASTOR MODULE

Base path: `/{churchSlug}/pastor/*`

Access: `role = PASTOR` and `churchId` matches `churchSlug`.

### 4.1 Pastor Dashboard

- Summary:
    - Assigned branches
    - Member count in their branches
- Quick actions:
    - “View My Members”
    - “Add Member”

### 4.2 Pastor Member List `/{churchSlug}/pastor/members`

- Shows Members from branches where:
    - `PastorBranch` links that Pastor to the branch.
- Filters:
    - By branch (limited to their assigned branches)
    - By name
- Members’ family info is read-only here.

### 4.3 Pastor Member Detail `/{churchSlug}/pastor/members/[memberId]`

- Shows Member profile.
- Server-side validation ensures:
    - Member’s branch is in Pastor’s assigned branches.
- Pastors may:
    - Edit limited member fields (e.g., notes) – optional.
    - Not manage church settings.

### 4.4 Pastor Add Member `/{churchSlug}/pastor/members/new`

- Pastor can add new members **only** into:
    - Branches they are assigned to.
- On submit:
    - Creates `Member` with:
        - `churchId` from session
        - `branchId` from allowed branches

APIs:

- `GET /api/pastor/members`
- `POST /api/pastor/members`
- `GET /api/pastor/members/[id]`

---

## 5️⃣ TECH STACK & PROJECT STRUCTURE

### Tech Stack

- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Supabase**:
    - Database (Postgres)
    - Auth (email/password)
    - Row-Level Security
- Optional: **Prisma** pointing to Supabase Postgres.

### Project Skeleton (Example)

```
/app
  page.tsx                         # Landing
  auth/
    login/page.tsx
    register-church/page.tsx

  superadmin/
    layout.tsx
    dashboard/page.tsx
    churches/page.tsx
    churches/new/page.tsx
    churches/[churchId]/page.tsx

  [churchSlug]/
    admin/
      layout.tsx
      dashboard/page.tsx
      branches/
        page.tsx
        new/page.tsx
        [branchId]/page.tsx
      members/
        page.tsx
        new/page.tsx
        [memberId]/page.tsx
      families/
        page.tsx
        [familyId]/page.tsx
      pastors/
        page.tsx
        new/page.tsx
        [pastorId]/page.tsx
      settings/
        church/page.tsx
        branding/page.tsx

    pastor/
      layout.tsx
      dashboard/page.tsx
      members/
        page.tsx
        new/page.tsx
        [memberId]/page.tsx

/app/api
  auth/
    register-church/route.ts
    login/route.ts
    logout/route.ts
  superadmin/
    churches/route.ts
    churches/[churchId]/route.ts
    churches/[churchId]/impersonate/route.ts
  admin/
    branches/route.ts
    branches/[branchId]/route.ts
    members/route.ts
    members/[memberId]/route.ts
    families/route.ts
    families/[familyId]/route.ts
    families/[familyId]/add-member/route.ts
    families/members/[familyMemberId]/route.ts
    pastors/route.ts
    pastors/[pastorId]/route.ts
    pastor-branches/route.ts
    pastor-branches/[id]/route.ts
    church/route.ts
    church/branding/route.ts
  pastor/
    members/route.ts
    members/[memberId]/route.ts

/lib or /src/lib
  supabaseClient.ts
  auth.ts           # helpers for reading Supabase session & roles
  permissions.ts    # role & churchSlug checks
  tenancy.ts        # helpers to enforce churchId vs churchSlug

```

Use shadcn/ui for all UI building blocks (navigation, forms, tables, dialogs, toasts, skeletons, etc.).

## 6️⃣ DELIVERABLES FROM THE AI TOOL

Return **one complete response** containing:

1. **Project tree** (high-level structure).
2. **Database schema**:
    - SQL or Prisma schema for all tables:
        - Church, User/AppUser, Branch
        - Member, PastorProfile, PastorBranch
        - Family, FamilyMember
3. **Supabase integration**:
    - Setup for Supabase client in Next.js (server and client utilities).
    - Auth helpers to read current user + role + churchId from Supabase.
4. **All key pages**:
    - Public: landing, register church, login.
    - Super Admin: dashboard, church list, church detail, new church.
    - Church Admin: dashboard, branches, members, families, pastors, settings.
    - Pastor: dashboard, member list/detail, add member.
5. **API route handlers** for the described endpoints:
    - Using Supabase database client.
    - Enforcing role + churchSlug + churchId checks.
6. A root **`README.md`** with:
    - Setup instructions (Supabase project, env vars, local dev).
    - How multi-tenancy is handled (churchId + churchSlug).
    - How roles and permissions work (SUPER_ADMIN, ADMIN, PASTOR).
    - How the Member-first → Family creation flow works.
    - How to run migrations / seed sample data.

---

## 7️⃣ ACCEPTANCE CRITERIA

- ✅ Public church registration creates `Church (PENDING)` + first Admin user.
- ✅ Super Admin can:
    - Approve / suspend churches.
    - View and manage all churches.
- ✅ Admin can:
    - Manage branches, members, pastors, families, and church settings for *their* church only.
- ✅ Pastor is always a Member, with additional `PastorProfile`.
- ✅ Family model:
    - Admin creates/links Family from Member detail (Flow Option 2).
    - Wife and children are full Members, linked via `FamilyMember`.
    - Wedding anniversary stored at Family level.
- ✅ Pastors see only members in their assigned branches.
- ✅ Supabase Auth used for all users; no member login.
- ✅ All queries enforce strict tenant isolation (`churchId` + `churchSlug`).
- ✅ UI uses Next.js App Router + Tailwind + shadcn/ui with modern, responsive design.
- ✅ Loading, error, and empty states implemented for key list views.
- ✅ Code is TypeScript-first, with clear comments for non-trivial logic (multi-tenancy, Supabase auth integration, authorization).

---
