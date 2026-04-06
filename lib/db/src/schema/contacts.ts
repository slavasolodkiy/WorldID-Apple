import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactVerificationLevelEnum = pgEnum("contact_verification_level", ["none", "device", "orb"]);

export const contactsTable = pgTable("contacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  contactUsername: text("contact_username").notNull(),
  contactDisplayName: text("contact_display_name").notNull(),
  contactAvatarUrl: text("contact_avatar_url"),
  contactWalletAddress: text("contact_wallet_address").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationLevel: contactVerificationLevelEnum("verification_level").notNull().default("none"),
  lastTransactionAt: timestamp("last_transaction_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactsTable).omit({ createdAt: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactsTable.$inferSelect;
