import { NextRequest } from "next/server";

/**
 * Check admin auth via ADMIN_SECRET header
 */
export function isAdmin(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;
  return secret === adminSecret;
}

/**
 * Validate session ID from request header
 */
export function getSessionId(request: NextRequest): string | null {
  return request.headers.get("x-session-id");
}
