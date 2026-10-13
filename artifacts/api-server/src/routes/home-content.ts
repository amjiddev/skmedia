import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetAdminHomeContentResponse,
  GetHomeContentResponse,
  UpdateHomeContentBody,
  UpdateHomeContentResponse,
} from "@workspace/api-zod";
import { db, skHomeContentTable, type HomePageContent } from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

const defaultHomeContent: HomePageContent = {
  hero: {
    brandTitle: "SK MEDIA",
    brandSubtitle: "MONETIZATION",
    badge: "WE HELP YOU EARN FROM WHAT YOU LOVE!",
    intro: "We help YouTube, Facebook, and TikTok creators turn their content into a stronger, more sustainable business.",
    primaryCta: "Contact Us Now",
    secondaryCta: "See how we help",
    chartTitle: "Creator earnings overview",
    chartTotal: "$24,560.00",
    chartGrowth: "+18.6%",
    chartGrowthCaption: "this month",
    chartMonths: [
      { month: "Jan", earnings: 9200, bonus: 1800 }, { month: "Feb", earnings: 11800, bonus: 2400 },
      { month: "Mar", earnings: 10500, bonus: 2100 }, { month: "Apr", earnings: 15400, bonus: 3200 },
      { month: "May", earnings: 14300, bonus: 2800 }, { month: "Jun", earnings: 19200, bonus: 4100 },
      { month: "Jul", earnings: 17800, bonus: 3800 }, { month: "Aug", earnings: 24560, bonus: 5200 },
    ],
    chartPlatforms: [{ name: "YouTube", amount: "$16,840" }, { name: "Facebook", amount: "$5,220" }, { name: "TikTok", amount: "$2,500" }],
    chartDisclaimer: "A sample creator earnings overview. Results vary by channel and platform.",
    marquee: ["YOUTUBE", "FACEBOOK", "TIKTOK", "CREATOR STRATEGY"],
  },
  trust: {
    title: "A partner for the work behind the views.",
    cards: [
      { title: "Professional Expert Team", description: "Practical guidance from people who know the creator business.", icon: "users" },
      { title: "Reliable", description: "Thoughtful support with clear expectations at every step.", icon: "shield" },
      { title: "Strategic", description: "Smart, organic growth built around your audience and content.", icon: "target" },
      { title: "Results Driven", description: "Focused on measurable progress and outcomes that matter.", icon: "trend" },
    ],
  },
  opportunity: {
    title: "Turn your audience into an opportunity.",
    steps: [
      { number: "01", title: "Know what’s possible", description: "We review your channel and translate platform rules into a practical path forward." },
      { number: "02", title: "Build with intention", description: "A focused content and monetization strategy—built around your voice, not a template." },
    ],
  },
  services: {
    title: "The business behind the post.",
    allServicesLabel: "All services",
    cards: [
      { number: "01", title: "YouTube monetization", description: "Get to partner status, unlock revenue, and make every upload work harder.", icon: "youtube", features: ["YPP eligibility roadmap", "Channel & content audit", "AdSense setup guidance"], ctaLabel: "Explore the service" },
      { number: "02", title: "Facebook monetization", description: "Build a stronger presence and turn your videos into a dependable income stream.", icon: "users", features: ["In-stream ads readiness", "Stars & fan support setup", "Rights and policy guidance"], ctaLabel: "Explore the service" },
      { number: "03", title: "TikTok growth & earnings", description: "Create with a point of view, grow an audience, and find the right creator rewards.", icon: "video", features: ["Account health review", "Content growth plan", "Brand deal positioning"], ctaLabel: "Explore the service" },
      { number: "04", title: "Content strategy", description: "A clear creative direction that helps your content reach the right people.", icon: "clapperboard", features: ["Audience & niche mapping", "Format and publishing plan", "Performance-led iteration"], ctaLabel: "Explore the service" },
    ],
  },
  story: {
    title: "Creators First.", highlight: "Growth Always.",
    intro: "The creator economy is moving fast in Pakistan and beyond. We started SK Media to make the business side feel less intimidating—and the creative side more sustainable.",
    detail: "We help you understand your options, strengthen your content foundation, and make confident decisions about what comes next. No smoke and mirrors—just people in your corner.",
    benefits: [
      { text: "Guidance built around you", icon: "users" },
      { text: "Clear, honest advice", icon: "shield" },
      { text: "A sustainable way forward", icon: "trend" },
    ],
    ctaLabel: "Meet SK Media",
  },
  values: {
    title: "Clarity looks good on you.",
    cards: [
      { title: "Your own starting point", description: "Every channel is different. Your next steps should be, too." },
      { title: "Straight answers", description: "We’ll explain what platforms look for and what you can realistically expect." },
      { title: "A partner, not a pitch", description: "We care about the work after the first call as much as the first call itself." },
    ],
  },
  testimonials: {
    title: "Expert Guidance for Creators",
    description: "Illustrative testimonial placeholders. Replace these with approved creator feedback before publishing.",
    cards: [
      { quote: "The first time someone explained monetization without making it feel like a maze.", source: "Placeholder creator feedback", platform: "YouTube" },
      { quote: "Practical, honest and genuinely invested in helping me get the foundations right.", source: "Placeholder creator feedback", platform: "Facebook" },
      { quote: "Finally, a clear roadmap that made growth feel achievable instead of overwhelming.", source: "Placeholder creator feedback", platform: "TikTok" },
      { quote: "The advice felt personal, strategic, and realistic for the kind of channel I actually run.", source: "Placeholder creator feedback", platform: "Instagram" },
      { quote: "A simple, confident plan that helped me stop guessing and start making better decisions.", source: "Placeholder creator feedback", platform: "LinkedIn" },
      { quote: "Clear guidance made my channel feel more intentional and much less overwhelming.", source: "Placeholder creator feedback", platform: "X" },
      { quote: "For the first time, the business side of content finally felt understandable and manageable.", source: "Placeholder creator feedback", platform: "Instagram Reels" },
      { quote: "The strategy was practical, honest, and tailored to how my audience actually engages.", source: "Placeholder creator feedback", platform: "Facebook" },
      { quote: "I finally had a roadmap that felt realistic for my content and my growth goals.", source: "Placeholder creator feedback", platform: "TikTok" },
      { quote: "It felt like having a partner who understands creators, not just platform rules.", source: "Placeholder creator feedback", platform: "YouTube" },
    ],
  },
  faq: { askLabel: "Ask us directly" },
  contact: {
    title: "Let’s make your content work harder.",
    description: "Tell us where you’re at. We’ll help you find the right next step—whether you’re just starting or ready to scale.",
    whatsappLabel: "WhatsApp us",
    whatsappHint: "Prefer a direct reply? Message us on WhatsApp.",
    whatsappUrl: "https://wa.me/923110380241",
  },
  footer: {
    description: "We help creators build the business behind the content. Based in Pakistan. Working everywhere.",
    exploreLabel: "Explore",
    helloLabel: "Say hello",
    primaryPhone: "+92 311 0380241",
    secondaryPhone: "+92 343 9360383",
    email: "skmediamonetization@gmail.com",
    address: "Opposite Daewoo Terminal, IT Park First Floor, Dera Ismail Khan",
    copyright: "© 2026 SK Media Monetization. Built for the next generation of creators.",
    tagline: "Creator-first. Results-focused.",
  },
};

async function readHomeContent(): Promise<HomePageContent> {
  const [row] = await db.select().from(skHomeContentTable).where(eq(skHomeContentTable.id, 1)).limit(1);
  return row?.content ?? defaultHomeContent;
}

router.get("/home-content", async (_req, res): Promise<void> => {
  res.json(GetHomeContentResponse.parse(await readHomeContent()));
});

router.get("/admin/home-content", requireAdmin, async (_req, res): Promise<void> => {
  res.json(GetAdminHomeContentResponse.parse(await readHomeContent()));
});

router.put("/admin/home-content", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateHomeContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter valid homepage content before saving." });
    return;
  }

  const [row] = await db.insert(skHomeContentTable)
    .values({ id: 1, content: parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: skHomeContentTable.id,
      set: { content: parsed.data, updatedAt: new Date() },
    })
    .returning();
  res.json(UpdateHomeContentResponse.parse(row.content));
});

export default router;
