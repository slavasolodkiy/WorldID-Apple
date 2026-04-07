import { db } from "@workspace/db";
import { usersTable, walletsTable, transactionsTable, verificationsTable, verificationSessionsTable, contactsTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const TEST_USER_A = {
  id: "test_user_a_hardening",
  username: "test.user.a.hardening",
  displayName: "Test User A",
  walletAddress: "0xAAAA000000000000000000000000000000000001",
};

export const TEST_USER_B = {
  id: "test_user_b_hardening",
  username: "test.user.b.hardening",
  displayName: "Test User B",
  walletAddress: "0xBBBB000000000000000000000000000000000002",
};

export async function seedTestUsers() {
  await db.insert(usersTable).values([
    {
      id: TEST_USER_A.id,
      username: TEST_USER_A.username,
      displayName: TEST_USER_A.displayName,
      walletAddress: TEST_USER_A.walletAddress,
      verificationLevel: "none",
      isVerified: false,
    },
    {
      id: TEST_USER_B.id,
      username: TEST_USER_B.username,
      displayName: TEST_USER_B.displayName,
      walletAddress: TEST_USER_B.walletAddress,
      verificationLevel: "none",
      isVerified: false,
    },
  ]).onConflictDoNothing();

  await db.insert(walletsTable).values([
    {
      id: `wallet_${TEST_USER_A.id}`,
      userId: TEST_USER_A.id,
      address: TEST_USER_A.walletAddress,
      wldBalance: "100.00000000",
      usdcBalance: "500.00000000",
      ethBalance: "0.10000000000000000000",
      pendingGrants: 0,
    },
    {
      id: `wallet_${TEST_USER_B.id}`,
      userId: TEST_USER_B.id,
      address: TEST_USER_B.walletAddress,
      wldBalance: "10.00000000",
      usdcBalance: "50.00000000",
      ethBalance: "0.01000000000000000000",
      pendingGrants: 0,
    },
  ]).onConflictDoNothing();
}

export async function cleanupTestUsers() {
  for (const userId of [TEST_USER_A.id, TEST_USER_B.id]) {
    await db.delete(notificationsTable).where(eq(notificationsTable.userId, userId));
    await db.delete(contactsTable).where(eq(contactsTable.userId, userId));
    await db.delete(verificationSessionsTable).where(eq(verificationSessionsTable.userId, userId));
    await db.delete(verificationsTable).where(eq(verificationsTable.userId, userId));
    await db.delete(transactionsTable).where(eq(transactionsTable.userId, userId));
    await db.delete(walletsTable).where(eq(walletsTable.userId, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));
  }
}
