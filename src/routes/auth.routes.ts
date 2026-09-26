import { Router } from "express";
import { login, signUp } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/register", signUp);
authRouter.post("/login", login);
authRouter.post("/login/", login);

