import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const ADMIN_SESSION_COOKIE = "sk_media_admin_session";
const SESSION_ISSUER = "sk-media-monetization";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

export type AdminIdentity = {
  id: string;
  username: string;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET must be configured before admin auth is used");
  }
  return secret;
}

export function createAdminSession(
  response: Response,
  admin: AdminIdentity,
): void {
  const token = jwt.sign({ username: admin.username }, getSessionSecret(), {
    subject: admin.id,
    issuer: SESSION_ISSUER,
    expiresIn: "8h",
  });

  response.cookie(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/api",
  });
}

export function clearAdminSession(response: Response): void {
  response.clearCookie(ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
  });
}

export function readAdminSession(request: Request): AdminIdentity | null {
  const token = request.cookies?.[ADMIN_SESSION_COOKIE];
  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getSessionSecret(), {
      issuer: SESSION_ISSUER,
    }) as JwtPayload;
    if (typeof payload.sub !== "string" || typeof payload.username !== "string") {
      return null;
    }

    return { id: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

export function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const admin = readAdminSession(request);
  if (!admin) {
    response.status(401).json({ error: "Admin authentication required" });
    return;
  }

  response.locals.admin = admin;
  next();
}
