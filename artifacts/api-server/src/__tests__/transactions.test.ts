import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { seedTestUsers, cleanupTestUsers, TEST_USER_A } from "./setup.js";

describe("Transaction Invariants", () => {
  const agent = request.agent(app);

  beforeAll(async () => {
    await seedTestUsers();
    await agent.post("/api/auth/login").send({ username: TEST_USER_A.username });
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("rejects unknown token symbol", async () => {
    const res = await agent.post("/api/transactions").send({
      amount: "1",
      tokenSymbol: "DOGE",
      toAddress: "0x1234",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsupported token/i);
  });

  it("rejects zero amount", async () => {
    const res = await agent.post("/api/transactions").send({
      amount: "0",
      tokenSymbol: "WLD",
      toAddress: "0x1234",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/positive/i);
  });

  it("rejects negative amount", async () => {
    const res = await agent.post("/api/transactions").send({
      amount: "-5",
      tokenSymbol: "WLD",
      toAddress: "0x1234",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/positive/i);
  });

  it("rejects non-numeric amount", async () => {
    const res = await agent.post("/api/transactions").send({
      amount: "abc",
      tokenSymbol: "WLD",
      toAddress: "0x1234",
    });
    expect(res.status).toBe(400);
  });

  it("rejects transaction when balance is insufficient", async () => {
    const res = await agent.post("/api/transactions").send({
      amount: "999999",
      tokenSymbol: "WLD",
      toAddress: "0x1234",
    });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  it("creates a valid transaction and deducts balance", async () => {
    const walletBefore = await agent.get("/api/wallet");
    const balanceBefore = parseFloat(walletBefore.body.wldBalance);

    const res = await agent.post("/api/transactions").send({
      amount: "1",
      tokenSymbol: "WLD",
      toAddress: "0xRecipient0000000000000000000000000000001",
    });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("send");
    expect(res.body.status).toBe("completed");

    const walletAfter = await agent.get("/api/wallet");
    const balanceAfter = parseFloat(walletAfter.body.wldBalance);
    expect(balanceAfter).toBeCloseTo(balanceBefore - 1, 4);
  });

  it("idempotency key deduplicates repeated requests", async () => {
    const idempotencyKey = `idem-test-${Date.now()}`;

    const res1 = await agent
      .post("/api/transactions")
      .set("Idempotency-Key", idempotencyKey)
      .send({
        amount: "1",
        tokenSymbol: "WLD",
        toAddress: "0xRecipient0000000000000000000000000000002",
      });
    expect(res1.status).toBe(201);
    const txId = res1.body.id;

    const res2 = await agent
      .post("/api/transactions")
      .set("Idempotency-Key", idempotencyKey)
      .send({
        amount: "1",
        tokenSymbol: "WLD",
        toAddress: "0xRecipient0000000000000000000000000000002",
      });
    expect(res2.status).toBe(200);
    expect(res2.body.id).toBe(txId);
  });

  it("concurrent sends cannot overdraft the wallet (SELECT FOR UPDATE)", async () => {
    // Get the current WLD balance
    const walletRes = await agent.get("/api/wallet");
    const currentBalance = parseFloat(walletRes.body.wldBalance);

    // Fire 5 concurrent sends of (currentBalance / 2) — only 2 should succeed
    const sendAmount = (currentBalance / 2).toFixed(8);
    const sends = Array.from({ length: 5 }, () =>
      agent.post("/api/transactions").send({
        amount: sendAmount,
        tokenSymbol: "WLD",
        toAddress: "0xConcurrentRecipient000000000000000000001",
      })
    );

    const results = await Promise.all(sends);
    const successes = results.filter((r) => r.status === 201);
    const failures = results.filter((r) => r.status === 422);

    // Exactly 2 should succeed, the rest must be rejected as insufficient
    expect(successes.length).toBe(2);
    expect(failures.length).toBe(3);

    // Final balance must be >= 0
    const finalWallet = await agent.get("/api/wallet");
    expect(parseFloat(finalWallet.body.wldBalance)).toBeGreaterThanOrEqual(0);
  });

  it("user cannot fetch another user's transaction by ID", async () => {
    const agentB = request.agent(app);
    const { seedTestUsers: _, cleanupTestUsers: __, TEST_USER_B } = await import("./setup.js");
    await agentB.post("/api/auth/login").send({ username: TEST_USER_B.username });

    const ownTxRes = await agent.post("/api/transactions").send({
      amount: "1",
      tokenSymbol: "WLD",
      toAddress: "0xRecipient0000000000000000000000000000003",
    });
    const txId = ownTxRes.body.id;

    const crossUserRes = await agentB.get(`/api/transactions/${txId}`);
    expect(crossUserRes.status).toBe(404);
  });
});
