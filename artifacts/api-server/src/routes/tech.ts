import { and, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import {
  db,
  maintenanceRequests,
  properties,
  rentRecords,
  tenancies,
  tenants,
  units,
  users,
} from '@workspace/db';
import { asyncHandler, notFound, parseBody, requireUuid, userId } from '../lib/http';
import { maintenanceInputSchema } from '@workspace/contracts';
import { loadWorkspace, mapMaintenance } from '../lib/workspace';

const router = Router();

/**
 * GET /tech/tickets - All maintenance requests (super admin)
 */
router.get(
  '/tickets',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const rows = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.userId, id))
      .orderBy(desc(maintenanceRequests.createdAt));

    res.json(rows.map(mapMaintenance));
  }),
);

/**
 * GET /tech/tickets/:id - Ticket detail
 */
router.get(
  '/tickets/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const ticketId = requireUuid(req.params.id);

    const [row] = await db
      .select()
      .from(maintenanceRequests)
      .where(and(eq(maintenanceRequests.userId, id), eq(maintenanceRequests.id, ticketId)))
      .limit(1);

    if (!row) notFound('Maintenance request not found.');
    res.json(mapMaintenance(row));
  }),
);

/**
 * PATCH /tech/tickets/:id - Update ticket status and resolution notes
 */
router.patch(
  '/tickets/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const ticketId = requireUuid(req.params.id);

    const [current] = await db
      .select()
      .from(maintenanceRequests)
      .where(and(eq(maintenanceRequests.userId, id), eq(maintenanceRequests.id, ticketId)))
      .limit(1);
    if (!current) notFound('Maintenance request not found.');

    const { status, description, priority } = req.body;
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (description !== undefined) updates.description = description;
    if (priority) updates.priority = priority;

    await db
      .update(maintenanceRequests)
      .set(updates)
      .where(and(eq(maintenanceRequests.userId, id), eq(maintenanceRequests.id, ticketId)));

    res.json(await loadWorkspace(id));
  }),
);

/**
 * GET /tech/users - All users in the platform (super admin)
 */
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const rows = await db
      .select({ id: users.id, email: users.email, fullName: users.fullName, role: users.role, tenantId: users.tenantId, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, id))
      .orderBy(desc(users.createdAt));

    res.json(rows);
  }),
);

/**
 * GET /tech/stats - Platform statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const id = userId(req);

    const [userCount] = await db.select({ count: users.id }).from(users).where(eq(users.id, id));
    const [propertyCount] = await db
      .select({ count: properties.id })
      .from(properties)
      .where(eq(properties.userId, id));
    const [unitCount] = await db
      .select({ count: units.id })
      .from(units)
      .where(eq(units.userId, id));
    const [tenantCount] = await db
      .select({ count: tenants.id })
      .from(tenants)
      .where(eq(tenants.userId, id));
    const [rentCount] = await db
      .select({ count: rentRecords.id })
      .from(rentRecords)
      .where(eq(rentRecords.userId, id));
    const [maintenanceCount] = await db
      .select({ count: maintenanceRequests.id })
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.userId, id));

    res.json({
      userCount: userCount.count,
      propertyCount: propertyCount.count,
      unitCount: unitCount.count,
      tenantCount: tenantCount.count,
      rentCount: rentCount.count,
      maintenanceCount: maintenanceCount.count,
    });
  }),
);

export default router;