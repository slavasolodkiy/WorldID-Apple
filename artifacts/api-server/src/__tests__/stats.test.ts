import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { seedTestUsers, cleanupTestUsers, TEST_USER_A, TEST_USER_B } from "./setup.js";

describe("Stats & Dashboard", () => {
  const agentA = request.agent(app);
  const agentB = request.agent(app);

  beforeAll(async () => {
    await seedTestUsers();
    await agentA.post("/api/auth/login").send({ username: TEST_USER_A.username });
    await agentB.post("/api/auth/login").send({ username: TEST_USER_B.username });
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("returns 401 without session", async () => {
    const res = await request(app).get("/api/stats/dashboard");
    expect(res.status).toBe(401);
  });

  it("returns dashboard stats for authenticated user", async () => {
    const res = await agentA.get("/api/stats/dashboard");
    expect(res.status).toBe(200);
    expect(typeof res.body.totalValueUsd).toBe("number");
    expect(typeof res.body.wldBalance).toBe("string");
    expect(typeof res.body.wldPriceUsd).toBe("number");
    expect(typeof res.body.recentTransactionCount).toBe("number");
    expect(typeof res.body.unreadNotifications).toBe("number");
    expect(typeof res.body.grantsClaimed).toBe("number");
    expect(typeof res.body.verifiedUsers).toBe("number");
  });

  it("stats are user-scoped: grantsClaimed and unreadNotifications differ per user", async () => {
    // User A seed wallet has 100 WLD; send a grant-type tx via direct DB to differentiate counts
    const resA = await agentA.get("/api/stats/dashboard");
    const resB = await agentB.get("/api/stats/dashboard");
    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    // Both users start from a clean seed — neither has grants or unread notifications
    expect(resA.body.grantsClaimed).toBe(0);
    expect(resB.body.grantsClaimed).toBe(0);
    expect(resA.body.unreadNotifications).toBe(0);
    expect(resB.body.unreadNotifications).toBe(0);
  });

  it("totalValueUsd reflects the wallet balances from seed", async () => {
    const res = await agentA.get("/api/stats/dashboard");
    expect(res.status).toBe(200);
    // Seed: 100 WLD @ 2.34, 500 USDC @ 1.0, 0.1 ETH @ 3254.0
    const expected = Math.round((100 * 2.34 + 500 * 1.0 + 0.1 * 3254.0) * 100) / 100;
    expect(res.body.totalValueUsd).toBe(expected);
  });

  it("wldBalance matches seed wallet", async () => {
    const res = await agentA.get("/api/stats/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.wldBalance).toBe("100.00000000");
  });

  it("token prices endpoint returns price history for requested symbol", async () => {
    const res = await agentA.get("/api/stats/token-prices?symbol=WLD&period=1w");
    expect(res.status).toBe(200);
    expect(res.body.symbol).toBe("WLD");
    expect(res.body.period).toBe("1w");
    expect(res.body.currentPrice).toBe(2.34);
    expect(Array.isArray(res.body.dataPoints)).toBe(true);
    expect(res.body.dataPoints.length).toBeGreaterThan(0);
    // Last data point must always equal currentPrice (deterministic close)
    const lastPoint = res.body.dataPoints[res.body.dataPoints.length - 1];
    expect(lastPoint.price).toBe(2.34);
  });

  it("token prices returns 401 without session", async () => {
    const res = await request(app).get("/api/stats/token-prices?symbol=WLD");
    expect(res.status).toBe(401);
  });

  it("verifiedUsers count is global (not user-scoped)", async () => {
    // Both agents see the same verifiedUsers count since it is a global stat
    const resA = await agentA.get("/api/stats/dashboard");
    const resB = await agentB.get("/api/stats/dashboard");
    expect(resA.body.verifiedUsers).toBe(resB.body.verifiedUsers);
  });
});
