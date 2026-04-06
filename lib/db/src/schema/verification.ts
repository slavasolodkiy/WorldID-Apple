import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verificationSessionStatusEnum = pgEnum("verification_session_status", ["pending", "scanning", "processing", "complete", "failed"]);

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  level: text("level").notNull().default("none"),
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  nullifierHash: text("nullifier_hash"),
  expiresAt: timestamp("expires_at"),
  canClaimGrant: boolean("can_claim_grant").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const verificationSessionsTable = pgTable("verification_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  qrCode: text("qr_code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: verificationSessionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVerificationSchema = createInsertSchema(verificationsTable).omit({ createdAt: true });
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type Verification = typeof verificationsTable.$inferSelect;
