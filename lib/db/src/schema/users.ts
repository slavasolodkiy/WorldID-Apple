import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verificationLevelEnum = pgEnum("verification_level", ["none", "device", "orb"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  worldId: text("world_id"),
  verificationLevel: verificationLevelEnum("verification_level").notNull().default("none"),
  walletAddress: text("wallet_address").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  country: text("country"),
  bio: text("bio"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
