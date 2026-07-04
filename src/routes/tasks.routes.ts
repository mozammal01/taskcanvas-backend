import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listTasks, createTask, patchTask, deleteTask } from "../controllers/tasks.controller";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get("/", listTasks);
tasksRouter.post("/", createTask);
tasksRouter.patch("/:id/", patchTask);
tasksRouter.delete("/:id/", deleteTask);
