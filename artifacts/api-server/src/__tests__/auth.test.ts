import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { seedTestUsers, cleanupTestUsers, TEST_USER_A, TEST_USER_B } from "./setup.js";

describe("Authentication & Authorization", () => {
  beforeAll(async () => {
    await seedTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("returns 401 on protected route without a session", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authentication required/i);
  });

  it("returns 401 on wallet route without a session", async () => {
    const res = await request(app).get("/api/wallet");
    expect(res.status).toBe(401);
  });

  it("returns 401 on transactions route without a session", async () => {
    const res = await request(app).get("/api/transactions");
    expect(res.status).toBe(401);
  });

  it("rejects login for unknown username", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "definitely.does.not.exist.xyz" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/unknown username/i);
  });

  it("rejects login with missing username", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("allows login with valid username and returns user info", async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post("/api/auth/login")
      .send({ username: TEST_USER_A.username });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.userId).toBe(TEST_USER_A.id);
    expect(loginRes.body.username).toBe(TEST_USER_A.username);
  });

  it("GET /auth/me returns null when no session", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.userId).toBeNull();
  });

  it("GET /auth/me returns user info after login", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ username: TEST_USER_A.username });
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(TEST_USER_A.id);
  });

  it("can access protected route after login", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ username: TEST_USER_A.username });
    const res = await agent.get("/api/users/me");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(TEST_USER_A.id);
  });

  it("logout destroys session and subsequent requests get 401", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ username: TEST_USER_A.username });
    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);
    const afterRes = await agent.get("/api/users/me");
    expect(afterRes.status).toBe(401);
  });

  it("enforces ownership: user A cannot see user B's wallet data via their own session", async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);
    await agentA.post("/api/auth/login").send({ username: TEST_USER_A.username });
    await agentB.post("/api/auth/login").send({ username: TEST_USER_B.username });

    const walletA = await agentA.get("/api/wallet");
    const walletB = await agentB.get("/api/wallet");
    expect(walletA.status).toBe(200);
    expect(walletB.status).toBe(200);
    expect(walletA.body.address).toBe(TEST_USER_A.walletAddress);
    expect(walletB.body.address).toBe(TEST_USER_B.walletAddress);
    expect(walletA.body.address).not.toBe(walletB.body.address);
  });
});
