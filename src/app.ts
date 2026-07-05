import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config/env";
import { apiRouter } from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

// Vercel's build has, in practice, invoked this module directly as the
// serverless function entry (rather than api/index.ts's re-export), and
// its launcher requires the invoked module's *default* export to be a
// function/server - so export one here too as a defensive fallback,
// regardless of which file actually ends up being the real entry point.
export default app;
