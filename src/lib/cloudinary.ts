import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/env";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  width: number;
  height: number;
}

export function uploadImageBuffer(buffer: Buffer, folder = "taskcanvas"): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
      if (error || !result) {
        return reject(error ?? new Error("Cloudinary upload failed"));
      }
      resolve({ url: result.secure_url, width: result.width, height: result.height });
    });

    stream.end(buffer);
  });
}
