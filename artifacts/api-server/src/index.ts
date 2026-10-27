import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import app from "./app";
import { logger } from "./lib/logger";
import { verifySmtpConnection } from "./lib/lead-email";
import { provisionInitialAdmin } from "./lib/provision-admin";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be configured before starting the API server");
}

void db.execute(sql`
  CREATE TABLE IF NOT EXISTS sk_community_plans (
    id integer PRIMARY KEY DEFAULT 1,
    content jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`)
  .then(() => provisionInitialAdmin())
  .then(async () => {
    const smtp = await verifySmtpConnection();
    if (smtp.status === "verified") {
      logger.info("SMTP connection verified (no email was sent)");
    } else if (smtp.status === "failed") {
      logger.warn({ reason: smtp.reason }, "SMTP verification failed; lead capture remains available");
    } else {
      logger.warn("SMTP is not configured; lead capture remains available without email notifications");
    }

    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Unable to initialize API prerequisites");
    process.exit(1);
  });
