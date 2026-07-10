import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { uploadImageBuffer } from "../lib/cloudinary";

function serializeImage(image: { id: string; url: string; name: string; width: number; height: number }) {
  return { id: image.id, url: image.url, name: image.name, width: image.width, height: image.height };
}

export async function listImages(_req: Request, res: Response, next: NextFunction) {
  try {
    const images = await prisma.imageAsset.findMany({ orderBy: { createdAt: "asc" } });
    res.json(images.map(serializeImage));
  } catch (error) {
    next(error);
  }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { url, width, height } = await uploadImageBuffer(req.file.buffer);

    const image = await prisma.imageAsset.create({
      data: {
        filename: req.file.originalname,
        url,
        name: req.file.originalname,
        width,
        height,
      },
    });

    res.status(201).json(serializeImage(image));
  } catch (error) {
    next(error);
  }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    // Shape.imageId has onDelete: Cascade, so this also removes every shape
    // drawn on the image.
    await prisma.imageAsset.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
