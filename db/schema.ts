import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const panels = pgTable('panels', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  sendToLocations: text('send_to_locations').array().notNull().default([]),
  receiveFromLocations: text('receive_from_locations').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
