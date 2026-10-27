import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const USER_SESSION_COOKIE = "sk_media_user_session";
const SESSION_ISSUER = "sk-media-monetization-user";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

export type UserIdentity = {
  id: string;
  name: string;
  email: string;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET must be configured before user auth is used");
  }
  return secret;
}

export function createUserSession(response: Response, user: UserIdentity): void {
  const token = jwt.sign(
    { name: user.name, email: user.email },
    getSessionSecret(),
    { subject: user.id, issuer: SESSION_ISSUER, expiresIn: "8h" },
  );

  response.cookie(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/api",
  });
}

export function clearUserSession(response: Response): void {
  response.clearCookie(USER_SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
  });
}

export function readUserSession(request: Request): UserIdentity | null {
  const token = request.cookies?.[USER_SESSION_COOKIE];
  if (typeof token !== "string" || token.length === 0) return null;

  try {
    const payload = jwt.verify(token, getSessionSecret(), {
      issuer: SESSION_ISSUER,
    }) as JwtPayload;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return { id: payload.sub, name: payload.name, email: payload.email };
  } catch {
    return null;
  }
}

export function requireUser(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const user = readUserSession(request);
  if (!user) {
    response.status(401).json({ error: "Member authentication required" });
    return;
  }

  response.locals.user = user;
  next();
}