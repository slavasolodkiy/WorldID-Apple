import { pgTable, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const walletsTable = pgTable("wallets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  address: text("address").notNull().unique(),
  wldBalance: numeric("wld_balance", { precision: 30, scale: 8 }).notNull().default("0"),
  usdcBalance: numeric("usdc_balance", { precision: 30, scale: 8 }).notNull().default("0"),
  ethBalance: numeric("eth_balance", { precision: 30, scale: 18 }).notNull().default("0"),
  pendingGrants: integer("pending_grants").notNull().default(0),
  nextGrantDate: timestamp("next_grant_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWalletSchema = createInsertSchema(walletsTable).omit({ createdAt: true });
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof walletsTable.$inferSelect;
