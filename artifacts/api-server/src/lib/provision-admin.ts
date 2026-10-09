import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db, skAdminsTable } from "@workspace/db";
import { logger } from "./logger";

export async function provisionInitialAdmin(): Promise<void> {
  const username =
    process.env.ADMIN_USERNAME?.trim().toLowerCase() || "skadmin";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  const [existingAdmin] = await db
    .select({ id: skAdminsTable.id })
    .from(skAdminsTable)
    .limit(1);

  if (existingAdmin) {
    return;
  }

  if (!username || !password) {
    logger.warn(
      "No admin account exists. Set ADMIN_USERNAME and ADMIN_INITIAL_PASSWORD to provision the first admin.",
    );
    return;
  }

  if (username.length < 3 || username.length > 100) {
    logger.warn(
      "Initial admin account was not created. ADMIN_USERNAME must be between 3 and 100 characters.",
    );
    return;
  }
  if (password.length < 12 || password.length > 200) {
    logger.warn(
      "Initial admin account was not created. ADMIN_INITIAL_PASSWORD must be between 12 and 200 characters.",
    );
    return;
  }

  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    logger.warn("Initial admin account was not created. ADMIN_EMAIL must be a valid email address.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(skAdminsTable)
    .values({ username, email, passwordHash })
    .onConflictDoNothing({ target: skAdminsTable.username });

  logger.info({ username }, "Initial admin account provisioned");
}

export async function findAdminByLogin(identifier: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const [admin] = await db
    .select()
    .from(skAdminsTable)
    .where(
      or(
        eq(skAdminsTable.username, normalizedIdentifier),
        eq(skAdminsTable.email, normalizedIdentifier),
      ),
    )
    .limit(1);
  return admin;
}
