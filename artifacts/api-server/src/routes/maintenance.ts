import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { db, maintenanceRequests } from '@workspace/db';
import { maintenanceInputSchema } from '@workspace/contracts';
import { asyncHandler, notFound, parseBody, requireUuid, userId } from '../lib/http';
import { assertMaintenanceDraft } from '../lib/rules';
import { loadWorkspace, mapMaintenance } from '../lib/workspace';

const router = Router();

type MaintenanceShape = ReturnType<typeof maintenanceInputSchema.parse>;

function columns(input: MaintenanceShape) {
  return {
    propertyId: input.propertyId,
    unitId: input.unitId || null,
    tenantId: input.tenantId || null,
    title: input.title,
    description: input.description,
    priority: input.priority,
    status: input.status,
  };
}

router.post(
  '/maintenance',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const input = parseBody(maintenanceInputSchema, req.body);
    await assertMaintenanceDraft(id, input);
    await db.insert(maintenanceRequests).values({ userId: id, ...columns(input) });
    res.status(201).json(await loadWorkspace(id));
  }),
);

router.patch(
  '/maintenance/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const requestId = requireUuid(req.params.id);

    const [current] = await db
      .select()
      .from(maintenanceRequests)
      .where(and(eq(maintenanceRequests.userId, id), eq(maintenanceRequests.id, requestId)));
    if (!current) notFound('Maintenance request not found.');

    const changes = parseBody(maintenanceInputSchema.partial(), req.body);
    const merged = parseBody(maintenanceInputSchema, {
      ...mapMaintenance(current),
      ...changes,
    });

    await assertMaintenanceDraft(id, merged);

    await db
      .update(maintenanceRequests)
      .set(columns(merged))
      .where(and(eq(maintenanceRequests.userId, id), eq(maintenanceRequests.id, requestId)));

    res.json(await loadWorkspace(id));
  }),
);

router.delete(
  '/maintenance/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const requestId = requireUuid(req.params.id);
    await db
      .delete(maintenanceRequests)
      .where(and(eq(maintenanceRequests.userId, id), eq(maintenanceRequests.id, requestId)));
    res.json(await loadWorkspace(id));
  }),
);

export default router;
