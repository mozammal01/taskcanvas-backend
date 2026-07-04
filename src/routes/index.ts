import { Router } from "express";
import { authRouter } from "./auth.routes";
import { tasksRouter } from "./tasks.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/tasks", tasksRouter);
