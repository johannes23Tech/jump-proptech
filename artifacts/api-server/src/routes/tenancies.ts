import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { db, tenancies } from '@workspace/db';
import { asyncHandler, requireUuid, userId } from '../lib/http';
import { loadWorkspace } from '../lib/workspace';

const router = Router();

router.post(
  '/tenancies/:id/end',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const tenancyId = requireUuid(req.params.id);
    await db
      .update(tenancies)
      .set({ status: 'Ended' })
      .where(and(eq(tenancies.userId, id), eq(tenancies.id, tenancyId)));
    res.json(await loadWorkspace(id));
  }),
);

export default router;
