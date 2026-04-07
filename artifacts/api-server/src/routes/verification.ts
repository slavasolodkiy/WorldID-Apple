import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, verificationsTable, verificationSessionsTable, usersTable } from "@workspace/db";
import {
  GetVerificationStatusResponse,
  InitiateVerificationResponse,
  CompleteVerificationBody,
  CompleteVerificationResponse,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing"],
  processing: ["complete"],
};

router.get("/verification/status", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [verification] = await db
    .select()
    .from(verificationsTable)
    .where(eq(verificationsTable.userId, userId));

  if (!verification) {
    res.json(
      GetVerificationStatusResponse.parse({
        level: "none",
        isVerified: false,
        verifiedAt: null,
        nullifierHash: null,
        expiresAt: null,
        canClaimGrant: false,
      })
    );
    return;
  }

  res.json(GetVerificationStatusResponse.parse(verification));
});

router.post("/verification/initiate", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const sessionId = `sess_${randomUUID()}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const qrCode = `worldid://verify?session=${sessionId}&nonce=${randomUUID()}&user=${userId}`;

  await db.insert(verificationSessionsTable).values({
    id: sessionId,
    userId,
    qrCode,
    expiresAt,
    status: "pending",
  });

  res.json(
    InitiateVerificationResponse.parse({
      sessionId,
      qrCode,
      expiresAt: expiresAt.toISOString(),
      status: "pending",
    })
  );
});

router.post("/verification/complete", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const parsed = CompleteVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid complete verification body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId } = parsed.data;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const [verificationSession] = await db
    .select()
    .from(verificationSessionsTable)
    .where(
      and(
        eq(verificationSessionsTable.id, sessionId),
        eq(verificationSessionsTable.userId, userId)
      )
    );

  if (!verificationSession) {
    res.status(400).json({ error: "Verification session not found" });
    return;
  }

  if (new Date() > verificationSession.expiresAt) {
    res.status(400).json({ error: "Verification session has expired" });
    return;
  }

  if (verificationSession.status !== "pending") {
    const allowed = ALLOWED_STATUS_TRANSITIONS[verificationSession.status] ?? [];
    res.status(400).json({
      error: `Cannot complete verification session in status '${verificationSession.status}'. Allowed transitions: ${allowed.join(", ") || "none"}`,
    });
    return;
  }

  await db
    .update(verificationSessionsTable)
    .set({ status: "processing" })
    .where(eq(verificationSessionsTable.id, sessionId));

  const nullifierHash =
    parsed.data.nullifierHash ?? `nullifier_${randomUUID().replace(/-/g, "")}`;
  const verifiedAt = new Date();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const [existing] = await db
    .select()
    .from(verificationsTable)
    .where(eq(verificationsTable.userId, userId));

  if (existing) {
    await db
      .update(verificationsTable)
      .set({
        level: "orb",
        isVerified: true,
        verifiedAt,
        nullifierHash,
        expiresAt,
        canClaimGrant: true,
      })
      .where(eq(verificationsTable.userId, userId));
  } else {
    await db.insert(verificationsTable).values({
      id: `verif_${randomUUID()}`,
      userId,
      level: "orb",
      isVerified: true,
      verifiedAt,
      nullifierHash,
      expiresAt,
      canClaimGrant: true,
    });
  }

  await db
    .update(usersTable)
    .set({ verificationLevel: "orb", isVerified: true })
    .where(eq(usersTable.id, userId));

  await db
    .update(verificationSessionsTable)
    .set({ status: "complete" })
    .where(eq(verificationSessionsTable.id, sessionId));

  res.json(
    CompleteVerificationResponse.parse({
      level: "orb",
      isVerified: true,
      verifiedAt: verifiedAt.toISOString(),
      nullifierHash,
      expiresAt: expiresAt.toISOString(),
      canClaimGrant: true,
    })
  );
});

export default router;
