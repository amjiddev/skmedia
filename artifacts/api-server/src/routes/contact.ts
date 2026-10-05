import { rateLimit } from "express-rate-limit";
import { Router, type IRouter } from "express";
import { db, skContactsTable } from "@workspace/db";
import { CreateContactBody, CreateContactResponse } from "@workspace/api-zod";
import { sendLeadNotification } from "../lib/lead-email";

const router: IRouter = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .trim();
}

router.post("/contact", contactLimiter, async (req, res): Promise<void> => {
  const body =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body
      : {};
  const cleaned = {
    name: sanitizeText(body.name),
    email:
      typeof body.email === "string"
        ? body.email.normalize("NFKC").trim().toLowerCase()
        : body.email,
    phone: sanitizeText(body.phone),
    platform: sanitizeText(body.platform),
    message: sanitizeText(body.message),
  };
  const parsed = CreateContactBody.safeParse(cleaned);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.flatten() }, "Invalid contact submission");
    res.status(400).json({ error: "Please check the contact details and try again." });
    return;
  }

  if (!/^\+?[\d\s().-]{7,32}$/.test(parsed.data.phone)) {
    res.status(400).json({ error: "Please enter a valid phone number." });
    return;
  }

  const [lead] = await db
    .insert(skContactsTable)
    .values({
      ...parsed.data,
      message: parsed.data.message || null,
    })
    .returning();

  if (!lead) {
    res.status(500).json({ error: "Your request could not be saved. Please try again." });
    return;
  }

  const notification = await sendLeadNotification(lead);
  if (notification.status === "failed") {
    req.log.error(
      { reason: notification.reason, leadId: lead.id },
      "Lead email notification failed",
    );
  } else if (notification.status === "not_configured") {
    req.log.warn(
      { leadId: lead.id },
      "Lead saved without an email notification because SMTP is not configured",
    );
  }

  res.status(201).json(
    CreateContactResponse.parse({
      id: lead.id,
      message: "Your enquiry has been saved. We'll be in touch soon.",
      emailNotification: notification.status,
    }),
  );
});

export default router;
