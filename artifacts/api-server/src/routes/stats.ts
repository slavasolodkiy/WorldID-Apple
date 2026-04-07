import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, walletsTable, transactionsTable, notificationsTable, usersTable } from "@workspace/db";
import { GetDashboardStatsResponse, GetTokenPricesQueryParams, GetTokenPricesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats/dashboard", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const wldPrice = 2.34;
  const wldPriceChange24h = 3.12;

  const wldBalance = wallet ? wallet.wldBalance : "0";
  const usdcBalance = wallet ? parseFloat(wallet.usdcBalance) : 0;
  const ethBalance = wallet ? parseFloat(wallet.ethBalance) : 0;
  const totalValueUsd =
    parseFloat(wldBalance) * wldPrice + usdcBalance * 1.0 + ethBalance * 3254.0;

  const verifiedCount = await db
    .select({ count: count() })
    .from(usersTable)
    .where(eq(usersTable.isVerified, true));

  const txCountResult = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  const grantCount = await db
    .select({ count: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "grant"));

  const unreadResult = await db
    .select({ count: count() })
    .from(notificationsTable)
    .where(eq(notificationsTable.isRead, false));

  res.json(
    GetDashboardStatsResponse.parse({
      totalValueUsd: Math.round(totalValueUsd * 100) / 100,
      wldBalance,
      verifiedUsers: verifiedCount[0]?.count ?? 1,
      grantsClaimed: grantCount[0]?.count ?? 2,
      recentTransactionCount: txCountResult[0]?.count ?? 0,
      unreadNotifications: unreadResult[0]?.count ?? 0,
      wldPriceUsd: wldPrice,
      wldPriceChange24h,
    })
  );
});

router.get("/stats/token-prices", async (req, res): Promise<void> => {
  const params = GetTokenPricesQueryParams.safeParse(req.query);
  const symbol = params.success ? params.data.symbol : "WLD";
  const period = params.success ? (params.data.period ?? "1w") : "1w";

  const basePrice: Record<string, number> = { WLD: 2.34, USDC: 1.0, ETH: 3254.0 };
  const currentPrice = basePrice[symbol] ?? 2.34;

  const now = Date.now();
  const periodMs: Record<string, number> = {
    "1d": 24 * 3600 * 1000,
    "1w": 7 * 24 * 3600 * 1000,
    "1m": 30 * 24 * 3600 * 1000,
    "3m": 90 * 24 * 3600 * 1000,
    "1y": 365 * 24 * 3600 * 1000,
  };
  const totalMs = periodMs[period] ?? periodMs["1w"];

  const pointCount = period === "1d" ? 24 : period === "1w" ? 7 * 4 : period === "1m" ? 30 : period === "3m" ? 90 : 52;
  const intervalMs = totalMs / pointCount;

  let price = currentPrice * 0.85;
  const dataPoints = [];
  for (let i = 0; i <= pointCount; i++) {
    const timestamp = new Date(now - totalMs + i * intervalMs).toISOString();
    price = price + (Math.random() - 0.47) * currentPrice * 0.04;
    price = Math.max(price, currentPrice * 0.5);
    dataPoints.push({ timestamp, price: Math.round(price * 100) / 100 });
  }
  dataPoints[dataPoints.length - 1].price = currentPrice;

  const startPrice = dataPoints[0].price;
  const priceChange = currentPrice - startPrice;
  const priceChangePercent = (priceChange / startPrice) * 100;

  res.json(
    GetTokenPricesResponse.parse({
      symbol,
      period,
      currentPrice,
      priceChange: Math.round(priceChange * 10000) / 10000,
      priceChangePercent: Math.round(priceChangePercent * 100) / 100,
      dataPoints,
    })
  );
});

export default router;
