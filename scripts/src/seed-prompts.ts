import "dotenv/config";
import { db, skPromptsTable } from "@workspace/db";

const prompts = [
  {
    slug: "hyper-real-aerial-wildlife-predator-prey-chase-engine",
    title: "Hyper-real aerial wildlife predator-prey chase engine",
    category: "Nature & Wildlife",
    access: "Premium" as const,
    image: "photo-1516026672322-bc52d61a55d5",
    promptText: "Create a photorealistic wildlife chase film from a high aerial perspective. Establish the landscape and both animals before the pursuit begins. Track the action smoothly without unsafe or impossible animal behavior; use natural movement, authentic terrain, realistic shadows, and a restrained documentary color grade. Build tension through changing distance and framing, then end on a clear, compelling resolution. Avoid text, logos, and artificial-looking motion.",
    sortOrder: 0,
  },
  {
    slug: "private-dream-homestead-luxury-rural-estate-content-engine",
    title: "Private dream homestead / luxury rural estate content engine",
    category: "Nature & Wildlife",
    access: "Premium" as const,
    image: "photo-1449158743715-0a90ebb6d2d8",
    promptText: "Create a cinematic, photorealistic tour of a secluded luxury homestead. Open with a wide establishing view, then reveal the entrance, warm interior details, garden, and surrounding countryside in a logical visual sequence. Use gentle drone movement, natural daylight, realistic materials, and calm ambient sound. Keep the architecture consistent between shots and finish with a memorable sunset view. No text, logos, or abrupt transitions.",
    sortOrder: 1,
  },
  {
    slug: "hyper-real-colossal-wildlife-aerial-sighting-engine",
    title: "Hyper-real colossal wildlife aerial sighting engine",
    category: "Historical & Nostalgia",
    access: "Premium" as const,
    image: "photo-1511497584788-876760111969",
    promptText: "Create a grounded documentary-style aerial sighting of an unusually large wild animal moving through a vast forest. Begin with an ordinary landscape, reveal scale through treetops and shadows, then follow the animal at a respectful distance. Preserve realistic anatomy, lighting, atmospheric perspective, and consistent geography. Keep the scene mysterious rather than frightening; use subtle camera movement and natural sound, with no captions or visible branding.",
    sortOrder: 2,
  },
  {
    slug: "cinematic-comfort-food-recipe-reel",
    title: "Cinematic comfort-food recipe reel",
    category: "Food & Cooking",
    access: "Free" as const,
    image: "photo-1547592180-85f173990554",
    promptText: "Create a warm, cinematic short-form recipe video for a comforting home-cooked meal. Show fresh ingredients, clear preparation steps, close-ups of satisfying textures, the cooking process, and a beautifully plated final dish. Use soft window light, appetizing natural colors, steady macro shots, and smooth cuts. Keep ingredients and cookware consistent, make each action easy to follow, and end with a finished serving. Avoid on-screen text and logos.",
    sortOrder: 3,
  },
  {
    slug: "tiny-home-transformation-story",
    title: "Tiny home transformation story",
    category: "DIY & Crafts",
    access: "Free" as const,
    image: "photo-1484154218962-a197022b5858",
    promptText: "Create a satisfying before-and-after transformation of a compact, lived-in room into a thoughtful tiny-home interior. Show the original space, planning details, practical improvements, and final reveal in the same camera angle where possible. Keep the layout believable and the objects consistent. Use bright natural light, clean craftsmanship close-ups, and a calm pace that makes the change easy to understand. Finish on a wide shot of the usable room; no text or logos.",
    sortOrder: 4,
  },
  {
    slug: "dreamlike-fantasy-world-reveal",
    title: "Dreamlike fantasy-world reveal",
    category: "Fantasy & Sci-Fi",
    access: "Premium" as const,
    image: "photo-1518709268805-4e9042af9f23",
    promptText: "Create a cinematic reveal of an original, dreamlike fantasy landscape. Start with a small visual clue in the foreground, then slowly uncover an expansive world with distinctive architecture, atmospheric skies, and layered terrain. Use coherent art direction, graceful camera movement, rich but balanced color, and believable light across every shot. Keep the world visually consistent and end with one striking composition that invites curiosity. Avoid familiar copyrighted characters, text, and logos.",
    sortOrder: 5,
  },
  {
    slug: "satisfying-macro-restoration-loop",
    title: "Satisfying macro restoration loop",
    category: "ASMR & Satisfying",
    access: "Free" as const,
    image: "photo-1470252649378-9c29740c9fa8",
    promptText: "Create a seamless macro restoration video of a small, well-worn everyday object being carefully cleaned and restored. Show close-up, plausible steps in order: inspection, gentle cleaning, repair, polishing, and the final reveal. Emphasize tactile textures, precise hand movements, soft studio lighting, and satisfying natural sounds. Keep the object identical throughout and make the last frame visually connect to the opening frame for a clean loop. No text or logos.",
    sortOrder: 6,
  },
  {
    slug: "animal-rescue-an-emotional-short-film-arc",
    title: "Animal rescue: an emotional short-film arc",
    category: "Animal & Pets",
    access: "Premium" as const,
    image: "photo-1450778869180-41d0601e046e",
    promptText: "Create a compassionate, cinematic short film about a fictional animal rescue and recovery. Tell the story in clear stages: discovery from a safe distance, careful help from trained rescuers, patient recovery, and a hopeful reunion or adoption moment. Keep the animal's appearance consistent and portray humane, non-graphic care. Use natural light, intimate but respectful close-ups, gentle pacing, and an uplifting ending. Do not stage dangerous handling or include text/logos.",
    sortOrder: 7,
  },
];

const inserted = await db.insert(skPromptsTable).values(prompts.map((prompt) => ({ ...prompt, isPublished: true }))).onConflictDoNothing({
  target: skPromptsTable.slug,
}).returning({ id: skPromptsTable.id });

console.info(`Seeded ${inserted.length} prompt${inserted.length === 1 ? "" : "s"}; existing slugs were left unchanged.`);
process.exit(0);
