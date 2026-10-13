import { asc, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreatePromptBody,
  CreatePromptResponse,
  DeletePromptParams,
  DeletePromptResponse,
  GetAdminPromptsResponse,
  GetPromptBySlugParams,
  GetPromptBySlugResponse,
  GetPromptsResponse,
  UpdatePromptBody,
  UpdatePromptParams,
  UpdatePromptResponse,
} from "@workspace/api-zod";
import { db, skPromptsTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";

const router: IRouter = Router();

const promptFileTypes: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  rtf: "application/rtf",
};
const MAX_PROMPT_FILE_BYTES = 2 * 1024 * 1024;

function safePromptFilename(value: string): string {
  return value.trim().replace(/[\\/\r\n"\u0000-\u001f]/g, "_").slice(0, 255) || "prompt-file";
}

function promptFileContentType(filename: string): string | null {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return promptFileTypes[extension] ?? null;
}

function safePromptOutput<T extends { promptFileData?: string | null; removePromptFile?: boolean; promptFileName?: string | null }>(row: T) {
  const { promptFileData: _fileData, removePromptFile: _removePromptFile, promptFileName, ...output } = row;
  return promptFileName == null ? output : { ...output, promptFileName };
}

function validPromptFile(name: unknown, data: unknown): name is string {
  if (typeof name !== "string" || typeof data !== "string" || !data || data.length > 3_000_000) return false;
  const contentType = promptFileContentType(name);
  if (!contentType || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) return false;
  return Buffer.from(data, "base64").byteLength <= MAX_PROMPT_FILE_BYTES;
}

const toIsoDates = <T extends { createdAt: Date; updatedAt?: Date }>(row: T) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  ...(row.updatedAt ? { updatedAt: row.updatedAt.toISOString() } : {}),
});

router.get("/prompts", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: skPromptsTable.id,
      slug: skPromptsTable.slug,
      title: skPromptsTable.title,
      category: skPromptsTable.category,
      access: skPromptsTable.access,
      placement: skPromptsTable.placement,
      image: skPromptsTable.image,
      sortOrder: skPromptsTable.sortOrder,
      createdAt: skPromptsTable.createdAt,
    })
    .from(skPromptsTable)
    .where(eq(skPromptsTable.isPublished, true))
    .orderBy(asc(skPromptsTable.sortOrder), desc(skPromptsTable.createdAt));
  res.json(GetPromptsResponse.parse(rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))));
});

