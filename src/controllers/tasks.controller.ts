import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { taskDraftSchema, taskPatchSchema, listTasksQuerySchema } from "../validators/task.schema";

function serializeTask(task: any) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    priority: task.priority,
    dueDate: task.dueDate.toISOString().slice(0, 10),
    tags: task.tags,
    status: task.status,
    assignedTo: task.assignedTo ?? undefined,
    subtasks: task.subtasks ?? [],
    resources: task.resources ?? [],
    userId: task.userId,
    createdBy: task.user
      ? {
          id: task.user.id,
          name: task.user.name,
          email: task.user.email,
        }
      : undefined,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function parseDueDate(dueDate: string): Date {
  return new Date(`${dueDate}T00:00:00.000Z`);
}

export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { due_date, all } = listTasksQuerySchema.parse(req.query);

    const whereClause: Prisma.TaskWhereInput = {
      userId,
      ...(due_date && all !== "true" ? { dueDate: parseDueDate(due_date) } : {}),
    };

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    });

    res.json(tasks.map(serializeTask));
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const input = taskDraftSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: parseDueDate(input.dueDate),
        tags: input.tags,
        status: input.status,
        assignedTo: input.assignedTo,
        subtasks: input.subtasks,
        resources: input.resources,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(serializeTask(task));
  } catch (error) {
    next(error);
  }
}

export async function patchTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const taskId = req.params.id as string;
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Task not found" });
    }

    const input = taskPatchSchema.parse(req.body);
    const { dueDate, subtasks, resources, ...rest } = input;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...rest,
        ...(dueDate ? { dueDate: parseDueDate(dueDate) } : {}),
        ...(subtasks !== undefined ? { subtasks: subtasks as any } : {}),
        ...(resources !== undefined ? { resources: resources as any } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
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
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const taskId = req.params.id as string;
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Task not found" });
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Task not found" });
    }
    next(error);
  }
}
