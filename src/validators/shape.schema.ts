import { z } from "zod";

const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const shapeSchema = z.object({
  id: z.string(),
  imageId: z.string(),
  points: z.array(pointSchema),
  label: z.string().optional(),
});

export const replaceShapesSchema = z.object({
  shapes: z.array(shapeSchema),
});

export const listShapesQuerySchema = z.object({
  image: z.string().min(1, "image query param is required"),
});
