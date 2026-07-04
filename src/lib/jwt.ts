import jwt from "jsonwebtoken";
import { config } from "../config/env";

export interface AccessTokenPayload {
  sub: number;
}

export function signAccessToken(userId: number): string {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(userId: number): string {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
}
