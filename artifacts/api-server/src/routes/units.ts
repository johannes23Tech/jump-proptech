import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { db, units } from '@workspace/db';
import { unitInputSchema } from '@workspace/contracts';
import { asyncHandler, badRequest, notFound, parseBody, requireUuid, userId } from '../lib/http';
import { assertUnitDraft } from '../lib/rules';
import { activeTenancyForUnit, loadWorkspace } from '../lib/workspace';

const router = Router();

router.post(
  '/units',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const input = parseBody(unitInputSchema, req.body);
    await assertUnitDraft(id, input);

    await db.insert(units).values({
      userId: id,
      propertyId: input.propertyId,
      number: input.number,
      type: input.type,
      monthlyRent: input.monthlyRent,
      occupancyStatus: input.occupancyStatus === 'Occupied' ? 'Vacant' : input.occupancyStatus,
    });

    res.status(201).json(await loadWorkspace(id));
  }),
);

router.patch(
  '/units/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const unitId = requireUuid(req.params.id);

    const [current] = await db
      .select()
      .from(units)
      .where(and(eq(units.userId, id), eq(units.id, unitId)));
    if (!current) notFound('Unit not found.');

    const changes = parseBody(unitInputSchema.partial(), req.body);
    const merged = {
      propertyId: changes.propertyId ?? current.propertyId,
      number: changes.number ?? current.number,
      type: changes.type ?? current.type,
      monthlyRent: changes.monthlyRent ?? current.monthlyRent,
      occupancyStatus:
        changes.occupancyStatus ??
        (current.occupancyStatus === 'Occupied' ? 'Vacant' : current.occupancyStatus),
    };

    await assertUnitDraft(id, merged, unitId);

    const active = await activeTenancyForUnit(id, unitId);

    if (merged.propertyId !== current.propertyId && active) {
      badRequest('This unit is occupied. Reassign the tenancy before changing its property.');
    }
    if (merged.occupancyStatus === 'Maintenance' && active) {
      badRequest('This unit is occupied. End the tenancy before marking it for maintenance.');
    }

    await db
      .update(units)
      .set({
        propertyId: merged.propertyId,
        number: merged.number,
        type: merged.type,
        monthlyRent: merged.monthlyRent,
        occupancyStatus:
          merged.occupancyStatus === 'Occupied' ? 'Vacant' : merged.occupancyStatus,
      })
      .where(and(eq(units.userId, id), eq(units.id, unitId)));

    res.json(await loadWorkspace(id));
  }),
);

router.delete(
  '/units/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const unitId = requireUuid(req.params.id);
    await db.delete(units).where(and(eq(units.userId, id), eq(units.id, unitId)));
    res.json(await loadWorkspace(id));
  }),
);

export default router;
