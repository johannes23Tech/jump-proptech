import { and, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { db, roles, userRoles, users } from '@workspace/db';
import { asyncHandler, notFound, parseBody, requireUuid, userId } from '../lib/http';
import { z } from 'zod/v4';

const router = Router();

const roleInputSchema = z.object({
  name: z.string().min(1, 'Role name is required.').max(100),
  slug: z.string().min(1, 'Slug is required.').max(50).regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase alphanumeric with hyphens or underscores.'),
  description: z.string().max(500).default(''),
  permissions: z.array(z.string()).default([]),
});

const roleUpdateSchema = roleInputSchema.partial();

/**
 * GET /admin/roles - List all roles
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const rows = await db
      .select()
      .from(roles)
      .where(eq(roles.createdBy, id))
      .orderBy(desc(roles.createdAt));

    res.json(rows);
  }),
);

/**
 * POST /admin/roles - Create a custom role
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const input = parseBody(roleInputSchema, req.body);

    const [existing] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.slug, input.slug))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: 'A role with this slug already exists.' });
      return;
    }

    const [role] = await db
      .insert(roles)
      .values({
        name: input.name,
        slug: input.slug,
        description: input.description,
        permissions: input.permissions,
        createdBy: id,
      })
      .returning();

    res.status(201).json(role);
  }),
);

/**
 * PATCH /admin/roles/:id - Update a role
 */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const roleId = requireUuid(req.params.id);
    const input = parseBody(roleUpdateSchema, req.body);

    const [existing] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.createdBy, id)))
      .limit(1);
    if (!existing) notFound('Role not found.');

    const [role] = await db
      .update(roles)
      .set(input)
      .where(and(eq(roles.id, roleId), eq(roles.createdBy, id)))
      .returning();

    res.json(role);
  }),
);

/**
 * DELETE /admin/roles/:id - Delete a role
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const roleId = requireUuid(req.params.id);

    const [existing] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.createdBy, id)))
      .limit(1);
    if (!existing) notFound('Role not found.');

    await db.delete(roles).where(and(eq(roles.id, roleId), eq(roles.createdBy, id)));
    res.status(204).end();
  }),
);

/**
 * POST /admin/users/:userId/roles - Assign a role to a user
 */
router.post(
  '/users/:userId/roles',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const targetUserId = requireUuid(req.params.userId);
    const { roleId } = z.object({ roleId: z.string().uuid() }).parse(req.body);

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);
    if (!targetUser) notFound('User not found.');

    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);
    if (!role) notFound('Role not found.');

    const [existing] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, targetUserId), eq(userRoles.roleId, roleId)))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: 'User already has this role.' });
      return;
    }

    await db.insert(userRoles).values({
      userId: targetUserId,
      roleId,
      assignedBy: id,
    });

    res.status(201).json({ message: 'Role assigned successfully.' });
  }),
);

/**
 * DELETE /admin/users/:userId/roles/:roleId - Remove a role from a user
 */
router.delete(
  '/users/:userId/roles/:roleId',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const targetUserId = requireUuid(req.params.userId);
    const roleId = requireUuid(req.params.roleId);

    await db
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, targetUserId),
          eq(userRoles.roleId, roleId),
        ),
      );

    res.status(204).end();
  }),
);

/**
 * GET /admin/users/:userId/roles - Get roles assigned to a user
 */
router.get(
  '/users/:userId/roles',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const targetUserId = requireUuid(req.params.userId);

    const rows = await db
      .select({
        roleId: roles.id,
        slug: roles.slug,
        name: roles.name,
        permissions: roles.permissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, targetUserId));

    res.json(rows);
  }),
);

export default router;