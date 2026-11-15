import { and, eq } from 'drizzle-orm';
import {
  db,
  properties,
  tenants,
  units,
  type PropertyRow,
  type TenantRow,
  type UnitRow,
} from '@workspace/db';
import type { MaintenanceInput, RentInput, TenantInput, UnitInput } from '@workspace/contracts';
import { activeTenancyForUnit, ACTIVE_TENANCY_STATUSES } from './workspace';
import { badRequest, conflict, notFound } from './http';

export async function requireProperty(userId: string, id: string): Promise<PropertyRow> {
  const [row] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.userId, userId), eq(properties.id, id)));
  if (!row) notFound('Property not found.');
  return row;
}

export async function requireUnit(userId: string, id: string): Promise<UnitRow> {
  const [row] = await db
    .select()
    .from(units)
    .where(and(eq(units.userId, userId), eq(units.id, id)));
  if (!row) notFound('Unit not found.');
  return row;
}

export async function requireTenant(userId: string, id: string): Promise<TenantRow> {
  const [row] = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.userId, userId), eq(tenants.id, id)));
  if (!row) notFound('Tenant not found.');
  return row;
}

const normalized = (value: string) => value.trim().toLowerCase();
const phoneDigits = (value: string) => value.replace(/\D/g, '');

export async function assertUnitDraft(
  userId: string,
  input: Pick<UnitInput, 'propertyId' | 'number' | 'type' | 'monthlyRent'>,
  currentUnitId?: string,
): Promise<void> {
  await requireProperty(userId, input.propertyId);

  if (!Number.isFinite(input.monthlyRent) || input.monthlyRent < 0) {
    badRequest('Monthly rent must be a non-negative number.');
  }

  const existing = await db
    .select()
    .from(units)
    .where(and(eq(units.userId, userId), eq(units.propertyId, input.propertyId)));

  const clash = existing.find(
    (unit) => unit.id !== currentUnitId && normalized(unit.number) === normalized(input.number),
  );
  if (clash) conflict(`Unit number "${input.number.trim()}" already exists for this property.`);
}

export async function assertTenantDraft(
  userId: string,
  input: TenantInput,
  current?: { tenantId?: string; tenancyId?: string },
): Promise<void> {
  const { tenancy } = input;
  const property = await requireProperty(userId, tenancy.propertyId);
  const unit = await requireUnit(userId, tenancy.unitId);

  if (unit.propertyId !== property.id) {
    badRequest('Select a unit from the chosen property.');
  }
  if (tenancy.leaseStart > tenancy.leaseEnd) {
    badRequest('Lease end date must be on or after the lease start date.');
  }
  if (tenancy.moveInDate > tenancy.leaseEnd) {
    badRequest('Move-in date cannot be after the lease end date.');
  }

  const profile = input.privateProfile;
  const idNumber = normalized(profile.idNumberOrPassport);
  const email = normalized(profile.email);
  const phone = phoneDigits(profile.phoneNumber);

  const existingTenants = await db
    .select()
    .from(tenants)
    .where(eq(tenants.userId, userId));

  const duplicate = existingTenants.some((tenant) => {
    if (tenant.id === current?.tenantId) return false;
    return Boolean(
      (idNumber && normalized(tenant.idNumberOrPassport) === idNumber) ||
        (email && normalized(tenant.email) === email) ||
        (phone && phoneDigits(tenant.phoneNumber) === phone),
    );
  });

  if (duplicate) {
    conflict('A tenant with the same ID/passport number, email, or phone number already exists.');
  }

  if (ACTIVE_TENANCY_STATUSES.includes(tenancy.status)) {
    if (unit.occupancyStatus === 'Maintenance') {
      badRequest('This unit is marked for maintenance and cannot be assigned an active tenancy.');
    }
    const clash = await activeTenancyForUnit(userId, unit.id, current?.tenancyId);
    if (clash) {
      conflict('This unit already has an active tenancy.');
    }
  }
}

export async function assertRentDraft(
  userId: string,
  input: Pick<RentInput, 'unitId' | 'tenantId'>,
): Promise<void> {
  const unit = await requireUnit(userId, input.unitId);
  const tenant = await requireTenant(userId, input.tenantId);
  const property = await requireProperty(userId, unit.propertyId);

  if (!property) badRequest('Select a unit from one of your properties.');
  if (!tenant) badRequest('Select one of your tenants.');
}

export async function assertMaintenanceDraft(
  userId: string,
  input: Pick<MaintenanceInput, 'propertyId' | 'unitId' | 'tenantId'>,
): Promise<void> {
  await requireProperty(userId, input.propertyId);

  if (input.unitId) {
    const unit = await requireUnit(userId, input.unitId);
    if (unit.propertyId !== input.propertyId) {
      badRequest('Select a unit from the chosen property.');
    }
  }
  if (input.tenantId) {
    await requireTenant(userId, input.tenantId);
  }
}
