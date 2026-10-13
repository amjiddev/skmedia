import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
    ? error.status
    : 500;
  logger.error({ err: error, status }, "API request failed");
  if (res.headersSent) return;
  res.status(status).json({
    error: status === 413
      ? "Request is too large. Please choose a smaller prompt image or file and try again."
      : "The request could not be completed. Please retry or contact support.",
  });
});

export default app;
