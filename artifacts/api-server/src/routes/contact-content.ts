import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetAdminContactContentResponse,
  GetContactContentResponse,
  UpdateContactContentBody,
  UpdateContactContentResponse,
  type ContactPageContent,
} from "@workspace/api-zod";
import { db, skContactContentTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

const defaultContactContent: ContactPageContent = {
  heroKicker: "Start a conversation",
  heroTitle: "Your next move starts with a hello",
  heroIntro: "No complicated pitch deck required. Tell us about your content, your questions, and what you’re working toward.",
  formLabel: "Tell us a little",
  formTitle: "We’ll take it from here.",
  directLabel: "Direct line",
  directDescription: "Choose whichever way feels easiest. We’ll meet you there.",
  primaryPhoneLabel: "Phone / WhatsApp",
  primaryPhone: "+92 311 0380241",
  secondaryPhoneLabel: "Phone",
  secondaryPhone: "+92 343 9360383",
  emailLabel: "Email",
  email: "skmediamonetization@gmail.com",
  locationLabel: "Based in",
  address: "Opposite Daewoo Terminal, IT Park First Floor, Dera Ismail Khan",
  whatsappUrl: "https://wa.me/923110380241",
};

async function readContactContent(): Promise<ContactPageContent> {
  const [content] = await db.select().from(skContactContentTable).where(eq(skContactContentTable.id, 1)).limit(1);
  return GetContactContentResponse.parse(content ?? defaultContactContent);
}

router.get("/contact-content", async (_req, res): Promise<void> => {
  res.json(await readContactContent());
});

router.get("/admin/contact-content", requireAdmin, async (_req, res): Promise<void> => {
  res.json(GetAdminContactContentResponse.parse(await readContactContent()));
});

router.put("/admin/contact-content", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateContactContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter valid Contact page content before saving." });
    return;
  }

  const [content] = await db.insert(skContactContentTable)
    .values({ id: 1, ...parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: skContactContentTable.id,
      set: { ...parsed.data, updatedAt: new Date() },
    })
    .returning();
  res.json(UpdateContactContentResponse.parse(content));
});

export default router;
