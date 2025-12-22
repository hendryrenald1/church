import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type EntityType = "member" | "family" | "branch" | "pastor" | "group";

export type ActivityType =
  | "created"
  | "updated"
  | "deleted"
  | "member_added"
  | "member_removed"
  | "status_changed";

interface LogActivityParams {
  churchId: string;
  userId?: string;
  entityType: EntityType;
  entityId: string;
  activityType: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  churchId,
  userId,
  entityType,
  entityId,
  activityType,
  title,
  description,
  metadata = {}
}: LogActivityParams): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const activityLogQuery = supabase.from("activity_log");
  // @ts-expect-error Supabase type inference issue
  const { error } = await activityLogQuery.insert({
    church_id: churchId,
    user_id: userId ?? null,
    entity_type: entityType,
    entity_id: entityId,
    activity_type: activityType,
    title,
    description: description ?? null,
    metadata
  });

  if (error) {
    // Log but don't throw - activity logging shouldn't break the main operation
    console.error("Failed to log activity:", error);
  }
}
