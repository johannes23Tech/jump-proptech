import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { db, rentRecords } from '@workspace/db';
import { rentInputSchema } from '@workspace/contracts';
import { asyncHandler, notFound, parseBody, requireUuid, userId } from '../lib/http';
import { assertRentDraft } from '../lib/rules';
import { loadWorkspace, mapRentRecord } from '../lib/workspace';

const router = Router();

type RentInputShape = ReturnType<typeof rentInputSchema.parse>;

function columns(input: RentInputShape) {
  return {
    unitId: input.unitId,
    tenantId: input.tenantId,
    month: input.month,
    amount: input.amount,
    dueDate: input.dueDate,
    status: input.status,
    paymentMethod: input.paymentMethod,
    paidDate: input.paidDate || null,
  };
}

router.post(
  '/rent',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const input = parseBody(rentInputSchema, req.body);
    await assertRentDraft(id, input);
    await db.insert(rentRecords).values({ userId: id, ...columns(input) });
    res.status(201).json(await loadWorkspace(id));
  }),
);

router.patch(
  '/rent/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const recordId = requireUuid(req.params.id);

    const [current] = await db
      .select()
      .from(rentRecords)
      .where(and(eq(rentRecords.userId, id), eq(rentRecords.id, recordId)));
    if (!current) notFound('Rent record not found.');

    const changes = parseBody(rentInputSchema.partial(), req.body);
    const merged = parseBody(rentInputSchema, {
      ...mapRentRecord(current),
      ...changes,
    });

    await assertRentDraft(id, merged);

    await db
      .update(rentRecords)
      .set(columns(merged))
      .where(and(eq(rentRecords.userId, id), eq(rentRecords.id, recordId)));

    res.json(await loadWorkspace(id));
  }),
);

router.delete(
  '/rent/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const recordId = requireUuid(req.params.id);
    await db.delete(rentRecords).where(and(eq(rentRecords.userId, id), eq(rentRecords.id, recordId)));
    res.json(await loadWorkspace(id));
  }),
);

export default router;
