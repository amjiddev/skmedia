import { asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateTeamMemberBody,
  CreateTeamMemberResponse,
  DeleteTeamMemberParams,
  DeleteTeamMemberResponse,
  GetAdminTeamResponse,
  GetTeamResponse,
  UpdateTeamMemberBody,
  UpdateTeamMemberParams,
  UpdateTeamMemberResponse,
} from "@workspace/api-zod";
import { db, skTeamMembersTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

const starterTeam = [
  { name: "Creator Strategy", role: "Strategy & planning", description: "A thoughtful plan shaped around your channel, audience, and goals.", image: "photo-1500648767791-00dcc994a43e" },
  { name: "Monetization Guidance", role: "Platform readiness", description: "Clear guidance to understand monetization options and platform requirements.", image: "photo-1534528741775-53994a69daeb" },
  { name: "YouTube Support", role: "Channel growth", description: "Practical next steps to build a stronger foundation for your channel.", image: "photo-1506794778202-cad84cf45f1d" },
  { name: "Facebook Growth", role: "Audience strategy", description: "Ideas to help creators strengthen their presence and reach.", image: "photo-1544005313-94ddf0286df2" },
  { name: "TikTok Planning", role: "Content direction", description: "Focused support to make your content and goals work together.", image: "photo-1507003211169-0a1dd7228f2d" },
  { name: "Creator Support", role: "Ongoing guidance", description: "A clear, creator-first partner as your work and ambitions grow.", image: "photo-1508214751196-bcfd4ca60f91" },
];

let starterSeed: Promise<void> | undefined;
async function ensureStarterTeam() {
  starterSeed ??= (async () => {
    const [existing] = await db.select({ id: skTeamMembersTable.id }).from(skTeamMembersTable).limit(1);
    if (!existing) {
      await db.insert(skTeamMembersTable).values(starterTeam.map((member, sortOrder) => ({
        ...member,
        sortOrder,
        isPublished: true,
      })));
    }
  })().catch((error: unknown) => {
    starterSeed = undefined;
    throw error;
  });
  await starterSeed;
}

const toIsoDates = <T extends { createdAt: Date; updatedAt: Date }>(row: T) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

router.get("/team", async (_req, res): Promise<void> => {
  await ensureStarterTeam();
  const members = await db.select().from(skTeamMembersTable)
    .where(eq(skTeamMembersTable.isPublished, true))
    .orderBy(asc(skTeamMembersTable.sortOrder), asc(skTeamMembersTable.createdAt));
  res.json(GetTeamResponse.parse(members.map(toIsoDates)));
});

router.get("/admin/team", requireAdmin, async (_req, res): Promise<void> => {
  await ensureStarterTeam();
  const members = await db.select().from(skTeamMembersTable)
    .orderBy(asc(skTeamMembersTable.sortOrder), asc(skTeamMembersTable.createdAt));
  res.json(GetAdminTeamResponse.parse(members.map(toIsoDates)));
});

router.post("/admin/team", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter valid team member details before saving." });
    return;
  }
  const [member] = await db.insert(skTeamMembersTable).values(parsed.data).returning();
  res.status(201).json(CreateTeamMemberResponse.parse(toIsoDates(member)));
});

router.patch("/admin/team/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateTeamMemberParams.safeParse(req.params);
  const body = UpdateTeamMemberBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Enter valid team member details before saving." });
    return;
  }
  const [member] = await db.update(skTeamMembersTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(skTeamMembersTable.id, params.data.id))
    .returning();
  if (!member) {
    res.status(404).json({ error: "Team member not found." });
    return;
  }
  res.json(UpdateTeamMemberResponse.parse(toIsoDates(member)));
});

router.delete("/admin/team/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid team member id." });
    return;
  }
  const [deleted] = await db.delete(skTeamMembersTable)
    .where(eq(skTeamMembersTable.id, params.data.id))
    .returning({ id: skTeamMembersTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Team member not found." });
    return;
  }
  res.json(DeleteTeamMemberResponse.parse({ success: true }));
});

export default router;