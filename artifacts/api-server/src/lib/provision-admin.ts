import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, skAdminsTable } from "@workspace/db";
import { logger } from "./logger";

export async function provisionInitialAdmin(): Promise<void> {
  const username =
    process.env.ADMIN_USERNAME?.trim().toLowerCase() || "skadmin";
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

  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(skAdminsTable)
    .values({ username, passwordHash })
    .onConflictDoNothing({ target: skAdminsTable.username });

  logger.info({ username }, "Initial admin account provisioned");
}

export async function findAdminByUsername(username: string) {
  const [admin] = await db
    .select()
    .from(skAdminsTable)
    .where(eq(skAdminsTable.username, username))
    .limit(1);
  return admin;
}
