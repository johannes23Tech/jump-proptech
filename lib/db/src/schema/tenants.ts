import { sql } from 'drizzle-orm';
import { date, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    idNumberOrPassport: text('id_number_or_passport').notNull().default(''),
    phoneNumber: text('phone_number').notNull().default(''),
    whatsappNumber: text('whatsapp_number').notNull().default(''),
    email: text('email').notNull().default(''),
    emergencyContact: text('emergency_contact').notNull().default(''),
    nextOfKin: text('next_of_kin').notNull().default(''),
    employer: text('employer').notNull().default(''),
    notes: text('notes').notNull().default(''),
    createdAt: date('created_at', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_DATE`),
  },
  (table) => [index('tenants_user_id_idx').on(table.userId)],
);

export type TenantRow = typeof tenants.$inferSelect;
