import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, contactsTable } from "@workspace/db";
import {
  ListContactsResponse,
  CreateContactBody,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/contacts", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const contacts = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.userId, userId));

  const mapped = contacts.map((c) => ({
    id: c.id,
    username: c.contactUsername,
    displayName: c.contactDisplayName,
    avatarUrl: c.contactAvatarUrl,
    walletAddress: c.contactWalletAddress,
    isVerified: c.isVerified,
    verificationLevel: c.verificationLevel,
    lastTransactionAt: c.lastTransactionAt,
  }));

  res.json(ListContactsResponse.parse(mapped));
});

router.post("/contacts", async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const parsed = CreateContactBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid create contact body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contact] = await db
    .insert(contactsTable)
    .values({
      id: `contact_${randomUUID()}`,
      userId,
      contactUsername: parsed.data.username,
      contactDisplayName: parsed.data.username,
      contactWalletAddress: parsed.data.walletAddress ?? `0x${randomUUID().replace(/-/g, "").slice(0, 40)}`,
      isVerified: false,
      verificationLevel: "none",
    })
    .returning();

  res.status(201).json({
    id: contact.id,
    username: contact.contactUsername,
    displayName: contact.contactDisplayName,
    avatarUrl: contact.contactAvatarUrl,
    walletAddress: contact.contactWalletAddress,
    isVerified: contact.isVerified,
    verificationLevel: contact.verificationLevel,
    lastTransactionAt: contact.lastTransactionAt,
  });
});

export default router;
