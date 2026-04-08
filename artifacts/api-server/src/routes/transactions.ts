import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, transactionsTable, walletsTable } from "@workspace/db";
import {
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  CreateTransactionBody,
  GetTransactionParams,
  GetTransactionResponse,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const ALLOWED_TOKENS = new Set(["WLD", "USDC", "ETH"]);

const PRICE_MAP: Record<string, number> = {
  WLD: 2.34,
  USDC: 1.0,
  ETH: 3254.0,
};

const BALANCE_FIELD: Record<string, "wldBalance" | "usdcBalance" | "ethBalance"> = {
  WLD: "wldBalance",
  USDC: "usdcBalance",
  ETH: "ethBalance",
};

router.get("/transactions", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = ListTransactionsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = params.success ? (params.data.offset ?? 0) : 0;
  const typeFilter = params.success ? params.data.type : undefined;

  const query = db
    .select()
    .from(transactionsTable)
    .where(
      typeFilter
        ? and(
            eq(transactionsTable.userId, userId),
            eq(transactionsTable.type, typeFilter as "send" | "receive" | "grant" | "swap")
          )
        : eq(transactionsTable.userId, userId)
    )
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const txs = await query;
  res.json(ListTransactionsResponse.parse(txs.map((t) => ({
    ...t,
    amountUsd: parseFloat(t.amountUsd),
  }))));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const idempotencyKey = typeof req.headers["idempotency-key"] === "string"
    ? req.headers["idempotency-key"]
    : null;

  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid create transaction body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { toAddress, toUsername, amount, tokenSymbol, note } = parsed.data;

  if (!ALLOWED_TOKENS.has(tokenSymbol)) {
    res.status(400).json({ error: `Unsupported token: ${tokenSymbol}` });
    return;
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    res.status(400).json({ error: "Amount must be a positive number" });
    return;
  }

  if (idempotencyKey) {
    const [existing] = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.userId, userId),
          eq(transactionsTable.idempotencyKey, idempotencyKey)
        )
      );
    if (existing) {
      res.status(200).json(GetTransactionResponse.parse({
        ...existing,
        amountUsd: parseFloat(existing.amountUsd),
      }));
      return;
    }
  }

  try {
    const tx = await db.transaction(async (trx) => {
      const balanceCol = BALANCE_FIELD[tokenSymbol]!;

      // SELECT FOR UPDATE acquires a row-level lock, preventing concurrent
      // double-spend from a second request racing this transaction.
      const lockedRows = await trx.execute(
        sql`SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE`
      );
      const walletRow = lockedRows.rows[0] as Record<string, unknown> | undefined;

      if (!walletRow) {
        throw new InsufficientBalanceError("Wallet not found");
      }

      // Map camelCase field to snake_case DB column
      const DB_COL: Record<string, string> = {
        wldBalance: "wld_balance",
        usdcBalance: "usdc_balance",
        ethBalance: "eth_balance",
      };
      const currentBalance = parseFloat(walletRow[DB_COL[balanceCol]!] as string);
      if (isNaN(currentBalance) || currentBalance < amountNum) {
        throw new InsufficientBalanceError(`Insufficient ${tokenSymbol} balance`);
      }

      const newBalance = (currentBalance - amountNum).toFixed(8);

      await trx
        .update(walletsTable)
        .set({ [balanceCol]: newBalance })
        .where(eq(walletsTable.userId, userId));

      const price = PRICE_MAP[tokenSymbol] ?? 1.0;
      const amountUsd = (amountNum * price).toFixed(4);

      const [newTx] = await trx
        .insert(transactionsTable)
        .values({
          id: `tx_${randomUUID()}`,
          userId,
          type: "send",
          status: "completed",
          amount,
          amountUsd,
          tokenSymbol,
          fromAddress: (walletRow["address"] as string) ?? null,
          toAddress: toAddress ?? null,
          fromUsername: null,
          toUsername: toUsername ?? null,
          note: note ?? null,
          txHash: `0x${randomUUID().replace(/-/g, "")}`,
          idempotencyKey,
        })
        .returning();

      return newTx!;
    });

    res.status(201).json(GetTransactionResponse.parse({
      ...tx,
      amountUsd: parseFloat(tx.amountUsd),
    }));
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      res.status(422).json({ error: err.message });
      return;
    }
    req.log.error({ err }, "Unexpected error creating transaction");
    throw err;
  }
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTransactionParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tx] = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.id, params.data.id),
        eq(transactionsTable.userId, userId)
      )
    );

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(GetTransactionResponse.parse({
    ...tx,
    amountUsd: parseFloat(tx.amountUsd),
  }));
});

class InsufficientBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientBalanceError";
  }
}

export default router;
