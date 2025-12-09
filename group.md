
### `POST /api/admin/groups`
Create new group.

### `GET /api/admin/groups`
List groups for the church.

### `GET /api/admin/groups/[groupId]`
Group detail.

### `PATCH /api/admin/groups/[groupId]`
Update name, type, branch, description.

### `POST /api/admin/groups/[groupId]/members/add`
Add members to group (array of memberIds).

### `POST /api/admin/groups/[groupId]/members/remove`
Remove member from group.

### `GET /api/admin/groups/[groupId]/members`
List all members in the group.

### (Optional) Announcements:

- `POST /api/admin/groups/[groupId]/announcements`
- `GET /api/admin/groups/[groupId]/announcements`

All requests must:

- Validate Supabase session
- Validate user role = ADMIN
- Validate `churchSlug` matches user.churchId

---

# COMPONENTS TO GENERATE

Place inside `src/components/groups/*`.

You must generate:

- `GroupList`
- `GroupForm` (Create/Edit)
- `GroupMembersPanel`
- `GroupMemberSearch`
- `GroupMemberFilters`
- `GroupMemberList`
- `GroupAnnouncementsPanel`
- Utility: **age calculator**

Reuse UI primitives from shadcn:

- `Card`, `Input`, `ScrollArea`, `Table`, `Button`, `Sheet`, `Tabs`, `Badge`, `Checkbox`, `Separator`

---

# ACCEPTANCE CRITERIA

- Groups are created successfully.
- Admin can search and filter members.
- Admin can add/remove members efficiently.
- UI is mobile-first and intuitive.
- Works with **thousands of members**.
- Filters + search must be fast.
- Members must belong to the same church.
- Works with existing layout & navigation.
- Role validation and church validation enforced.
- Clean TypeScript code with proper types.
- Uses new admin nav entry “Groups”.

---

# DELIVERABLES

AI must output:

1. `Group` and `GroupMember` schema (Supabase SQL or Prisma).
2. API route implementations.
3. React components.
4. Pages for:
   - List groups  
   - Create group  
   - Group detail (members + announcements)
5. Integration into Admin navigation.
6. Tailwind + shadcn-based UI.

All code must **fit into the existing project** and follow existing coding patterns.
