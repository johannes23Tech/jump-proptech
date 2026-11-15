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
import { loadWorkspace, mapMaintenance, mapRentRecord, mapTenancy } from '../lib/workspace';

const router = Router();

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const [user] = await db
      .select({ id: users.id, email: users.email, fullName: users.fullName, phone: users.phone, role: users.role, tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) notFound('User not found.');

    let tenantProfile = null;
    if (user.tenantId) {
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);
      if (tenant) {
        tenantProfile = {
          id: tenant.id,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          fullName: `${tenant.firstName} ${tenant.lastName}`.trim(),
          phoneNumber: tenant.phoneNumber,
          whatsappNumber: tenant.whatsappNumber,
          email: tenant.email,
          idNumberOrPassport: tenant.idNumberOrPassport,
          emergencyContact: tenant.emergencyContact,
          nextOfKin: tenant.nextOfKin,
          employer: tenant.employer,
          notes: tenant.notes,
          createdAt: tenant.createdAt,
        };
      }
    }

    res.json({ user, tenant: tenantProfile });
  }),
);

router.get(
  '/lease',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const [user] = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user || !user.tenantId) {
      res.status(404).json({ error: 'No tenant profile linked to this account.' });
      return;
    }

    const [tenancy] = await db
      .select()
      .from(tenancies)
      .where(
        and(
          eq(tenancies.tenantId, user.tenantId),
          eq(tenancies.status, 'Active'),
        ),
      )
      .orderBy(desc(tenancies.leaseStart))
      .limit(1);

    if (!tenancy) {
      res.status(404).json({ error: 'No active lease found.' });
      return;
    }

    const [unit] = await db.select().from(units).where(eq(units.id, tenancy.unitId)).limit(1);
    const [property] = await db.select().from(properties).where(eq(properties.id, tenancy.propertyId)).limit(1);

    res.json({
      ...mapTenancy(tenancy),
      unit: unit ? { id: unit.id, number: unit.number, type: unit.type, monthlyRent: unit.monthlyRent } : null,
      property: property ? { id: property.id, name: property.name, address: property.address, city: property.city } : null,
    });
  }),
);

router.get(
  '/rent',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const [user] = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user || !user.tenantId) {
      res.status(404).json({ error: 'No tenant profile linked to this account.' });
      return;
    }

    const rows = await db
      .select()
      .from(rentRecords)
      .where(eq(rentRecords.tenantId, user.tenantId))
      .orderBy(desc(rentRecords.dueDate));

    res.json(rows.map(mapRentRecord));
  }),
);

router.get(
  '/maintenance',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const [user] = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user || !user.tenantId) {
      res.status(404).json({ error: 'No tenant profile linked to this account.' });
      return;
    }

    const rows = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.tenantId, user.tenantId))
      .orderBy(desc(maintenanceRequests.createdAt));

    res.json(rows.map(mapMaintenance));
  }),
);

router.post(
  '/maintenance',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const [user] = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user || !user.tenantId) {
      res.status(404).json({ error: 'No tenant profile linked to this account.' });
      return;
    }

    const input = parseBody(maintenanceInputSchema, req.body);
    await db.insert(maintenanceRequests).values({
      userId: id,
      propertyId: input.propertyId,
      unitId: input.unitId || null,
      tenantId: user.tenantId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: 'Open',
    });

    res.status(201).json(await loadWorkspace(id));
  }),
);

router.get(
  '/statement/:period',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const { period } = req.params;
    const [user] = await db
      .select({ tenantId: users.tenantId, fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user || !user.tenantId) {
      res.status(404).json({ error: 'No tenant profile linked to this account.' });
      return;
    }

    const periodMap: Record<string, number> = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '12months': 12,
    };
    const months = periodMap[period as keyof typeof periodMap];
    if (!months) {
      res.status(400).json({ error: 'Invalid period. Use 1month, 3months, 6months, or 12months.' });
      return;
    }

    const rows = await db
      .select()
      .from(rentRecords)
      .where(eq(rentRecords.tenantId, user.tenantId))
      .orderBy(desc(rentRecords.dueDate));

    const totalDue = rows.reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = rows.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0);
    const outstanding = totalDue - totalPaid;

    res.json({
      period,
      tenant: {
        name: user.fullName,
        email: user.email,
      },
      generatedAt: new Date().toISOString(),
      records: rows.map(mapRentRecord),
      summary: {
        totalDue,
        totalPaid,
        outstanding,
        recordCount: rows.length,
      },
    });
  }),
);

export default router;