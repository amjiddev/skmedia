import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { GetAboutContentResponse, UpdateAboutContentBody, type AboutContent } from "@workspace/api-zod";
import { db, skAboutContentTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

const defaultAboutContent: AboutContent = {
  heroKicker: "A different kind of partner",
  heroTitle: "Creators deserve to be seen",
  heroIntro: "SK Media Monetization exists to help creators move from making content to building something sustainable around it.",
  storyLabel: "Our story",
  storyTitle: "Built for the people behind the posts.",
  storyBody: "Creators are building culture, communities, and businesses every day. But the rules around platform monetization can feel opaque, and the advice available often skips the human part.\n\nOur focus is making those next steps easier to understand. From platform readiness to content strategy, we offer practical guidance with respect for what makes each creator different.\n\nWe’re based in Pakistan, built for a global creator landscape, and committed to earning trust one clear conversation at a time.",
  storyImage: "photo-1521737711867-e3b97375f902",
  storyCaption: "Creator-first. Built for what’s next.",
  missionLabel: "Our mission",
  missionTitle: "Make creator income feel more within reach.",
  missionBody: "We help creators understand their options, build a healthier content foundation, and pursue monetization with confidence. The goal isn’t to make you someone else. It’s to help your work go further as you.",
  missionImage: "photo-1516321318423-f06f85e504b3",
  missionCaption: "Helping your work go further.",
};

async function readAboutContent(): Promise<AboutContent> {
  const [content] = await db.select().from(skAboutContentTable).where(eq(skAboutContentTable.id, 1)).limit(1);
  return GetAboutContentResponse.parse(content ?? defaultAboutContent);
}

router.get("/about-content", async (_req, res): Promise<void> => {
  res.json(await readAboutContent());
});

router.get("/admin/about-content", requireAdmin, async (_req, res): Promise<void> => {
  res.json(await readAboutContent());
});

router.put("/admin/about-content", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAboutContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter valid About page content before saving." });
    return;
  }

  const [content] = await db.insert(skAboutContentTable)
    .values({ id: 1, ...parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: skAboutContentTable.id,
      set: { ...parsed.data, updatedAt: new Date() },
    })
    .returning();
  res.json(GetAboutContentResponse.parse(content));
});

export default router;