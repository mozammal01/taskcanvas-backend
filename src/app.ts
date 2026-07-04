import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config/env";
import { apiRouter } from "./routes";

export const app = express();

app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRouter);
