import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetAdminServicesContentResponse,
  GetServicesContentResponse,
  UpdateServicesContentBody,
  UpdateServicesContentResponse,
  type ServicesPageContent,
} from "@workspace/api-zod";
import { db, skServicesContentTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

const defaultServicesContent: ServicesPageContent = {
  heroKicker: "A strategy that meets you where you are",
  heroTitle: "Make your content work smarter",
  heroIntro: "Platform monetization, creator growth, and the strategy that ties it together. Practical services designed around your channel—not a cookie-cutter checklist.",
  servicesLabel: "Our services",
  servicesTitle: "A clear path, platform by platform.",
  serviceCards: [
    { number: "01", title: "YouTube monetization", description: "Get to partner status, unlock revenue, and make every upload work harder.", icon: "youtube", features: ["YPP eligibility roadmap", "Channel & content audit", "AdSense setup guidance"], ctaLabel: "Explore the service" },
    { number: "02", title: "Facebook monetization", description: "Build a stronger presence and turn your videos into a dependable income stream.", icon: "users", features: ["In-stream ads readiness", "Stars & fan support setup", "Rights and policy guidance"], ctaLabel: "Explore the service" },
    { number: "03", title: "TikTok growth & earnings", description: "Create with a point of view, grow an audience, and find the right creator rewards.", icon: "video", features: ["Account health review", "Content growth plan", "Brand deal positioning"], ctaLabel: "Explore the service" },
    { number: "04", title: "Content strategy", description: "A clear creative direction that helps your content reach the right people.", icon: "clapperboard", features: ["Audience & niche mapping", "Format and publishing plan", "Performance-led iteration"], ctaLabel: "Explore the service" },
  ],
  processLabel: "How we work together",
  processTitle: "Less guessing. More forward.",
  processSteps: [
    { number: "01", title: "Listen", description: "We learn about your content, audience, and ambition." },
    { number: "02", title: "Map it", description: "We build a focused plan from where you are right now." },
    { number: "03", title: "Make progress", description: "We support the next steps and adapt as your channel grows." },
  ],
};

async function readServicesContent(): Promise<ServicesPageContent> {
  const [content] = await db.select().from(skServicesContentTable).where(eq(skServicesContentTable.id, 1)).limit(1);
  const data = content ?? defaultServicesContent;
  return GetServicesContentResponse.parse(data);
}

router.get("/services-content", async (_req, res): Promise<void> => {
  res.json(await readServicesContent());
});

router.get("/admin/services-content", requireAdmin, async (_req, res): Promise<void> => {
  res.json(await readServicesContent());
});

router.put("/admin/services-content", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateServicesContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter valid Services page content before saving." });
    return;
  }

  const [content] = await db.insert(skServicesContentTable)
    .values({ id: 1, ...parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: skServicesContentTable.id,
      set: { ...parsed.data, updatedAt: new Date() },
    })
    .returning();
  res.json(UpdateServicesContentResponse.parse(content));
});

export default router;