import { sql } from 'drizzle-orm';
import { date, index, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { properties } from './properties';
import { tenants } from './tenants';
import { units } from './units';
import { users } from './users';

export const maintenancePriorityEnum = pgEnum('maintenance_priority', [
  'Low',
  'Medium',
  'High',
]);

export const maintenanceStatusEnum = pgEnum('maintenance_status', [
  'Open',
  'In progress',
  'Resolved',
]);

export const maintenanceRequests = pgTable(
  'maintenance_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id').references(() => units.id, { onDelete: 'set null' }),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    priority: maintenancePriorityEnum('priority').notNull().default('Medium'),
    status: maintenanceStatusEnum('status').notNull().default('Open'),
    createdAt: date('created_at', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_DATE`),
  },
  (table) => [
    index('maintenance_requests_user_id_idx').on(table.userId),
    index('maintenance_requests_property_id_idx').on(table.propertyId),
  ],
);

export type MaintenanceRequestRow = typeof maintenanceRequests.$inferSelect;
