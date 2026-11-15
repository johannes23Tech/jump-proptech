import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { db, properties } from '@workspace/db';
import { propertyInputSchema, propertyUpdateSchema } from '@workspace/contracts';
import { asyncHandler, parseBody, requireUuid, userId } from '../lib/http';
import { loadWorkspace } from '../lib/workspace';

const router = Router();

router.post(
  '/properties',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const input = parseBody(propertyInputSchema, req.body);
    await db.insert(properties).values({ userId: id, ...input });
    res.status(201).json(await loadWorkspace(id));
  }),
);

router.patch(
  '/properties/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const propertyId = requireUuid(req.params.id);
    const input = parseBody(propertyUpdateSchema, req.body);

    await db
      .update(properties)
      .set(input)
      .where(and(eq(properties.userId, id), eq(properties.id, propertyId)));

    res.json(await loadWorkspace(id));
  }),
);

router.delete(
  '/properties/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const propertyId = requireUuid(req.params.id);
    await db
      .delete(properties)
      .where(and(eq(properties.userId, id), eq(properties.id, propertyId)));
    res.json(await loadWorkspace(id));
  }),
);

export default router;
