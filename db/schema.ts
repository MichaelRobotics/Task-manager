import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Panels table
export const panels = pgTable('panels', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  sendToLocations: text('send_to_locations').array().notNull().default(sql`ARRAY[]::text[]`),
  receiveFromLocations: text('receive_from_locations').array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Type exports for TypeScript
export type Panel = typeof panels.$inferSelect;
export type NewPanel = typeof panels.$inferInsert;
