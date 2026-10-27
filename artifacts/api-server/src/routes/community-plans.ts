import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetAdminCommunityPlansResponse,
  GetCommunityPlansResponse,
  UpdateCommunityPlansBody,
  UpdateCommunityPlansResponse,
  type CommunityPlansContent,
} from "@workspace/api-zod";
import { db, skCommunityPlansTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

const defaultCommunityPlans: CommunityPlansContent = {
  whatsappGroupUrl: "",
  whatsappChannelUrl: "",
  freePlan: {
    isActive: true,
    title: "Free Access",
    description: "Try SK Prompt Party at no cost.",
    priceUsd: 0,
    pricePkr: 0,
    billingPeriod: "always",
    buttonLabel: "Free Access",
    features: [
      "Access to all prompts — current and future",
      "Full prompt content with storyboard images",
      "One-click copy prompt",
      "New viral niches added weekly",
      "Works with Seedance, Kling, Veo & more",
      "Instant access after payment",
      "Cancel anytime",
    ],
  },
  premiumPlan: {
    isActive: true,
    title: "Premium Access",
    description: "Unlock every prompt — current and future.",
    priceUsd: 5,
    pricePkr: 1400,
    billingPeriod: "month",
    buttonLabel: "GET PAYMENT DETAILS",
    features: [
      "Access to all prompts — current and future",
      "Full prompt content with storyboard images",
      "One-click copy prompt",
      "New viral niches added weekly",
      "Works with Seedance, Kling, Veo & more",
      "Instant access after payment",
      "Cancel anytime",
    ],
  },
};

function validateWhatsAppLink(value: string, type: "group" | "channel"): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (type === "group") {
      return url.hostname === "chat.whatsapp.com" && /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
    }
    return ["whatsapp.com", "www.whatsapp.com"].includes(url.hostname)
      && /^\/channel\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

async function readCommunityPlans(): Promise<CommunityPlansContent> {
  const [record] = await db.select().from(skCommunityPlansTable).where(eq(skCommunityPlansTable.id, 1)).limit(1);
  const content = record?.content ?? defaultCommunityPlans;
  return GetCommunityPlansResponse.parse({
    ...content,
    whatsappGroupUrl: content.whatsappGroupUrl ?? "",
    whatsappChannelUrl: content.whatsappChannelUrl ?? "",
    freePlan: {
      ...content.freePlan,
      isActive: content.freePlan.isActive ?? true,
      buttonLabel: content.freePlan.buttonLabel === "Browse Free Prompts" ? "Free Access" : content.freePlan.buttonLabel,
    },
    premiumPlan: { ...content.premiumPlan, isActive: content.premiumPlan.isActive ?? true },
  });
}

router.get("/community-plans", async (_req, res): Promise<void> => {
  res.json(await readCommunityPlans());
});

router.get("/admin/community-plans", requireAdmin, async (_req, res): Promise<void> => {
  res.json(GetAdminCommunityPlansResponse.parse(await readCommunityPlans()));
});

router.put("/admin/community-plans", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateCommunityPlansBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter valid Free and Premium community plan details before saving." });
    return;
  }
  if (!validateWhatsAppLink(parsed.data.whatsappGroupUrl, "group")) {
    res.status(400).json({ error: "Enter a valid WhatsApp group invite link using chat.whatsapp.com." });
    return;
  }
  if (!validateWhatsAppLink(parsed.data.whatsappChannelUrl, "channel")) {
    res.status(400).json({ error: "Enter a valid WhatsApp channel link using whatsapp.com/channel/." });
    return;
  }

  const [content] = await db.insert(skCommunityPlansTable)
    .values({ id: 1, content: parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: skCommunityPlansTable.id,
      set: { content: parsed.data, updatedAt: new Date() },
    })
    .returning();
  res.json(UpdateCommunityPlansResponse.parse(content.content));
});

export default router;
