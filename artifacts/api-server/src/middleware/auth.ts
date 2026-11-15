import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from 'express';
import { db, sessions, users, roles, userRoles } from '@workspace/db';
import { hashSessionToken } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';

export const SESSION_COOKIE = 'jp_session';

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        role: string;
        tenantId: string | null;
        permissions: string[];
      };
    }
  }
}

export const requireUser: RequestHandler = async (req, res, next) => {
  // Try Bearer token first, then cookie
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies?.[SESSION_COOKIE]) {
    token = req.cookies[SESSION_COOKIE];
  }

  if (!token) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }

  try {
    // Verify the JWT with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      res.clearCookie(SESSION_COOKIE);
      res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
      return;
    }

    const supabaseUser = data.user;

    // Look up our internal user record for role/tenant info
    const [userRow] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
      })
      .from(users)
      .where(eq(users.id, supabaseUser.id))
      .limit(1);

    if (!userRow) {
      res.status(401).json({ error: 'Account not found in workspace.' });
      return;
    }

    // Fetch assigned roles and permissions
    const assignedRoles = await db
      .select({
        roleId: roles.id,
        slug: roles.slug,
        name: roles.name,
        permissions: roles.permissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userRow.id),
          eq(userRoles.roleId, roles.id),
        ),
      );

    // Collect all permissions from assigned roles
    const allPermissions = new Set<string>();
    for (const r of assignedRoles) {
      if (r.permissions && Array.isArray(r.permissions)) {
        for (const perm of r.permissions) {
          allPermissions.add(String(perm));
        }
      }
    }

    req.authUser = {
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
      tenantId: userRow.tenantId ?? null,
      permissions: Array.from(allPermissions),
    };

    next();
  } catch {
    res.clearCookie(SESSION_COOKIE);
    res.status(401).json({ error: 'Authentication failed.' });
  }
};

/**
 * Middleware factory: require one of the specified roles.
 * Usage: requireRole(['landlord', 'tech'])
 */
export function requireRole(allowedRoles: string[]): RequestHandler {
  return (req, res, next) => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: 'Not signed in.' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    next();
  };
}

/**
 * Middleware factory: require a specific permission.
 * Usage: requirePermission('manage_tenants')
 */
export function requirePermission(permission: string): RequestHandler {
  return (req, res, next) => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: 'Not signed in.' });
      return;
    }

    if (!user.permissions.includes(permission)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    next();
  };
}

/**
 * Middleware: tenant can only access their own records; landlord/tech can access all.
 */
export function requireOwnershipOrRole(
  allowedRoles: string[],
): RequestHandler {
  return (req, res, next) => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: 'Not signed in.' });
      return;
    }

    if (allowedRoles.includes(user.role)) {
      return next();
    }

    // For tenants: ensure they only access their own tenantId
    const targetTenantId = req.params.tenantId || req.body?.tenantId;
    if (user.role === 'tenant' && user.tenantId && targetTenantId === user.tenantId) {
      return next();
    }

    res.status(403).json({ error: 'Insufficient permissions.' });
  };
}