router.get("/prompts/:slug/download", async (req, res): Promise<void> => {
  const params = GetPromptBySlugParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid prompt slug." });
    return;
  }
  const [prompt] = await db
    .select({
      access: skPromptsTable.access,
      isPublished: skPromptsTable.isPublished,
      promptFileName: skPromptsTable.promptFileName,
      promptFileData: skPromptsTable.promptFileData,
    })
    .from(skPromptsTable)
    .where(eq(skPromptsTable.slug, params.data.slug))
    .limit(1);
  if (!prompt || !prompt.isPublished) {
    res.status(404).json({ error: "Prompt not found." });
    return;
  }
  if (prompt.access !== "Free") {
    res.status(403).json({ error: "Premium prompt files are not available at this access level." });
    return;
  }
  if (!prompt.promptFileName || !prompt.promptFileData) {
    res.status(404).json({ error: "This prompt has no downloadable file." });
    return;
  }
  const contentType = promptFileContentType(prompt.promptFileName);
  if (!contentType) {
    res.status(415).json({ error: "This prompt file type cannot be downloaded." });
    return;
  }
  const filename = safePromptFilename(prompt.promptFileName);
  res.setHeader("Content-Type", contentType);
  const asciiFilename = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  res.setHeader("Content-Disposition", `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(Buffer.from(prompt.promptFileData, "base64"));
});

router.get("/prompts/:slug", async (req, res): Promise<void> => {
  const params = GetPromptBySlugParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid prompt slug." });
    return;
  }
  const [prompt] = await db
    .select()
    .from(skPromptsTable)
    .where(eq(skPromptsTable.slug, params.data.slug))
    .limit(1);
  if (!prompt || !prompt.isPublished) {
    res.status(404).json({ error: "Prompt not found." });
    return;
  }
  res.json(GetPromptBySlugResponse.parse({
    id: prompt.id,
    slug: prompt.slug,
    title: prompt.title,
    category: prompt.category,
    access: prompt.access,
    placement: prompt.placement,
    image: prompt.image,
    sortOrder: prompt.sortOrder,
    createdAt: prompt.createdAt.toISOString(),
    promptText: prompt.access === "Free" ? (prompt.promptText || null) : null,
    promptFileName: prompt.promptFileName,
    hasDownloadableFile: Boolean(prompt.promptFileName && prompt.promptFileData),
  }));
});

router.get("/admin/prompts", requireAdmin, async (_req, res): Promise<void> => {
  const prompts = await db.select({
    id: skPromptsTable.id,
    slug: skPromptsTable.slug,
    title: skPromptsTable.title,
    category: skPromptsTable.category,
    access: skPromptsTable.access,
    placement: skPromptsTable.placement,
    image: skPromptsTable.image,
    promptText: skPromptsTable.promptText,
    promptFileName: skPromptsTable.promptFileName,
    isPublished: skPromptsTable.isPublished,
    sortOrder: skPromptsTable.sortOrder,
    createdAt: skPromptsTable.createdAt,
    updatedAt: skPromptsTable.updatedAt,
  }).from(skPromptsTable)
    .orderBy(asc(skPromptsTable.sortOrder), desc(skPromptsTable.createdAt));
  res.json(GetAdminPromptsResponse.parse(prompts.map((prompt) => toIsoDates(safePromptOutput(prompt)))));
});

router.post("/admin/prompts", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreatePromptBody.safeParse(req.body);
  if (!parsed.success) {
    // Log detailed validation errors for debugging
    console.error('Prompt creation validation failed:', {
      errors: parsed.error.errors,
      receivedData: {
        slug: req.body.slug ? `[${typeof req.body.slug}]` : 'missing',
        title: req.body.title ? `[${typeof req.body.title}]` : 'missing',
        category: req.body.category ? `[${typeof req.body.category}]` : 'missing',
        access: req.body.access,
        placement: req.body.placement,
        image: req.body.image ? `[${typeof req.body.image}, ${req.body.image.length} chars]` : 'missing',
        promptText: req.body.promptText ? `[${typeof req.body.promptText}]` : 'missing',
        isPublished: typeof req.body.isPublished,
        sortOrder: typeof req.body.sortOrder,
      }
    });
    res.status(400).json({ error: "Enter valid prompt details before saving." });
    return;
  }
  const { promptFileData, removePromptFile: _removePromptFile, ...promptInput } = parsed.data;
  if (!promptInput.promptText.trim() && (!promptInput.promptFileName || !promptFileData)) {
    res.status(400).json({ error: "Enter prompt text or attach a downloadable file." });
    return;
  }
  if (promptFileData && !validPromptFile(promptInput.promptFileName, promptFileData)) {
    res.status(400).json({ error: "Attach a supported PDF, TXT, MD, DOC, DOCX, or RTF file up to 2 MB." });
    return;
  }
  const promptFileName = promptFileData ? safePromptFilename(promptInput.promptFileName!) : null;
  try {
    const [prompt] = await db.insert(skPromptsTable).values({
      ...promptInput,
      promptFileName,
      promptFileData: promptFileData ?? null,
    }).returning();
    res.status(201).json(CreatePromptResponse.parse(toIsoDates(safePromptOutput(prompt))));
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      res.status(409).json({ error: "A prompt already uses this slug." });
      return;
    }
    throw error;
  }
});

router.patch("/admin/prompts/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdatePromptParams.safeParse(req.params);
  const body = UpdatePromptBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Enter valid prompt details before saving." });
    return;
  }
  const { promptFileData, removePromptFile, ...promptInput } = body.data;
  if (promptFileData && !validPromptFile(promptInput.promptFileName, promptFileData)) {
    res.status(400).json({ error: "Attach a supported PDF, TXT, MD, DOC, DOCX, or RTF file up to 2 MB." });
    return;
  }
  try {
    const [existing] = await db.select({
      promptText: skPromptsTable.promptText,
      promptFileName: skPromptsTable.promptFileName,
      promptFileData: skPromptsTable.promptFileData,
    }).from(skPromptsTable).where(eq(skPromptsTable.id, params.data.id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Prompt not found." });
      return;
    }
    const keepsExistingFile = !removePromptFile && !promptFileData && Boolean(existing.promptFileName && existing.promptFileData);
    if (!promptInput.promptText.trim() && !promptFileData && !keepsExistingFile) {
      res.status(400).json({ error: "Enter prompt text or attach a downloadable file." });
      return;
    }
    const fileUpdate = promptFileData
      ? { promptFileName: safePromptFilename(promptInput.promptFileName!), promptFileData }
      : removePromptFile ? { promptFileName: null, promptFileData: null } : {};
    const [prompt] = await db.update(skPromptsTable)
      .set({ ...promptInput, ...fileUpdate, updatedAt: new Date() })
      .where(eq(skPromptsTable.id, params.data.id))
      .returning();
    res.json(UpdatePromptResponse.parse(toIsoDates(safePromptOutput(prompt))));
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      res.status(409).json({ error: "A prompt already uses this slug." });
      return;
    }
    throw error;
  }
});

router.delete("/admin/prompts/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeletePromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid prompt id." });
    return;
  }
  const [deleted] = await db.delete(skPromptsTable)
    .where(eq(skPromptsTable.id, params.data.id))
    .returning({ id: skPromptsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Prompt not found." });
    return;
  }
  res.json(DeletePromptResponse.parse({ success: true }));
});

export default router;
