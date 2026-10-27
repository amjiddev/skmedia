import "dotenv/config";
import bcrypt from "bcryptjs";
import { createRequire } from "node:module";
const requireDb = createRequire(new URL("../../lib/db/package.json", import.meta.url));
const { Client } = requireDb("pg");
const client = new Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const { rows } = await client.query("select username, email, password_hash from sk_admins");
  const accounts = await Promise.all(rows.map(async (row) => ({
    isExpectedAdminUsername: row.username.toLowerCase() === "admin",
    hasEmail: Boolean(row.email),
    emailMatchesProfileScreenshot: (row.email || "").toLowerCase() === "amjidmsd25@gmail.com",
    configuredInitialPasswordMatches: Boolean(process.env.ADMIN_INITIAL_PASSWORD && await bcrypt.compare(process.env.ADMIN_INITIAL_PASSWORD, row.password_hash)),
  })));
  console.log(JSON.stringify({ accountCount: rows.length, accounts }));
} catch {
  console.log(JSON.stringify({ checkFailed: true }));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
