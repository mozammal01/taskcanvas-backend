import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { replaceShapesSchema, listShapesQuerySchema } from "../validators/shape.schema";

type ShapeRow = Awaited<ReturnType<typeof prisma.shape.findFirstOrThrow>>;

function serializeShape(shape: ShapeRow) {
  return {
    id: shape.id,
    imageId: shape.imageId,
    points: shape.points,
    label: shape.label ?? undefined,
  };
}

export async function listShapes(req: Request, res: Response, next: NextFunction) {
  try {
    const { image } = listShapesQuerySchema.parse(req.query);

    const shapes = await prisma.shape.findMany({
      where: { imageId: image },
    });

    res.json(shapes.map(serializeShape));
  } catch (error) {
    next(error);
  }
}

export async function replaceShapes(req: Request, res: Response, next: NextFunction) {
  try {
    const imageId = req.params.imageId as string;
    const { shapes } = replaceShapesSchema.parse(req.body);

    await prisma.$transaction([
      prisma.shape.deleteMany({ where: { imageId } }),
      prisma.shape.createMany({
        data: shapes.map((shape) => ({
          id: shape.id,
          imageId,
          points: shape.points,
          label: shape.label,
        })),
      }),
    ]);

    const fresh = await prisma.shape.findMany({ where: { imageId } });
    res.json(fresh.map(serializeShape));
  } catch (error) {
    next(error);
  }
}
