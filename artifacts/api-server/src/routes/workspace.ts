import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { db, properties, tenants, users } from '@workspace/db';
import { profileInputSchema } from '@workspace/contracts';
import { asyncHandler, conflict, parseBody, userId } from '../lib/http';
import { loadWorkspace } from '../lib/workspace';

const router = Router();

router.get(
  '/workspace',
  asyncHandler(async (req, res) => {
    res.json(await loadWorkspace(userId(req)));
  }),
);

router.patch(
  '/profile',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const input = parseBody(profileInputSchema, req.body);

    if (input.email) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      if (existing && existing.id !== id) {
        conflict('That email address is already used by another account.');
      }
    }

    await db
      .update(users)
      .set({
        fullName: input.name,
        email: input.email ? input.email.toLowerCase() : undefined,
        phone: input.phone,
        company: input.company,
      })
      .where(eq(users.id, id));

    res.json(await loadWorkspace(id));
  }),
);

router.delete(
  '/workspace',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    await db.delete(properties).where(eq(properties.userId, id));
    await db.delete(tenants).where(eq(tenants.userId, id));
    res.json(await loadWorkspace(id));
  }),
);

export default router;
