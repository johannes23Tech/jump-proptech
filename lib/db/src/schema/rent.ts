import { date, index, integer, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { units } from './units';
import { users } from './users';

export const rentStatusEnum = pgEnum('rent_status', ['Paid', 'Pending', 'Overdue']);

export const rentRecords = pgTable(
  'rent_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    month: text('month').notNull(),
    amount: integer('amount').notNull().default(0),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    status: rentStatusEnum('status').notNull().default('Pending'),
    paymentMethod: text('payment_method').notNull().default(''),
    paidDate: date('paid_date', { mode: 'string' }),
  },
  (table) => [
    index('rent_records_user_id_idx').on(table.userId),
    index('rent_records_month_idx').on(table.month),
  ],
);

export type RentRecordRow = typeof rentRecords.$inferSelect;
