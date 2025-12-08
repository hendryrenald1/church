import { AppRole } from "./auth";

export function assertRole(role: AppRole | undefined, allowed: AppRole[]) {
  if (!role || !allowed.includes(role)) {
    const error = new Error("Forbidden");
    // attach simple flag for route handlers
    (error as any).status = 403;
    throw error;
  }
}

export function assertTenantMatch(
  sessionChurchId: string | undefined,
  tenantChurchId: string
) {
  if (!sessionChurchId || sessionChurchId !== tenantChurchId) {
    const error = new Error("Tenant mismatch");
    (error as any).status = 403;
    throw error;
  }
}

