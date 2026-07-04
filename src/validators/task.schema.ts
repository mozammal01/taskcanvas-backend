import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected yyyy-MM-dd");

export const taskDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: dateOnly,
  tags: z.array(z.string()).default([]),
  status: z.enum(["todo", "in_progress", "done"]),
});

// Defined independently of taskDraftSchema.partial(): partial() does not
// clear a field's .default(), so an omitted `tags` would be silently reset
// to [] instead of left untouched (would wipe tags on every drag-and-drop
// status update from the frontend).
export const taskPatchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: dateOnly.optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

export const listTasksQuerySchema = z.object({
  due_date: dateOnly.optional(),
});

export type TaskDraftInput = z.infer<typeof taskDraftSchema>;
export type TaskPatchInput = z.infer<typeof taskPatchSchema>;
