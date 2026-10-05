import { createInsertSchema } from "drizzle-zod";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const skPlatformEnum = pgEnum("sk_platform", [
  "YouTube",
  "Facebook",
  "TikTok",
  "Other",
]);

export const skLeadStatusEnum = pgEnum("sk_lead_status", ["new", "contacted"]);

export const skContactsTable = pgTable("sk_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  platform: skPlatformEnum("platform").notNull(),
  message: text("message"),
  status: skLeadStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const skAdminsTable = pgTable(
  "sk_admins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("sk_admins_username_unique").on(table.username)],
);

export const insertSkContactSchema = createInsertSchema(skContactsTable).omit({
  id: true,
  status: true,
  createdAt: true,
});
export type InsertSkContact = z.infer<typeof insertSkContactSchema>;
export type SkContact = typeof skContactsTable.$inferSelect;
export type SkAdmin = typeof skAdminsTable.$inferSelect;
