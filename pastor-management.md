# Pastor Management – AI Implementation Prompt

## Role

You are a **senior full-stack engineer and UX-focused frontend developer**.

You will implement the **Pastor Management experience** for a multi-tenant Church Management SaaS using:

- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Supabase** for:
    - Postgres database
    - Auth (email/password)
    - Pastor login accounts

Your output must be **production-ready code**, strongly typed, and aligned with the UX described below.

---

## Context

This app is a **multi-tenant church management system**.

- Each **Church** is a tenant (`churchId`, `churchSlug`).
- Roles: `SUPER_ADMIN`, `ADMIN`, `PASTOR`.
- **PASTOR is also a Member**:
    - There is a `Member` table for all people.
    - There is a `PastorProfile` table that extends a `Member`.
    - There is a `PastorBranch` table that links pastors to branches.

**Pastor Management** is part of the **Church Admin module**:

- Base path: `/{churchSlug}/admin/pastors/*`
- Only `ADMIN` of that church can access it.

The goal of this prompt is to implement a **scalable, intuitive “Add Pastor” and “Manage Pastors” experience** that works for:

- Thousands of members (Member selection must be search-based, NOT a static dropdown).
- Hundreds of branches (Branch assignment must be search-based, NOT a long checkbox list).

---

## Goal

Implement:

1. A **Pastor List page**
2. A **“Create / Add Pastor” flow** with a **3-step wizard**
3. A **Pastor Detail page** for viewing and editing:
    - Pastor profile
    - Branch assignments

The UX must:

- Use **search-first selection** for Members.
- Use **searchable multi-select** for Branches.
- Separate the flow into **three focused steps**:
    1. Select Member
    2. Pastor Profile
    3. Branch Assignments

---

## Data Model (Simplified)

Assume these tables already exist in Supabase (or you create them):

### `Church`

- `id`
- `name`
- `slug`
- …

### `Branch`

- `id`
- `churchId`
- `name`
- `city`
- `address`
- `isActive`

### `Member`

- `id`
- `churchId`
- `branchId` (nullable)
- `firstName`
- `lastName`
- `email` (nullable)
- `phone` (nullable)
- `status` (`ACTIVE | INACTIVE`)
- `dateOfBirth` (nullable)
- `baptismDate` (nullable)
- …

### `PastorProfile`

- `id`
- `memberId` (FK → `Member`)
- `churchId`
- `title`
- `ordinationDate` (nullable)
- `bio` (nullable)

### `PastorBranch`

- `id`
- `churchId`
- `pastorProfileId` (FK → `PastorProfile`)
- `branchId` (FK → `Branch`)

### `User` (App user linked to Supabase Auth)

- `id` (UUID, same as Supabase auth user id)
- `email`
- `role` (`SUPER_ADMIN | ADMIN | PASTOR`)
- `churchId`
- `memberId` (nullable, used for PASTOR)

---

## UX – Pastor List Page

**Route:**

`/{churchSlug}/admin/pastors`

### Requirements

- Display a **table** of pastors for this church:
    - Name (from `Member`)
    - Title (from `PastorProfile`)
    - Email (from `Member` or `User`)
    - Assigned branches (comma-separated, badges)
- Include:
    - Search by pastor name.
    - Optional filter by branch.
- Use shadcn/ui components:
    - `Table`, `Input`, `Badge`, `Button`, `Card`, `Skeleton`, `DropdownMenu`.

### Actions

- Button **“Add pastor”** → navigates to `/{churchSlug}/admin/pastors/new`
- Each row:
    - “View / Edit” → `/{churchSlug}/admin/pastors/[pastorId]`

---

## UX – Add Pastor (3-Step Wizard)

**Route:**

`/{churchSlug}/admin/pastors/new`

This is a **single page** with an internal stepper, not three separate routes.

Use a layout like:

- Top: Page title `Add pastor`
- Below: Horizontal step indicator:
    - `1. Select member`
    - `2. Pastor profile`
    - `3. Branch assignments`

Only allow moving to the next step if current step is valid.

### STEP 1 – Select Member

### Goal

Select an existing **Member** or create a new one to become the pastor.

### UI

- A large **search field**, NOT a dropdown.
- Below it, a **list of matching members**.

Use shadcn/ui:

- `Command` or `CommandDialog` pattern OR a custom search panel with:
    - `Input`
    - `ScrollArea`
    - `CommandItem`style rows.

### Behaviour

- User types **name, phone, or email**.
- On each change, query Supabase for members:
    - Filtered by `churchId`.
    - Search in `firstName`, `lastName`, `email`, `phone`.
    - Limit to 10–20 results.
- Display each result as a row:
    - `Full Name`
    - `Branch name` (if available)
    - `Email or phone`
- When the admin clicks a row:
    - Mark that member as **selected**.
    - Show the selected member in a **summary card**:
    
    Example:
    
    > Selected member:
    > 
    > 
    > **John David** – Main Branch
    > 
    > [john@example.com](mailto:john@example.com) | +44 7700 123456
    > 
    > `[Change]` button to re-open search.
    > 
- If no matching member is found:
    - Show secondary button:
        
        > “Create new member”
        > 
    - Clicking it opens either:
        - A small inline form, or
        - A dialog that collects minimal member info:
            - firstName, lastName, email, phone, branch, status.
        - On submit:
            - Create the Member via API.
            - Auto-select that new member as the selected member.
- Once a member is selected:
    - Enable “Next” button to move to Step 2.

### Validation

- Step cannot continue without exactly **one** selected member.

---

### STEP 2 – Pastor Profile

### Goal

Capture pastor-specific information and login email.

### UI

Use a `Card` with a simple form:

