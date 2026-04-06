import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, verificationsTable, verificationSessionsTable, usersTable } from "@workspace/db";
import {
  GetVerificationStatusResponse,
  InitiateVerificationResponse,
  CompleteVerificationBody,
  CompleteVerificationResponse,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const DEMO_USER_ID = "user_demo_001";

router.get("/verification/status", async (req, res): Promise<void> => {
  const [verification] = await db
    .select()
    .from(verificationsTable)
    .where(eq(verificationsTable.userId, DEMO_USER_ID));

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
  const sessionId = `sess_${randomUUID()}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const qrCode = `worldid://verify?session=${sessionId}&nonce=${randomUUID()}`;

  await db.insert(verificationSessionsTable).values({
    id: sessionId,
    userId: DEMO_USER_ID,
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
  const parsed = CompleteVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid complete verification body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const nullifierHash = parsed.data.nullifierHash ?? `nullifier_${randomUUID().replace(/-/g, "")}`;
  const verifiedAt = new Date();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const existing = await db
    .select()
    .from(verificationsTable)
    .where(eq(verificationsTable.userId, DEMO_USER_ID));

  if (existing.length > 0) {
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
      .where(eq(verificationsTable.userId, DEMO_USER_ID));
  } else {
    await db.insert(verificationsTable).values({
      id: `verif_${randomUUID()}`,
      userId: DEMO_USER_ID,
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
    .where(eq(usersTable.id, DEMO_USER_ID));

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
