import { and, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { db, tenancies, tenants } from '@workspace/db';
import { tenantInputSchema } from '@workspace/contracts';
import { asyncHandler, notFound, parseBody, requireUuid, userId } from '../lib/http';
import { assertTenantDraft, requireTenant } from '../lib/rules';
import { loadWorkspace } from '../lib/workspace';

const router = Router();

function tenantColumns(input: ReturnType<typeof tenantInputSchema.parse>) {
  const profile = input.privateProfile;
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    idNumberOrPassport: profile.idNumberOrPassport,
    phoneNumber: profile.phoneNumber,
    whatsappNumber: profile.whatsappNumber,
    email: profile.email,
    emergencyContact: profile.emergencyContact,
    nextOfKin: profile.nextOfKin,
    employer: profile.employer,
    notes: profile.notes,
  };
}

router.post(
  '/tenants',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const input = parseBody(tenantInputSchema, req.body);
    await assertTenantDraft(id, input);

    await db.transaction(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({ userId: id, ...tenantColumns(input) })
        .returning();

      await tx.insert(tenancies).values({
        userId: id,
        tenantId: tenant.id,
        propertyId: input.tenancy.propertyId,
        unitId: input.tenancy.unitId,
        moveInDate: input.tenancy.moveInDate,
        leaseStart: input.tenancy.leaseStart,
        leaseEnd: input.tenancy.leaseEnd,
        monthlyRent: input.tenancy.monthlyRent,
        depositAmount: input.tenancy.depositAmount,
        paymentDueDay: input.tenancy.paymentDueDay,
        status: input.tenancy.status,
      });
    });

    res.status(201).json(await loadWorkspace(id));
  }),
);

router.patch(
  '/tenants/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const tenantId = requireUuid(req.params.id);
    await requireTenant(id, tenantId);

    const input = parseBody(tenantInputSchema, req.body);

    let tenancyId = input.tenancyId;
    if (tenancyId) {
      const [existing] = await db
        .select({ id: tenancies.id })
        .from(tenancies)
        .where(
          and(
            eq(tenancies.userId, id),
            eq(tenancies.id, tenancyId),
            eq(tenancies.tenantId, tenantId),
          ),
        );
      if (!existing) notFound('Tenancy not found.');
    } else {
      const [latest] = await db
        .select({ id: tenancies.id })
        .from(tenancies)
        .where(and(eq(tenancies.userId, id), eq(tenancies.tenantId, tenantId)))
        .orderBy(desc(tenancies.createdAt), desc(tenancies.leaseStart))
        .limit(1);
      tenancyId = latest?.id;
    }

    await assertTenantDraft(id, input, { tenantId, tenancyId });

    await db.transaction(async (tx) => {
      await tx
        .update(tenants)
        .set(tenantColumns(input))
        .where(and(eq(tenants.userId, id), eq(tenants.id, tenantId)));

      const values = {
        propertyId: input.tenancy.propertyId,
        unitId: input.tenancy.unitId,
        moveInDate: input.tenancy.moveInDate,
        leaseStart: input.tenancy.leaseStart,
        leaseEnd: input.tenancy.leaseEnd,
        monthlyRent: input.tenancy.monthlyRent,
        depositAmount: input.tenancy.depositAmount,
        paymentDueDay: input.tenancy.paymentDueDay,
        status: input.tenancy.status,
      };

      if (tenancyId) {
        await tx
          .update(tenancies)
          .set(values)
          .where(and(eq(tenancies.userId, id), eq(tenancies.id, tenancyId)));
      } else {
        await tx.insert(tenancies).values({ userId: id, tenantId, ...values });
      }
    });

    res.json(await loadWorkspace(id));
  }),
);

router.delete(
  '/tenants/:id',
  asyncHandler(async (req, res) => {
    const id = userId(req);
    const tenantId = requireUuid(req.params.id);
    await db.delete(tenants).where(and(eq(tenants.userId, id), eq(tenants.id, tenantId)));
    res.json(await loadWorkspace(id));
  }),
);

export default router;
