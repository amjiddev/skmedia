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
    email: varchar("email", { length: 254 }),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sk_admins_username_unique").on(table.username),
    uniqueIndex("sk_admins_email_unique").on(table.email),
  ],
);

export const skUsersTable = pgTable(
  "sk_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("sk_users_email_unique").on(table.email)],
);

export const skIdeasTable = pgTable("sk_ideas", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  tag: varchar("tag", { length: 80 }).notNull(),
  postedBy: text("posted_by").notNull().default("Admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSkContactSchema = createInsertSchema(skContactsTable).omit({
  id: true,
  status: true,
  createdAt: true,
});
export type InsertSkContact = z.infer<typeof insertSkContactSchema>;
export type SkContact = typeof skContactsTable.$inferSelect;
export type SkAdmin = typeof skAdminsTable.$inferSelect;
export type SkUser = typeof skUsersTable.$inferSelect;
export type SkIdea = typeof skIdeasTable.$inferSelect;
