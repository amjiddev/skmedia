import bcrypt from "bcryptjs";
import { and, count, desc, eq, ne } from "drizzle-orm";
import { rateLimit } from "express-rate-limit";
import { Router, type IRouter } from "express";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminLogoutResponse,
  ChangeAdminPasswordBody,
  ChangeAdminPasswordResponse,
  CreateSharedIdeaBody,
  CreateSharedIdeaResponse,
  DeleteContactParams,
  DeleteContactResponse,
  GetAdminSessionResponse,
  UpdateAdminProfileBody,
  UpdateAdminProfileResponse,
  GetContactSummaryResponse,
  GetContactsResponse,
  GetSharedIdeasResponse,
  UpdateContactStatusBody,
  UpdateContactStatusParams,
  UpdateContactStatusResponse,
} from "@workspace/api-zod";
import { db, skAdminsTable, skContactsTable, skIdeasTable } from "@workspace/db";
import {
  clearAdminSession,
  createAdminSession,
  readAdminSession,
  requireAdmin,
} from "../lib/admin-auth";
import { findAdminByLogin } from "../lib/provision-admin";
import { readUserSession } from "../lib/user-auth";

const router: IRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please try again later." },
});

router.post("/admin/login", loginLimiter, async (req, res): Promise<void> => {
  const legacyOrCurrentBody = req.body as { identifier?: unknown; username?: unknown; password?: unknown };
  const parsed = AdminLoginBody.safeParse({
    identifier: legacyOrCurrentBody.identifier ?? legacyOrCurrentBody.username,
    password: legacyOrCurrentBody.password,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Enter your username and password." });
    return;
  }

  const identifier = parsed.data.identifier;
  if (!identifier) {
    res.status(400).json({ error: "Enter your username or email and password." });
    return;
  }

  const admin = await findAdminByLogin(identifier);
  if (!admin || !(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  createAdminSession(res, { id: admin.id, username: admin.username });
  res.json(
    AdminLoginResponse.parse({
      authenticated: true,
      username: admin.username,
      email: admin.email,
    }),
  );
});

router.get("/admin/session", async (req, res): Promise<void> => {
  const session = readAdminSession(req);
  const [admin] = session
    ? await db
        .select({ username: skAdminsTable.username, email: skAdminsTable.email })
        .from(skAdminsTable)
        .where(eq(skAdminsTable.id, session.id))
        .limit(1)
    : [];
  res.json(
    GetAdminSessionResponse.parse(
      admin
        ? { authenticated: true, username: admin.username, email: admin.email }
        : { authenticated: false, username: null, email: null },
    ),
  );
});

router.patch("/admin/profile", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  const admin = res.locals.admin as { id: string; username: string } | undefined;
  if (!admin) {
    res.status(401).json({ error: "Admin authentication required." });
    return;
  }

  const email = parsed.data.email?.trim().toLowerCase() || null;
  if (email) {
    const [existingAdmin] = await db
      .select({ id: skAdminsTable.id })
      .from(skAdminsTable)
      .where(and(eq(skAdminsTable.email, email), ne(skAdminsTable.id, admin.id)))
      .limit(1);
    if (existingAdmin) {
      res.status(409).json({ error: "That email address is already assigned to another admin." });
      return;
    }
  }

  const [updatedAdmin] = await db
    .update(skAdminsTable)
    .set({ email })
    .where(eq(skAdminsTable.id, admin.id))
    .returning({ username: skAdminsTable.username, email: skAdminsTable.email });
  if (!updatedAdmin) {
    res.status(401).json({ error: "Admin authentication required." });
    return;
  }

  res.json(UpdateAdminProfileResponse.parse({ authenticated: true, ...updatedAdmin }));
});

router.post("/admin/logout", (_req, res): void => {
  clearAdminSession(res);
  res.json(AdminLogoutResponse.parse({ success: true }));
});

router.post("/admin/change-password", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ChangeAdminPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "New password must be between 8 and 200 characters." });
    return;
  }

  const admin = res.locals.admin as { id: string; username: string } | undefined;
  if (!admin) {
    res.status(401).json({ error: "Admin authentication required." });
    return;
  }

  const [storedAdmin] = await db
    .select({ passwordHash: skAdminsTable.passwordHash })
    .from(skAdminsTable)
    .where(eq(skAdminsTable.id, admin.id))
    .limit(1);
  if (!storedAdmin || !(await bcrypt.compare(parsed.data.oldPassword, storedAdmin.passwordHash))) {
    res.status(400).json({ error: "Current password is incorrect." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const [updatedAdmin] = await db
    .update(skAdminsTable)
    .set({ passwordHash })
    .where(eq(skAdminsTable.id, admin.id))
    .returning({ id: skAdminsTable.id });
  if (!updatedAdmin) {
    res.status(401).json({ error: "Admin account no longer exists." });
    return;
  }

  res.json(ChangeAdminPasswordResponse.parse({ success: true }));
});

router.get("/ideas", async (_req, res): Promise<void> => {
  const ideas = await db.select().from(skIdeasTable).orderBy(desc(skIdeasTable.createdAt));
  res.json(
    GetSharedIdeasResponse.parse(
      ideas.map((idea) => ({ ...idea, createdAt: idea.createdAt.toISOString() })),
    ),
  );
});

router.post("/ideas", async (req, res): Promise<void> => {
  const parsed = CreateSharedIdeaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid title, category, description, and tag for the idea." });
    return;
  }

  const admin = readAdminSession(req);
  const user = readUserSession(req);
  const creator = admin ? { name: "Admin" } : user;
  if (!creator) {
    res.status(401).json({ error: "Authentication required to share an idea." });
    return;
  }

  const [idea] = await db
    .insert(skIdeasTable)
    .values({ ...parsed.data, postedBy: creator.name })
    .returning();
  res.status(201).json(
    CreateSharedIdeaResponse.parse({ ...idea, createdAt: idea.createdAt.toISOString() }),
  );
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
