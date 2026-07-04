import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { imageSize } from "image-size";
import { prisma } from "../lib/prisma";
import { config } from "../config/env";

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

    const { width, height } = imageSize(req.file.buffer);
    const extension = path.extname(req.file.originalname) || "";
    const filename = `${randomUUID()}${extension}`;

    await fs.mkdir(config.UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(config.UPLOAD_DIR, filename), req.file.buffer);

    const image = await prisma.imageAsset.create({
      data: {
        filename,
        url: `${config.PUBLIC_ORIGIN}/uploads/${filename}`,
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
