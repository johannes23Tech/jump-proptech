import { integer, index, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { properties } from './properties';
import { users } from './users';

export const occupancyStatusEnum = pgEnum('occupancy_status', [
  'Vacant',
  'Occupied',
  'Maintenance',
]);

export const units = pgTable(
  'units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    number: text('number').notNull(),
    type: text('type').notNull(),
    monthlyRent: integer('monthly_rent').notNull().default(0),
    occupancyStatus: occupancyStatusEnum('occupancy_status').notNull().default('Vacant'),
  },
  (table) => [
    index('units_user_id_idx').on(table.userId),
    index('units_property_id_idx').on(table.propertyId),
  ],
);

export type UnitRow = typeof units.$inferSelect;
