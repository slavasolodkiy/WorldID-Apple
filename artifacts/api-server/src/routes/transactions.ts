import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
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

const DEMO_USER_ID = "user_demo_001";

router.get("/transactions", async (req, res): Promise<void> => {
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
            eq(transactionsTable.userId, DEMO_USER_ID),
            eq(transactionsTable.type, typeFilter as "send" | "receive" | "grant" | "swap")
          )
        : eq(transactionsTable.userId, DEMO_USER_ID)
    )
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const txs = await query;
  res.json(ListTransactionsResponse.parse(txs));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid create transaction body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { toAddress, toUsername, amount, tokenSymbol, note } = parsed.data;

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, DEMO_USER_ID));
  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }

  const priceMap: Record<string, number> = { WLD: 2.34, USDC: 1.0, ETH: 3254.0 };
  const price = priceMap[tokenSymbol] ?? 1.0;
  const amountUsd = parseFloat(amount) * price;

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      id: `tx_${randomUUID()}`,
      userId: DEMO_USER_ID,
      type: "send",
      status: "completed",
      amount,
      amountUsd: amountUsd.toFixed(4),
      tokenSymbol,
      fromAddress: wallet.address,
      toAddress: toAddress ?? null,
      fromUsername: "demo.world",
      toUsername: toUsername ?? null,
      note: note ?? null,
      txHash: `0x${randomUUID().replace(/-/g, "")}`,
    })
    .returning();

  res.status(201).json(GetTransactionResponse.parse(tx));
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTransactionParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tx] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id));

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(GetTransactionResponse.parse(tx));
});

export default router;
