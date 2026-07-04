import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { listImages, uploadImage } from "../controllers/images.controller";

export const annotateRouter = Router();

annotateRouter.use(requireAuth);

annotateRouter.get("/images/", listImages);
annotateRouter.post("/images/", upload.single("file"), uploadImage);
