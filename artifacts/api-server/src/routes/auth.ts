import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const LoginBody = z.object({
  username: z.string().min(1).max(64),
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "username is required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, parsed.data.username));

  if (!user) {
    res.status(401).json({ error: "Unknown username" });
    return;
  }

  // Regenerate session ID on login to prevent session fixation attacks.
  // The new session is empty; we set userId then persist it.
  req.session.regenerate((regenErr) => {
    if (regenErr) {
      req.log.error({ err: regenErr }, "Failed to regenerate session");
      res.status(500).json({ error: "Session error" });
      return;
    }

    req.session.userId = user.id;
    req.session.save((saveErr) => {
      if (saveErr) {
        req.log.error({ err: saveErr }, "Failed to save session");
        res.status(500).json({ error: "Session error" });
        return;
      }
      res.json({ userId: user.id, username: user.username, displayName: user.displayName });
    });
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Failed to destroy session");
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("world.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.json({ userId: null });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    // The session references a user that no longer exists in the DB (ghost session).
    // Destroy it so subsequent requests start fresh rather than leaking a stale userId.
    // Everything (clearCookie + response) is sent inside the callback to avoid
    // ERR_HTTP_HEADERS_SENT from calling res.json() before the async destroy finishes.
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        req.log.warn({ err: destroyErr }, "Failed to destroy ghost session");
      }
      res.clearCookie("world.sid");
      res.json({ userId: null });
    });
    return;
  }

  res.json({ userId: user.id, username: user.username, displayName: user.displayName });
});

export default router;
