import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { taskDraftSchema, taskPatchSchema, listTasksQuerySchema } from "../validators/task.schema";

type TaskRow = Awaited<ReturnType<typeof prisma.task.findFirstOrThrow>>;

function serializeTask(task: TaskRow) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    priority: task.priority,
    dueDate: task.dueDate.toISOString().slice(0, 10),
    tags: task.tags,
    status: task.status,
  };
}

function parseDueDate(dueDate: string): Date {
  return new Date(`${dueDate}T00:00:00.000Z`);
}

export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { due_date } = listTasksQuerySchema.parse(req.query);

    const tasks = await prisma.task.findMany({
      where: due_date ? { dueDate: parseDueDate(due_date) } : undefined,
      orderBy: { createdAt: "asc" },
    });

    res.json(tasks.map(serializeTask));
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const input = taskDraftSchema.parse(req.body);

    const task = await prisma.task.create({
      data: { ...input, dueDate: parseDueDate(input.dueDate) },
    });

    res.status(201).json(serializeTask(task));
  } catch (error) {
    next(error);
  }
}

export async function patchTask(req: Request, res: Response, next: NextFunction) {
  try {
    const input = taskPatchSchema.parse(req.body);
    const { dueDate, ...rest } = input;

    const task = await prisma.task.update({
      where: { id: req.params.id as string },
      data: { ...rest, ...(dueDate ? { dueDate: parseDueDate(dueDate) } : {}) },
    });

    res.json(serializeTask(task));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Task not found" });
    }
    next(error);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.task.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Task not found" });
    }
    next(error);
  }
}
