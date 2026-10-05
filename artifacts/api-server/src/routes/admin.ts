import bcrypt from "bcryptjs";
import { count, desc, eq } from "drizzle-orm";
import { rateLimit } from "express-rate-limit";
import { Router, type IRouter } from "express";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminLogoutResponse,
  DeleteContactParams,
  DeleteContactResponse,
  GetAdminSessionResponse,
  GetContactSummaryResponse,
  GetContactsResponse,
  UpdateContactStatusBody,
  UpdateContactStatusParams,
  UpdateContactStatusResponse,
} from "@workspace/api-zod";
import { db, skContactsTable } from "@workspace/db";
import {
  clearAdminSession,
  createAdminSession,
  readAdminSession,
  requireAdmin,
} from "../lib/admin-auth";
import { findAdminByUsername } from "../lib/provision-admin";

const router: IRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please try again later." },
});

router.post("/admin/login", loginLimiter, async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter your username and password." });
    return;
  }

  const username = parsed.data.username.trim().toLowerCase();
  const admin = await findAdminByUsername(username);
  if (!admin || !(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  createAdminSession(res, { id: admin.id, username: admin.username });
  res.json(
    AdminLoginResponse.parse({
      authenticated: true,
      username: admin.username,
    }),
  );
});

router.get("/admin/session", (req, res): void => {
  const session = readAdminSession(req);
  res.json(
    GetAdminSessionResponse.parse(
      session
        ? { authenticated: true, username: session.username }
        : { authenticated: false, username: null },
    ),
  );
});

router.post("/admin/logout", (_req, res): void => {
  clearAdminSession(res);
  res.json(AdminLogoutResponse.parse({ success: true }));
});

router.get("/contacts", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(skContactsTable)
    .orderBy(desc(skContactsTable.createdAt));

  res.json(
    GetContactsResponse.parse(
      rows.map((lead) => ({ ...lead, createdAt: lead.createdAt.toISOString() })),
    ),
  );
});

router.get("/contacts/summary", requireAdmin, async (_req, res): Promise<void> => {
  const grouped = await db
    .select({ status: skContactsTable.status, total: count() })
    .from(skContactsTable)
    .groupBy(skContactsTable.status);
  const summary = {
    total: grouped.reduce((sum, group) => sum + group.total, 0),
    new: grouped.find((group) => group.status === "new")?.total ?? 0,
    contacted:
      grouped.find((group) => group.status === "contacted")?.total ?? 0,
  };
  res.json(GetContactSummaryResponse.parse(summary));
});

router.patch("/contacts/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateContactStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid contact id." });
    return;
  }

  const body = UpdateContactStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid contact status." });
    return;
  }

  const [lead] = await db
    .update(skContactsTable)
    .set({ status: body.data.status })
    .where(eq(skContactsTable.id, params.data.id))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Contact lead not found." });
    return;
  }

  res.json(
    UpdateContactStatusResponse.parse({
      ...lead,
      createdAt: lead.createdAt.toISOString(),
    }),
  );
});

router.delete("/contacts/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid contact id." });
    return;
  }

  const [deleted] = await db
    .delete(skContactsTable)
    .where(eq(skContactsTable.id, params.data.id))
    .returning({ id: skContactsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Contact lead not found." });
    return;
  }

  res.json(DeleteContactResponse.parse({ success: true }));
});

export default router;
