import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetAdminFaqsResponse,
  GetFaqsResponse,
  UpdateAdminFaqsBody,
  UpdateAdminFaqsResponse,
} from "@workspace/api-zod";
import { db, skFaqContentTable, type FAQEntry } from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

const defaultFaqContent = {
  title: "Your Questions, Answered Clearly",
  description: "Still deciding if we’re the right fit? Start here.",
};

const defaultFaqs: FAQEntry[] = [
  { id: "faq-following", question: "Do I need a large following to work with you?", answer: "Not at all. We meet you where you are. We’ll look at your content, goals, and platform eligibility, then map the most sensible next step.", isPublished: true },
  { id: "faq-platforms", question: "Which platforms do you support?", answer: "We work across YouTube, Facebook, and TikTok, with content strategy that can support your wider creator presence too.", isPublished: true },
  { id: "faq-guarantee", question: "Can you guarantee monetization or earnings?", answer: "No one can responsibly guarantee platform approval or a specific income. We offer experienced guidance, clear next steps, and hands-on support—without promises that depend on platform decisions.", isPublished: true },
  { id: "faq-conversation", question: "How does the first conversation work?", answer: "Send a short note through the form or WhatsApp. We’ll learn about your channel, answer your questions, and recommend a path that makes sense for you.", isPublished: true },
];

async function readFaqContent() {
  const [content] = await db.select().from(skFaqContentTable).where(eq(skFaqContentTable.id, 1)).limit(1);
  return {
    title: content?.title ?? defaultFaqContent.title,
    description: content?.description ?? defaultFaqContent.description,
    faqs: content?.faqs ?? defaultFaqs,
  };
}

router.get("/faqs", async (_req, res): Promise<void> => {
  const content = await readFaqContent();
  res.json(GetFaqsResponse.parse({ ...content, faqs: content.faqs.filter((faq) => faq.isPublished) }));
});

router.get("/admin/faqs", requireAdmin, async (_req, res): Promise<void> => {
  res.json(GetAdminFaqsResponse.parse(await readFaqContent()));
});

router.put("/admin/faqs", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminFaqsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter valid FAQ questions and answers before saving." });
    return;
  }

  const [content] = await db.insert(skFaqContentTable)
    .values({ id: 1, title: parsed.data.title, description: parsed.data.description, faqs: parsed.data.faqs, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: skFaqContentTable.id,
      set: { title: parsed.data.title, description: parsed.data.description, faqs: parsed.data.faqs, updatedAt: new Date() },
    })
    .returning();
  res.json(UpdateAdminFaqsResponse.parse({ title: content.title, description: content.description, faqs: content.faqs }));
});

export default router;
