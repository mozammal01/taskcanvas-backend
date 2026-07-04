import { Router } from "express";
import { authRouter } from "./auth.routes";
import { tasksRouter } from "./tasks.routes";
import { annotateRouter } from "./annotate.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/annotate", annotateRouter);
