import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import { loginSchema } from "../validators/auth.schema";

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
