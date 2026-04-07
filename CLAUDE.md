# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm dev         # Start dev server on localhost:3000
pnpm build       # Build for production
pnpm start       # Run production build
pnpm lint        # Run ESLint
```

No test runner is configured.

## Tech Stack

- **Next.js 14** with App Router (not Pages Router)
- **React 18** with TypeScript
- **Supabase** for auth (JWT email/password) and PostgreSQL database with Row Level Security
- **Tailwind CSS** + **shadcn/ui** (Radix UI primitives)
- **TanStack React Query** for server state management
- **Zod** for runtime validation
- **next-pwa** for offline PWA support

## Architecture Overview

### Multi-Tenancy Model

Every data table has a `church_id` column. URLs use `/{churchSlug}/admin/...` and `/{churchSlug}/pastor/...` patterns. The slug is resolved to a church ID via `lib/tenancy.ts`.

### Role-Based Access Control

| Role | Scope | Access |
|------|-------|--------|
| SUPER_ADMIN | Global | Manage all churches |
| ADMIN | Single Church | Manage branches, members, families, pastors, groups |
| PASTOR | Church + Assigned Branches | View members, manage meetings in assigned branches |

### Key Directories

- `app/api/` - API route handlers organized by scope (auth, admin, pastor, superadmin)
- `app/[churchSlug]/admin/` - Admin dashboard pages
- `app/[churchSlug]/pastor/` - Pastor dashboard pages
- `components/ui/` - shadcn/ui components
- `lib/` - Utilities including auth, tenancy, permissions, and Supabase clients
- `supabase/` - Database schema and migrations

### Supabase Clients

- `createSupabaseServerClient()` - Session-based, respects RLS (use in server components/routes)
- `createSupabaseAdminClient()` - Bypasses RLS with service role key (use sparingly)
- `createSupabaseBrowserClient()` - Browser client with auth persistence

## API Route Pattern

All route handlers follow this structure:

```typescript
const session = await getSessionUser();           // lib/auth.ts
assertRole(session.role, ["ADMIN"]);              // lib/permissions.ts
assertTenantMatch(session.churchId, resourceChurchId);

const supabase = createSupabaseAdminClient();
const { data } = await supabase
  .from("table")
  .select(...)
  .eq("church_id", session.churchId);             // Always filter by church_id
```

## Database Schema

Core tables in `supabase/schema.sql`:
- `church` - Tenant root with slug, status, plan
- `app_user` - Links to Supabase auth with role and church_id
- `branch`, `member`, `pastor_profile`, `pastor_branch`
- `family`, `family_member` - Family relationships
- `activity_log` - Audit trail

All tables have RLS policies enforcing church isolation via JWT claims.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Key Patterns

- **Cursor-based pagination** for member lists (not offset-based)
- **Zod schemas** for input validation in route handlers
- **`cn()` utility** from `lib/utils.ts` for conditional Tailwind classes
- **Family flow**: Create Member → Create Family from member page → Link relatives via family_member table
