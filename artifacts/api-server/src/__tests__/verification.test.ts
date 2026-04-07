import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { db } from "@workspace/db";
import { verificationSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { seedTestUsers, cleanupTestUsers, TEST_USER_A, TEST_USER_B } from "./setup.js";

describe("Verification Lifecycle", () => {
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

  it("returns default unverified status for new user", async () => {
    const res = await agentA.get("/api/verification/status");
    expect(res.status).toBe(200);
    expect(res.body.isVerified).toBe(false);
    expect(res.body.level).toBe("none");
  });

  it("rejects completion with no sessionId", async () => {
    const res = await agentA.post("/api/verification/complete").send({
      nullifierHash: "some_hash",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sessionId/i);
  });

  it("rejects completion with non-existent sessionId", async () => {
    const res = await agentA.post("/api/verification/complete").send({
      sessionId: "sess_nonexistent_00000",
      nullifierHash: "some_hash",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("rejects using another user's verification session", async () => {
    const initiateRes = await agentA.post("/api/verification/initiate");
    expect(initiateRes.status).toBe(200);
    const sessionId = initiateRes.body.sessionId;

    const res = await agentB.post("/api/verification/complete").send({
      sessionId,
      nullifierHash: "attacker_hash",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("rejects an expired session", async () => {
    const initiateRes = await agentA.post("/api/verification/initiate");
    const sessionId = initiateRes.body.sessionId;

    await db
      .update(verificationSessionsTable)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(verificationSessionsTable.id, sessionId));

    const res = await agentA.post("/api/verification/complete").send({
      sessionId,
      nullifierHash: "some_hash",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
  });

  it("rejects completing an already-processed session", async () => {
    const initiateRes = await agentA.post("/api/verification/initiate");
    const sessionId = initiateRes.body.sessionId;

    await db
      .update(verificationSessionsTable)
      .set({ status: "processing" })
      .where(eq(verificationSessionsTable.id, sessionId));

    const res = await agentA.post("/api/verification/complete").send({
      sessionId,
      nullifierHash: "some_hash",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/processing/i);
  });

  it("completes a valid verification flow end-to-end", async () => {
    const agentFresh = request.agent(app);
    await agentFresh.post("/api/auth/login").send({ username: TEST_USER_B.username });

    const statusBefore = await agentFresh.get("/api/verification/status");
    expect(statusBefore.body.isVerified).toBe(false);

    const initiateRes = await agentFresh.post("/api/verification/initiate");
    expect(initiateRes.status).toBe(200);
    expect(initiateRes.body.sessionId).toBeTruthy();
    expect(initiateRes.body.status).toBe("pending");

    const sessionId = initiateRes.body.sessionId;
    const completeRes = await agentFresh.post("/api/verification/complete").send({
      sessionId,
      nullifierHash: "test_nullifier_abc123",
    });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.isVerified).toBe(true);
    expect(completeRes.body.level).toBe("orb");
    expect(completeRes.body.nullifierHash).toBe("test_nullifier_abc123");

    const statusAfter = await agentFresh.get("/api/verification/status");
    expect(statusAfter.body.isVerified).toBe(true);
    expect(statusAfter.body.level).toBe("orb");

    const sessionRow = await db
      .select()
      .from(verificationSessionsTable)
      .where(eq(verificationSessionsTable.id, sessionId));
    expect(sessionRow[0]?.status).toBe("complete");
  });
});
