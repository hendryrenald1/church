# Church Multi-Tenant Platform

Next.js App Router + TypeScript + Tailwind + shadcn/ui + Supabase (Auth + Postgres + RLS). Multi-tenant by church, role-based (SUPER_ADMIN, ADMIN, PASTOR), member-first family flow.

## Setup
1) Install deps: `pnpm install` (or npm/yarn).
2) Create Supabase project. Set env vars:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://... (optional, for Prisma)
```
3) Apply schema: `supabase db push` or run `supabase/schema.sql`.
4) Start dev: `pnpm dev`.

## Tenancy
- Every table carries `church_id`.
- URLs include `/{churchSlug}/...` for admin/pastor modules.
- Server resolves slug -> church.id (see `lib/tenancy.ts`); non-superadmin requests must have `session.churchId === church.id`.
- Supabase RLS mirrors the same rule; SUPER_ADMIN bypasses.

## Roles
- SUPER_ADMIN: global access, manages churches, approve/suspend.
- ADMIN: scoped to one church; manages branches, members, pastors, families, settings.
- PASTOR: scoped to one church + assigned branches (`pastor_branch`).
- Members do not log in; only Admin/Pastor users exist in Auth.

## Auth
- Supabase Auth email/password.
- JWT custom claims: `role`, `church_id`, `member_id`.
- Helpers: `lib/auth.ts`, `lib/permissions.ts`, `lib/tenancy.ts`, `lib/supabase/server.ts|client.ts`.

## Member-first → Family flow
1) Admin creates Member.
2) From member detail: “Create Family” inserts `family` + `family_member (HEAD)`.
3) Add spouse/children by linking members via `family_member`; wedding anniversary stored on `family`.
4) Removing from family deletes `family_member` row only.

## Modules (pages)
- Public: `/` landing, `/auth/register-church`, `/auth/login`.
- Super Admin: `/superadmin/dashboard`, `/superadmin/churches`, `/superadmin/churches/new`, `/superadmin/churches/[churchId]`.
- Admin (tenant): `/{slug}/admin/dashboard`, `branches`, `members`, `families`, `pastors`, `settings/church`, `settings/branding`.
- Pastor (tenant): `/{slug}/pastor/dashboard`, `members`, `members/[memberId]`, `members/new`.

## APIs (stubs wired to Supabase)
- Auth: `/api/auth/register-church`, `/api/auth/login`, `/api/auth/logout`.
- Super Admin: `/api/superadmin/churches`, `/api/superadmin/churches/[churchId]`, `/api/superadmin/churches/[churchId]/impersonate`.
- Admin: `/api/admin/branches`, `/api/admin/branches/[branchId]`, `/api/admin/members`, `/api/admin/members/[memberId]`, `/api/admin/families`, `/api/admin/families/[familyId]`, `/api/admin/families/[familyId]/add-member`, `/api/admin/families/members/[familyMemberId]`, `/api/admin/pastors`, `/api/admin/pastors/[pastorId]`, `/api/admin/pastor-branches`, `/api/admin/pastor-branches/[id]`, `/api/admin/church`, `/api/admin/church/branding`.
- Pastor: `/api/pastor/members`, `/api/pastor/members/[memberId]`.

## Migrations / seed
- Use Supabase CLI or Prisma migrations (`prisma migrate dev`) pointed at Supabase.
- Seed idea: create SUPER_ADMIN user; insert example church, admin, branch, member/pastor, family.

## Notes
- UI uses shadcn primitives; add actual components as you build.
- RLS already enables tenant isolation; ensure JWT claims are set when creating users.
- Impersonation endpoint is stubbed; implement via Supabase auth admin token swap if needed.