- `Title` (Input or Select)
- `Ordination date` (Date picker – shadcn `Popover` + `Calendar`)
- `Bio` (Textarea)
- `Pastor login email`:
    - Defaulted to member email if present.
    - Editable.
    - Shows helper text:
        
        > “An invite email will be sent so they can set a password.”
        > 

Buttons:

- “Back” → returns to Step 1, keeping data.
- “Next” → validates and moves to Step 3.

### Behaviour

On final submission (Step 3) you will:

- Create `PastorProfile` for the selected `memberId`.
- Create a Supabase Auth user (if not yet present) and corresponding `User` row with:
    - `role = PASTOR`
    - `churchId`
    - `memberId`
- Optionally send an invite email (via Supabase or your own email handler).

### Validation

- `Title` is required.
- `Pastor login email` is required and must be unique among login users in this church.

---

### STEP 3 – Branch Assignments

### Goal

Assign this pastor to **one or more branches** using a scalable UI.

### UI

Use a **searchable multi-select** pattern instead of checkboxes.

Suggested implementation:

- A `Card` with:
    - Label: “Assign branches”
    - A search input at the top.
    - A scrollable list of branches below.
- Selected branches appear as **chips/badges** underneath, e.g.:

Use shadcn/ui:

- `Command` for searchable list, or custom:
- `Input` for search
- `ScrollArea` for list
- `Checkbox` + label for each row
- `Badge` or `Button variant="secondary"` for selected branch chips.

### Behaviour

- On page load, fetch all branches for this church (paginated or all, depending on size).
- Filter in the client by text search:
- Match on branch name and city.
- When clicking a branch row:
- Toggle selection state.
- Add/remove its chip from the “Assigned branches” section.
- If there are 100+ branches:
- Use efficient rendering (minimal DOM, virtualization if needed).
- But from the AI output, a simple filtered list with a `max-h` + scroll is OK as a start.

### Validation

- Allow saving even if **no branches** are selected (optional, configurable).
- Or require at least one branch.
- Show inline error if validation fails.

### Final Action

At the bottom of Step 3:

- “Back” button.
- Primary `Save pastor` button.

On click:

1. If this is a **new** pastor:
- Create `PastorProfile` with:
    - `memberId`
    - `churchId`
    - `title`, `ordinationDate`, `bio`
- Ensure Supabase ‘User’ exists with:
    - `role = PASTOR`
    - `churchId`
    - `memberId`
    - Invite email to `pastor login email`.
1. Create/replace `PastorBranch` rows for selected branches.

On success:

- Show a shadcn `Toast`:
- “Pastor created successfully.”
- Redirect to:
- `/{churchSlug}/admin/pastors`
- or `/{churchSlug}/admin/pastors/[pastorId]`

On error:

- Show error toast and inline error messages.

---

## Pastor Detail Page

**Route:**

`/{churchSlug}/admin/pastors/[pastorId]`

### Requirements

- Show **summary panel**:
- Member info (name, branch, email, phone)
- Title + ordination date
- Show **branch assignments section**:
- Same multi-select UX as Step 3 to adjust assignments.
- Allow editing:
- `title`, `ordinationDate`, `bio`
- Allow updating:
- branch assignments
- Reuse the same components used in the “Add pastor” flow, but pre-filled.

---

## Technical Requirements

- Use **Next.js App Router** with server components where appropriate.
- Use **Supabase JS client** for DB and auth.
- Implement backend operations either:
- Directly in server components / server actions, **or**
- Via `/app/api/.../route.ts` endpoints.
- All DB queries must enforce:
- `churchId` from Supabase session matches `churchSlug` route param.
- Use **shadcn/ui** for all UI elements:
- Layout, Card, Button, Input, Textarea, Table, Command, Select, Dialog, Calendar, Badge, Toast, Skeleton.

---

## Deliverables

Implement (at minimum):

1. **Pages/Routes**
- `/{churchSlug}/admin/pastors/page.tsx` – Pastor list.
- `/{churchSlug}/admin/pastors/new/page.tsx` – Add Pastor wizard.
- `/{churchSlug}/admin/pastors/[pastorId]/page.tsx` – Pastor detail & edit.
1. **Reusable Components**
- `MemberSearchSelector`:
    - Search input + result list + selected member card.
- `BranchMultiSelect`:
    - Search input + list + chips for selected branches.
- `PastorStepper`:
    - Simple stepper UI for the 3-step flow.
1. **Server Logic**
- Functions/helpers or API route handlers to:
    - Search members by text (limited, church-scoped).
    - Fetch branches (church-scoped).
    - Create a new Member (for “Create new member” flow).
    - Create PastorProfile.
    - Create/update PastorBranch assignments.
    - Create Supabase Auth user & User row for PASTOR.
1. **Types**
- TypeScript interfaces/types for:
    - `Member`, `PastorProfile`, `Branch`, `PastorBranch`.
- Props for React components should be fully typed.
1. **UX States**
- Loading states using Skeletons.
- Empty states (no pastors, no branches found, no members found).
- Error states with clear messages.
- Success toasts on create/update.

---

## Acceptance Criteria

- Member selection is **search-based**, not a static dropdown.
- Branch assignment is a **searchable multi-select**, not a long checkbox list.
- Add Pastor uses a **3-step flow**:
1. Select or create member
2. Fill pastor profile
3. Assign branches
- The code integrates correctly with **Supabase** (DB + auth).
- The UI uses **shadcn/ui** and **Tailwind**, is responsive and accessible.
- All operations are strictly scoped to the current `churchId` and `churchSlug`.
- Pastor is always backed by a `Member` and a `PastorProfile`, with optional `User` login for the PASTOR role.

Generate all necessary React components, server logic, and routing to fully implement this Pastor Management UX.
