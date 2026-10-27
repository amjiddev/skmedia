import { createInsertSchema } from "drizzle-zod";
import {
  pgEnum,
  pgTable,
  integer,
  boolean,
  jsonb,
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

export const skIdeaStatusEnum = pgEnum("sk_idea_status", ["pending", "approved", "rejected"]);
export const skPromptAccessEnum = pgEnum("sk_prompt_access", ["Free", "Premium"]);
export const skPromptPlacementEnum = pgEnum("sk_prompt_placement", ["hero", "main", "both"]);

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
    isActive: boolean("is_active").notNull().default(true),
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
  status: skIdeaStatusEnum("status").notNull().default("approved"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const skPromptsTable = pgTable(
  "sk_prompts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 180 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    access: skPromptAccessEnum("access").notNull().default("Free"),
    placement: skPromptPlacementEnum("placement").notNull().default("both"),
    image: text("image").notNull(),
    promptText: text("prompt_text").notNull(),
    promptFileName: text("prompt_file_name"),
    promptFileType: text("prompt_file_type"),
    promptFileData: text("prompt_file_data"),
    isPublished: boolean("is_published").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("sk_prompts_slug_unique").on(table.slug)],
);

export const skTeamMembersTable = pgTable("sk_team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 120 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  image: text("image").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skAboutContentTable = pgTable("sk_about_content", {
  id: integer("id").primaryKey().default(1),
  heroKicker: text("hero_kicker").notNull(),
  heroTitle: text("hero_title").notNull(),
  heroIntro: text("hero_intro").notNull(),
  storyLabel: text("story_label").notNull(),
  storyTitle: text("story_title").notNull(),
  storyBody: text("story_body").notNull(),
  storyImage: text("story_image").notNull(),
  storyCaption: text("story_caption").notNull(),
  missionLabel: text("mission_label").notNull(),
  missionTitle: text("mission_title").notNull(),
  missionBody: text("mission_body").notNull(),
  missionImage: text("mission_image").notNull(),
  missionCaption: text("mission_caption").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skContactContentTable = pgTable("sk_contact_content", {
  id: integer("id").primaryKey().default(1),
  heroKicker: text("hero_kicker").notNull(),
  heroTitle: text("hero_title").notNull(),
  heroIntro: text("hero_intro").notNull(),
  formLabel: text("form_label").notNull(),
  formTitle: text("form_title").notNull(),
  directLabel: text("direct_label").notNull(),
  directDescription: text("direct_description").notNull(),
  primaryPhoneLabel: text("primary_phone_label").notNull(),
  primaryPhone: text("primary_phone").notNull(),
  secondaryPhoneLabel: text("secondary_phone_label").notNull(),
  secondaryPhone: text("secondary_phone").notNull(),
  emailLabel: text("email_label").notNull(),
  email: text("email").notNull(),
  locationLabel: text("location_label").notNull(),
  address: text("address").notNull(),
  whatsappUrl: text("whatsapp_url").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export interface ServiceCardContent {
  number: string;
  title: string;
  description: string;
  icon: "youtube" | "users" | "video" | "clapperboard" | "sparkles";
  logo?: string;
  features: string[];
  ctaLabel: string;
}

export interface ServiceProcessStep {
  number: string;
  title: string;
  description: string;
}

export type HomeFeatureIcon = "users" | "shield" | "target" | "trend" | "youtube" | "facebook" | "tiktok" | "pin" | "video" | "sparkles";

export interface HomeChartMonth {
  month: string;
  earnings: number;
  bonus: number;
}

export interface HomeChartPlatform {
  name: string;
  amount: string;
}

export interface HomeFeatureCard {
  title: string;
  description: string;
  icon: HomeFeatureIcon;
}

export interface HomeOpportunityStep {
  number: string;
  title: string;
  description: string;
}

export interface HomeIconText {
  text: string;
  icon: HomeFeatureIcon;
}

export interface HomeValueCard {
  title: string;
  description: string;
}

export interface HomeTestimonial {
  quote: string;
  source: string;
  platform: string;
}

export interface HomePageContent {
  hero: {
    brandTitle: string;
    brandSubtitle: string;
    badge: string;
    intro: string;
    primaryCta: string;
    secondaryCta: string;
    chartTitle: string;
    chartTotal: string;
    chartGrowth: string;
    chartGrowthCaption: string;
    chartMonths: HomeChartMonth[];
    chartPlatforms: HomeChartPlatform[];
    chartDisclaimer: string;
    marquee: string[];
  };
  trust: { title: string; cards: HomeFeatureCard[] };
  opportunity: { title: string; steps: HomeOpportunityStep[] };
  services: { title: string; allServicesLabel: string; cards: ServiceCardContent[] };
  story: { title: string; highlight: string; intro: string; detail: string; benefits: HomeIconText[]; ctaLabel: string };
  values: { title: string; cards: HomeValueCard[] };
  testimonials: { title: string; description: string; cards: HomeTestimonial[] };
  faq: { askLabel: string };
  contact: { title: string; description: string; whatsappLabel: string; whatsappHint: string; whatsappUrl: string };
  footer: { description: string; exploreLabel: string; helloLabel: string; primaryPhone: string; secondaryPhone: string; email: string; address: string; copyright: string; tagline: string };
}

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  isPublished: boolean;
}

export const skFaqContentTable = pgTable("sk_faq_content", {
  id: integer("id").primaryKey().default(1),
  title: text("title").notNull().default("Your Questions, Answered Clearly"),
  description: text("description").notNull().default("Still deciding if we’re the right fit? Start here."),
  faqs: jsonb("faqs").$type<FAQEntry[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skServicesContentTable = pgTable("sk_services_content", {
  id: integer("id").primaryKey().default(1),
  heroKicker: text("hero_kicker").notNull(),
  heroTitle: text("hero_title").notNull(),
  heroIntro: text("hero_intro").notNull(),
  servicesLabel: text("services_label").notNull(),
  servicesTitle: text("services_title").notNull(),
  serviceCards: jsonb("service_cards").$type<ServiceCardContent[]>().notNull(),
  processLabel: text("process_label").notNull(),
  processTitle: text("process_title").notNull(),
  processSteps: jsonb("process_steps").$type<ServiceProcessStep[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skHomeContentTable = pgTable("sk_home_content", {
  id: integer("id").primaryKey().default(1),
  content: jsonb("content").$type<HomePageContent>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
export type SkPrompt = typeof skPromptsTable.$inferSelect;
export type SkTeamMember = typeof skTeamMembersTable.$inferSelect;
