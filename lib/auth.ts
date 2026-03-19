import { NextRequest } from "next/server";

/**
 * Check admin auth via x-admin-pwd header
 */
export function isAdmin(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-pwd");
  const adminPwd = process.env.ADMIN_PWD;
  if (!adminPwd) return false;
  return secret === adminPwd;
}

/**
 * Validate session ID from request header
 */
export function getSessionId(request: NextRequest): string | null {
  return request.headers.get("x-session-id");
}
