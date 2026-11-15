import { sql } from 'drizzle-orm';
import { date, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const properties = pgTable(
  'properties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    address: text('address').notNull(),
    suburb: text('suburb').notNull().default(''),
    city: text('city').notNull(),
    province: text('province').notNull(),
    postalCode: text('postal_code').notNull().default(''),
    description: text('description').notNull().default(''),
    createdAt: date('created_at', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_DATE`),
  },
  (table) => [index('properties_user_id_idx').on(table.userId)],
);

export type PropertyRow = typeof properties.$inferSelect;
