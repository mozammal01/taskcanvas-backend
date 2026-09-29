import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected yyyy-MM-dd");

export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, "Subtask title is required").max(500),
  completed: z.boolean(),
});

export const resourceSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, "Resource title is required").max(500),
  url: z.string().trim().min(1, "URL is required"),
  addedBy: z.string().optional(),
});

export const taskDraftSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: dateOnly,
  tags: z.array(z.string().trim().max(50)).default([]),
  status: z.enum(["todo", "in_progress", "done"]),
  assignedTo: z.string().trim().max(100).optional().nullable(),
  subtasks: z.array(subtaskSchema).default([]),
  resources: z.array(resourceSchema).default([]),
});

// Defined independently of taskDraftSchema.partial(): partial() does not
// clear a field's .default(), so an omitted array would be silently reset
// to [] instead of left untouched.
export const taskPatchSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: dateOnly.optional(),
  tags: z.array(z.string().trim().max(50)).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  assignedTo: z.string().trim().max(100).optional().nullable(),
  subtasks: z.array(subtaskSchema).optional(),
  resources: z.array(resourceSchema).optional(),
});

export const listTasksQuerySchema = z.object({
  due_date: dateOnly.optional(),
  all: z.enum(["true", "false"]).optional(),
});

export type SubtaskInput = z.infer<typeof subtaskSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
export type TaskDraftInput = z.infer<typeof taskDraftSchema>;
export type TaskPatchInput = z.infer<typeof taskPatchSchema>;
