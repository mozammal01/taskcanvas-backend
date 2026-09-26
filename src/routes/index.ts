import { Router } from "express";
import { authRouter } from "./auth.routes";
import { tasksRouter } from "./tasks.routes";
import { annotateRouter } from "./annotate.routes";
import { signUp, login } from "../controllers/auth.controller";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.post("/signup", signUp);
apiRouter.post("/register", signUp);
apiRouter.post("/login", login);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/annotate", annotateRouter);

