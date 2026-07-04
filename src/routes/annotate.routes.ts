import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { listImages, uploadImage } from "../controllers/images.controller";
import { listShapes, replaceShapes } from "../controllers/shapes.controller";

export const annotateRouter = Router();

annotateRouter.use(requireAuth);

annotateRouter.get("/images/", listImages);
annotateRouter.post("/images/", upload.single("file"), uploadImage);
annotateRouter.put("/images/:imageId/shapes/", replaceShapes);

annotateRouter.get("/shapes/", listShapes);
