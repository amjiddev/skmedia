import app from "./app";
import { logger } from "./lib/logger";
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

void provisionInitialAdmin()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Unable to initialize the admin account");
    process.exit(1);
  });
