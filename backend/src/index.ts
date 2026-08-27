import cors from "cors";
import express from "express";
import morgan from "morgan";
import mongoose from "mongoose";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  logger.info("Connected to MongoDB");

  const app = express();

  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", env: env.NODE_ENV });
  });

  // Route modules (documents, chat, contradictions) get mounted here as they're built.

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    logger.info(`Backend listening on port ${env.PORT}`);
  });
}

main().catch((err) => {
  logger.error("Fatal startup error", { err: err instanceof Error ? err.message : err });
  process.exit(1);
});
