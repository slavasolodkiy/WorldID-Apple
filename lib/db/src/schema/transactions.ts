import { pgTable, text, numeric, timestamp, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionTypeEnum = pgEnum("transaction_type", ["send", "receive", "grant", "swap"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed"]);

export const transactionsTable = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    type: transactionTypeEnum("type").notNull(),
    status: transactionStatusEnum("status").notNull().default("pending"),
    amount: numeric("amount", { precision: 30, scale: 8 }).notNull(),
    amountUsd: numeric("amount_usd", { precision: 20, scale: 4 }).notNull().default("0"),
    tokenSymbol: text("token_symbol").notNull(),
    fromAddress: text("from_address"),
    toAddress: text("to_address"),
    fromUsername: text("from_username"),
    toUsername: text("to_username"),
    txHash: text("tx_hash"),
    note: text("note"),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_transactions_user_id").on(table.userId),
    index("idx_transactions_created_at").on(table.createdAt),
    unique("uq_transactions_user_idempotency").on(table.userId, table.idempotencyKey),
  ],
);

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
