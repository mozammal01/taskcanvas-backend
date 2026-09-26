import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import { loginSchema, signUpSchema } from "../validators/auth.schema";

export async function signUp(req: Request, res: Response, next: NextFunction) {
  try {
    const input = signUpSchema.parse(req.body);
    const email = input.email;
    const password = input.password;
    const rawName = input.name || input.fullName || input.username || req.body.name || req.body.fullName;
    const name = rawName ? String(rawName).trim() : null;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
        error: "User with this email already exists",
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    const access = signAccessToken(user.id);
    const refresh = signRefreshToken(user.id);

    res.status(201).json({
      message: "User registered successfully",
      access,
      refresh,
      token: access,
      user: { id: user.id, email: user.email, name: user.name ?? undefined },
    });
  } catch (error) {
    next(error);
  }
}

export const register = signUp;

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const access = signAccessToken(user.id);
    const refresh = signRefreshToken(user.id);

    res.json({
      access,
      refresh,
      user: { id: user.id, email: user.email, name: user.name ?? undefined },
    });
  } catch (error) {
    next(error);
  }
}

