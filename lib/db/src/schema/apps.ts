import { pgTable, text, integer, boolean, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appCategoryEnum = pgEnum("app_category", ["defi", "social", "gaming", "nft", "utility"]);

export const appsTable = pgTable("apps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  category: appCategoryEnum("category").notNull(),
  url: text("url").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  userCount: integer("user_count").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  requiresWorldId: boolean("requires_world_id").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAppSchema = createInsertSchema(appsTable).omit({ createdAt: true });
export type InsertApp = z.infer<typeof insertAppSchema>;
export type App = typeof appsTable.$inferSelect;
