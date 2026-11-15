import { sql } from 'drizzle-orm';
import { date, index, integer, pgEnum, pgTable, uuid } from 'drizzle-orm/pg-core';
import { properties } from './properties';
import { tenants } from './tenants';
import { units } from './units';
import { users } from './users';

export const tenancyStatusEnum = pgEnum('tenancy_status', [
  'Application',
  'Active',
  'Notice given',
  'Ended',
]);

export const tenancies = pgTable(
  'tenancies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    moveInDate: date('move_in_date', { mode: 'string' }).notNull(),
    leaseStart: date('lease_start', { mode: 'string' }).notNull(),
    leaseEnd: date('lease_end', { mode: 'string' }).notNull(),
    monthlyRent: integer('monthly_rent').notNull().default(0),
    depositAmount: integer('deposit_amount').notNull().default(0),
    paymentDueDay: integer('payment_due_day').notNull().default(1),
    status: tenancyStatusEnum('status').notNull().default('Application'),
    createdAt: date('created_at', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_DATE`),
  },
  (table) => [
    index('tenancies_user_id_idx').on(table.userId),
    index('tenancies_tenant_id_idx').on(table.tenantId),
    index('tenancies_unit_id_idx').on(table.unitId),
  ],
);

export type TenancyRow = typeof tenancies.$inferSelect;
