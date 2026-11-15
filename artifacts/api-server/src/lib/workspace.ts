import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import {
  db,
  maintenanceRequests,
  properties,
  rentRecords,
  tenancies,
  tenants,
  units,
  users,
  type MaintenanceRequestRow,
  type PropertyRow,
  type RentRecordRow,
  type TenancyRow,
  type TenantRow,
  type UnitRow,
  type UserRow,
} from '@workspace/db';
import type {
  MaintenanceRequest,
  Property,
  PublicUser,
  RentRecord,
  Tenancy,
  Tenant,
  TenancyStatus,
  Unit,
  Workspace,
} from '@workspace/contracts';

export const ACTIVE_TENANCY_STATUSES: TenancyStatus[] = ['Active', 'Notice given'];

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    company: row.company,
    phone: row.phone,
    role: row.role,
    tenantId: row.tenantId ?? null,
  };
}

export function mapProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address,
    suburb: row.suburb,
    city: row.city,
    province: row.province,
    postalCode: row.postalCode,
    description: row.description,
    createdAt: row.createdAt,
  };
}

export function mapTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: `${row.firstName} ${row.lastName}`.trim(),
    privateProfile: {
      idNumberOrPassport: row.idNumberOrPassport,
      phoneNumber: row.phoneNumber,
      whatsappNumber: row.whatsappNumber,
      email: row.email,
      emergencyContact: row.emergencyContact,
      nextOfKin: row.nextOfKin,
      employer: row.employer,
      notes: row.notes,
    },
    createdAt: row.createdAt,
  };
}

export function mapTenancy(row: TenancyRow): Tenancy {
  return {
    id: row.id,
    tenantId: row.tenantId,
    propertyId: row.propertyId,
    unitId: row.unitId,
    moveInDate: row.moveInDate,
    leaseStart: row.leaseStart,
    leaseEnd: row.leaseEnd,
    monthlyRent: row.monthlyRent,
    depositAmount: row.depositAmount,
    paymentDueDay: row.paymentDueDay,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export function mapUnit(row: UnitRow, activeTenancy?: TenancyRow): Unit {
  const occupied = Boolean(activeTenancy);
  const occupancyStatus = occupied
    ? 'Occupied'
    : row.occupancyStatus === 'Maintenance'
      ? 'Maintenance'
      : 'Vacant';

  return {
    id: row.id,
    propertyId: row.propertyId,
    number: row.number,
    type: row.type,
    monthlyRent: row.monthlyRent,
    occupancyStatus,
    tenantId: activeTenancy?.tenantId ?? '',
  };
}

export function mapRentRecord(row: RentRecordRow): RentRecord {
  return {
    id: row.id,
    unitId: row.unitId,
    tenantId: row.tenantId,
    month: row.month,
    amount: row.amount,
    dueDate: row.dueDate,
    status: row.status,
    paymentMethod: row.paymentMethod,
    paidDate: row.paidDate ?? '',
  };
}

export function mapMaintenance(row: MaintenanceRequestRow): MaintenanceRequest {
  return {
    id: row.id,
    propertyId: row.propertyId,
    unitId: row.unitId ?? '',
    tenantId: row.tenantId ?? '',
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export async function loadWorkspace(userId: string): Promise<Workspace> {
  const [userRows, propertyRows, unitRows, tenantRows, tenancyRows, rentRows, maintenanceRows] =
    await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db
        .select()
        .from(properties)
        .where(eq(properties.userId, userId))
        .orderBy(asc(properties.createdAt), asc(properties.name)),
      db
        .select()
        .from(units)
        .where(eq(units.userId, userId))
        .orderBy(asc(units.number)),
      db
        .select()
        .from(tenants)
        .where(eq(tenants.userId, userId))
        .orderBy(asc(tenants.lastName), asc(tenants.firstName)),
      db
        .select()
        .from(tenancies)
        .where(eq(tenancies.userId, userId))
        .orderBy(desc(tenancies.createdAt), desc(tenancies.leaseStart)),
      db
        .select()
        .from(rentRecords)
        .where(eq(rentRecords.userId, userId))
        .orderBy(desc(rentRecords.dueDate)),
      db
        .select()
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.userId, userId))
        .orderBy(desc(maintenanceRequests.createdAt)),
    ]);

  const user = userRows[0];
  if (!user) {
    throw new Error('Account no longer exists.');
  }

  const activeByUnit = new Map<string, TenancyRow>();
  for (const tenancy of tenancyRows) {
    if (ACTIVE_TENANCY_STATUSES.includes(tenancy.status) && !activeByUnit.has(tenancy.unitId)) {
      activeByUnit.set(tenancy.unitId, tenancy);
    }
  }

  return {
    user: toPublicUser(user),
    properties: propertyRows.map(mapProperty),
    units: unitRows.map((unit) => mapUnit(unit, activeByUnit.get(unit.id))),
    tenants: tenantRows.map(mapTenant),
    tenancies: tenancyRows.map(mapTenancy),
    rent: rentRows.map(mapRentRecord),
    maintenance: maintenanceRows.map(mapMaintenance),
  };
}

export async function activeTenancyForUnit(
  userId: string,
  unitId: string,
  excludeTenancyId?: string,
) {
  const rows = await db
    .select()
    .from(tenancies)
    .where(
      and(
        eq(tenancies.userId, userId),
        eq(tenancies.unitId, unitId),
        inArray(tenancies.status, ACTIVE_TENANCY_STATUSES),
      ),
    );
  return rows.find((row) => row.id !== excludeTenancyId);
}
