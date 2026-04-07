import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, walletsTable } from "@workspace/db";
import { GetWalletResponse, ListTokensResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/wallet", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }

  const wldPrice = 2.34;
  const usdcPrice = 1.0;
  const ethPrice = 3254.0;
  const totalBalanceUsd =
    parseFloat(wallet.wldBalance) * wldPrice +
    parseFloat(wallet.usdcBalance) * usdcPrice +
    parseFloat(wallet.ethBalance) * ethPrice;

  res.json(
    GetWalletResponse.parse({
      ...wallet,
      totalBalanceUsd: Math.round(totalBalanceUsd * 100) / 100,
    })
  );
});

router.get("/wallet/tokens", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  if (!wallet) {
    res.json(ListTokensResponse.parse([]));
    return;
  }

  const tokens = [
    {
      symbol: "WLD",
      name: "Worldcoin",
      balance: wallet.wldBalance,
      balanceUsd: parseFloat(wallet.wldBalance) * 2.34,
      price: 2.34,
      priceChange24h: 3.12,
      iconUrl: null,
      contractAddress: "0x163f8c2467924be0ae7b5347228cabf260318753",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: wallet.usdcBalance,
      balanceUsd: parseFloat(wallet.usdcBalance) * 1.0,
      price: 1.0,
      priceChange24h: 0.01,
      iconUrl: null,
      contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: wallet.ethBalance,
      balanceUsd: parseFloat(wallet.ethBalance) * 3254.0,
      price: 3254.0,
      priceChange24h: -1.45,
      iconUrl: null,
      contractAddress: null,
    },
  ].map((t) => ({ ...t, balanceUsd: Math.round(t.balanceUsd * 100) / 100 }));

  res.json(ListTokensResponse.parse(tokens));
});

export default router;
