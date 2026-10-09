import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { rateLimit } from "express-rate-limit";
import { Router, type IRouter } from "express";
import {
  GetMemberSessionResponse,
  MemberLoginBody,
  MemberLoginResponse,
  MemberLogoutResponse,
  MemberRegisterBody,
  MemberRegisterResponse,
} from "@workspace/api-zod";
import { db, skUsersTable } from "@workspace/db";
import {
  clearUserSession,
  createUserSession,
  readUserSession,
} from "../lib/user-auth";

const router: IRouter = Router();

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please try again later." },
});

router.post("/auth/register", registrationLimiter, async (req, res): Promise<void> => {
  const parsed = MemberRegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter your name, a valid email, and a password of at least 8 characters." });
    return;
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  if (name.length < 2) {
    res.status(400).json({ error: "Your name must contain at least 2 characters." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [user] = await db
    .insert(skUsersTable)
    .values({ name, email, passwordHash })
    .onConflictDoNothing({ target: skUsersTable.email })
    .returning({ id: skUsersTable.id, name: skUsersTable.name, email: skUsersTable.email });

  if (!user) {
    res.status(409).json({ error: "An account with this email already exists. Please sign in instead." });
    return;
  }

  res.status(201).json(MemberRegisterResponse.parse({ authenticated: false, user: null }));
});

router.post("/auth/login", loginLimiter, async (req, res): Promise<void> => {
  const parsed = MemberLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email and password." });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(skUsersTable)
    .where(eq(skUsersTable.email, email))
    .limit(1);

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Incorrect email or password." });
    return;
  }

  const identity = { id: user.id, name: user.name, email: user.email };
  createUserSession(res, identity);
  res.json(MemberLoginResponse.parse({ authenticated: true, user: identity }));
});

router.get("/auth/session", (req, res): void => {
  const user = readUserSession(req);
  res.json(
    GetMemberSessionResponse.parse({ authenticated: Boolean(user), user }),
  );
});

router.post("/auth/logout", (_req, res): void => {
  clearUserSession(res);
  res.json(MemberLogoutResponse.parse({ success: true }));
});

export default router;